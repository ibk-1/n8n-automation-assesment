// n8n Code node "Rules" (copy of the code inside workflow/tomte_intake.json)
const prev = $('Transcript').first().json;
const known = prev.known;

// read the AI answer safely - if it's broken, we just know nothing new
let ai = {};
try { ai = JSON.parse($input.first().json.message.content); } catch (e) { ai = {}; }

const MUST = ["problem", "affected", "current_process", "desired_outcome"];
const OPTIONAL = ["pain_and_effort", "systems_and_data", "proposed_solution"];
const LABELS = { problem: "the problem", affected: "who is affected",
                 current_process: "how it works today", desired_outcome: "the desired outcome" };
const QUESTIONS = {
  problem: "What exactly goes wrong, takes too long or is annoying today?",
  affected: "Who is affected (role or team), and roughly how many people?",
  current_process: "How is it done today, step by step?",
  desired_outcome: "What should be better once this is solved? How would you notice?",
};
const MAX_QUESTIONS = 3;
const MAX_ROUNDS = 2;

// evidence check: the AI's quote must really come from the person's words
const words = s => (String(s || "").toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
const quoted = (quote, source) => {
  const w = words(quote).filter(x => x.length > 2);
  const have = new Set(words(source));
  return w.length >= 2 && w.every(x => have.has(x));
};
const filled = v => String(v || "").trim().length >= 5;

// merge: new AI value only if backed by a quote, otherwise keep what we knew
const fields = {};
for (const f of [...MUST, ...OPTIONAL]) {
  const value = ai.details?.[f];
  const related = words(value).some(w => w.length > 3 && words(ai.evidence?.[f]).includes(w));
  fields[f] = filled(value) && quoted(ai.evidence?.[f], prev.said) && related ? value.trim() : (known[f] || "");}

// decide Tomte's reply
const missing = MUST.filter(f => !filled(fields[f]));
let rounds = Number(known.rounds || 0);
let status, reply;
if (missing.length === 0) {
  status = "ready_for_triage";
  reply = "Thanks, that's everything I need. Your idea is ready for the wyn.link team.";
} else if (rounds >= MAX_ROUNDS) {
  status = "needs_info";
  reply = "Thanks, I've passed your idea on. The wyn.link team may come back to you about: "
        + missing.map(f => LABELS[f]).join(", ") + ".";
} else {
  rounds += 1;
  status = "awaiting_details";
  const questions = missing.slice(0, MAX_QUESTIONS).map((f, i) => `${i + 1}. ${QUESTIONS[f]}`).join("\n");
  reply = (rounds === 1 ? "Thanks! A few quick questions so the wyn.link team understands it:"
                        : "Thanks, that helps. Almost done:") + "\n" + questions;
}

return [{ json: {
  session_id: prev.session_id,
  title: ai.title || known.title || "",
  category: ai.category || known.category || "Unclear",
  status, rounds, ...fields,
  missing: missing.join(", "),
  reply,
  transcript: prev.transcript + "\n\nTomte: " + reply,
} }];
