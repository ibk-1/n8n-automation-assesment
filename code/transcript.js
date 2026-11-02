// n8n Code node "Transcript" (copy of the code inside workflow/tomte_intake.json)
const chat = $('Input').first().json;
const row = $input.first().json;
const known = row && row.session_id ? row : {};

// conversation so far + the new message
const message = String(chat.chatInput || "").replace(/\s*\n\s*\n\s*/g, "\n").trim();  // no blank lines inside one message
const transcript = (known.transcript ? known.transcript + "\n\n" : "") + "Person: " + message;
// only the person's own words (used later to check the AI's evidence)
const said = transcript.split("\n\n").filter(t => t.startsWith("Person: ")).map(t => t.slice(8)).join("\n");

const FIELDS = ["problem", "affected", "current_process", "desired_outcome",
                "pain_and_effort", "systems_and_data", "proposed_solution"];
const CATEGORIES = ["Process automation", "Data transfer & integration", "Document processing",
                    "Knowledge & search", "Reporting & analytics", "Internal tool", "Unclear"];
const strings = { type: "object", required: FIELDS,
                  properties: Object.fromEntries(FIELDS.map(f => [f, { type: "string" }])) };

const SYSTEM = `You help "Tomte", the intake assistant of the wyn.link team, turn a colleague's idea into a backlog item.
The input is a conversation between a colleague ("Person") and Tomte. Use only what the Person says.
Fill a field ONLY if the Person actually said it. Otherwise return "". Never invent anything.
- problem: what goes wrong today (not a solution)
- affected: roles or teams with the problem ("we" alone does not count)
- current_process: how the work is actually done today ("manual" alone does not count)
- desired_outcome: what concretely should be different ("better" or "automate it" alone does not count)
- pain_and_effort: time, errors, frequency
- systems_and_data: systems, files, documents
- proposed_solution: a solution the Person asks for, e.g. "an AI agent"
evidence: for every field you fill, copy the Person's exact words that support it. No quote, no field.
title: neutral topic name, max 8 words. category: one of ${CATEGORIES.join(", ")}.
Example: "Can you build an AI agent for invoices?" -> proposed_solution: "An AI agent for invoices", evidence: "build an AI agent for invoices", problem: "" (no problem described yet).
`;

const payload = {
  model: "llama3.1",
  stream: false,
  options: { temperature: 0 },
  format: { type: "object", required: ["title", "category", "details", "evidence"],
            properties: { title: { type: "string" }, category: { type: "string", enum: CATEGORIES },
                          details: strings, evidence: strings } },
  messages: [{ role: "system", content: SYSTEM }, { role: "user", content: transcript }],
};

return [{ json: { session_id: chat.sessionId, known, transcript, said, payload } }];
