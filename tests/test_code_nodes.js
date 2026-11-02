// Runs the n8n Code nodes (code/*.js) outside n8n, with fake inputs instead of the AI.
// Usage (from the repository root):  node tests/test_code_nodes.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

// run one Code node: $input = the node's input, $('Name') = the output of another node
function run(file, input, nodes = {}) {
  const code = fs.readFileSync(path.join(__dirname, "..", "code", file), "utf8");
  const $input = { first: () => ({ json: input }), all: () => [{ json: input }] };
  const $ = name => ({ first: () => ({ json: nodes[name] }) });
  return new Function("$input", "$", code)($input, $)[0].json;
}

// what Ollama would answer
const aiAnswer = (details, evidence) =>
  ({ message: { content: JSON.stringify({ title: "Contract checks", category: "Document processing", details, evidence }) } });

// one chat message through Normalize chat -> Transcript -> (fake AI) -> Rules; returns the row Save would store
function turn(row, text, details = {}, evidence = {}) {
  const input = run("normalize_chat.js", { sessionId: "s1", chatInput: text });
  const t = run("transcript.js", row, { Input: input });
  return run("rules.js", aiAnswer(details, evidence), { Transcript: t });
}

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok  " + name); }

test("solution-first idea: solution kept separately, Tomte asks 3 questions", () => {
  const row = turn({}, "Can you build an AI agent that checks our contracts?",
    { proposed_solution: "An AI agent that checks contracts", problem: "what goes wrong today" },   // copied from the prompt
    { proposed_solution: "build an AI agent that checks our contracts", problem: "checks our contracts" });
  assert.strictEqual(row.proposed_solution, "An AI agent that checks contracts");
  assert.strictEqual(row.problem, "", "value unrelated to its quote must be rejected");
  assert.strictEqual(row.status, "awaiting_details");
  assert.strictEqual(row.rounds, 1);
  assert.strictEqual((row.reply.match(/^\d\./gm) || []).length, 3);
});

test("full conversation reaches ready_for_triage, invented facts are dropped", () => {
  let row = turn({}, "Can you build an AI agent that checks our contracts?",
    { proposed_solution: "An AI agent that checks contracts" }, { proposed_solution: "build an AI agent that checks our contracts" });
  row = turn(row, "Hi Tomte,\n\nOur project managers read about 20 supplier contracts a month by hand.\n\nSometimes they miss penalty clauses.",
    { problem: "Penalty clauses are sometimes missed", affected: "Project managers",
      current_process: "About 20 supplier contracts a month are read by hand", systems_and_data: "Contracts stored in Excel" },
    { problem: "Sometimes they miss penalty clauses", affected: "Our project managers",
      current_process: "read about 20 supplier contracts a month by hand", systems_and_data: "stored in Excel" });
  assert.strictEqual(row.systems_and_data, "", "Excel was never mentioned");
  assert.strictEqual(row.missing, "desired_outcome");
  assert.match(row.reply, /What should be better/);
  row = turn(row, "Nothing should be missed anymore.",
    { desired_outcome: "Nothing should be missed anymore" }, { desired_outcome: "Nothing should be missed anymore" });
  assert.strictEqual(row.status, "ready_for_triage");
  assert.strictEqual(row.affected, "Project managers", "earlier answers are remembered");
  assert.strictEqual(row.proposed_solution, "An AI agent that checks contracts");
});

test("vague idea: thin answers don't count, Tomte stops after 2 rounds", () => {
  let row = turn({}, "We have way too many project notes now. We somehow need to automate this.",
    { affected: "The team managing projects", desired_outcome: "Project notes should be automated" },
    { affected: "We", desired_outcome: "" });
  assert.strictEqual(row.affected, "");
  row = turn(row, "Not sure, it's just a lot.");
  assert.strictEqual(row.status, "awaiting_details");
  row = turn(row, "I don't know.");
  assert.strictEqual(row.status, "needs_info");
  assert.strictEqual(row.rounds, 2);
});

test("broken AI answer does not crash the flow", () => {
  const input = run("normalize_chat.js", { sessionId: "s2", chatInput: "Too many notes." });
  const t = run("transcript.js", {}, { Input: input });
  const row = run("rules.js", { message: { content: "not json" } }, { Transcript: t });
  assert.strictEqual(row.status, "awaiting_details");
});

test("email: sender + subject form the conversation, quoted reply text is dropped", () => {
  const m = run("normalize_email.js", { from: "Anna <anna@example.com>", subject: "Re: [Idea] Contract checks",
    textPlain: "Nothing should be missed.\n\nOn Mon, 2 Nov 2026 at 20:30, Tomte <tomte@example.com>\nwrote:\n> Thanks!" });
  assert.strictEqual(m.sessionId, "anna@example.com|[idea] contract checks");
  assert.strictEqual(m.chatInput, "Nothing should be missed.");
  const html = run("normalize_email.js", { from: "a@example.com", subject: "[Idea] X",
    textHtml: '<div dir="ltr">Can you build an AI agent?</div>' });
  assert.strictEqual(html.chatInput, "Can you build an AI agent?");
});

console.log(`\n${passed} tests passed`);
