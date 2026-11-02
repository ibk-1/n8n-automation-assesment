# Tomte intake – wyn.link assessment

An n8n workflow that turns an unstructured idea into a structured wyn.link backlog item:

**message → local AI reads it → rules find what's missing → Tomte asks only that, in the same conversation → one row in the backlog table**

The concept and the reasoning behind it are in **[CONCEPT.md](CONCEPT.md)**.

```
chat ──────────────────────────────────────── Normalize chat ─┐
                                                              ├→ Input → Get row → Transcript → Ollama → Rules → Save → If (email?)
Email Trigger (IMAP) → Only Ideas → Normalize email ──────────┘                                                     ├ true  → Send an Email
                                                                                                                   └ false → Reply (chat)
```

| Node | What it does |
|---|---|
| `chat` / `Email Trigger (IMAP)` | Entry points (channels) |
| `Normalize chat` / `Normalize email` | Turn each channel's message into the same shape: `sessionId`, `chatInput`, `channel`, `sender`, `subject` |
| `Input` | Meeting point – everything after it is the same for every channel |
| `Get row` | Loads what is already known about this conversation from the backlog table |
| `Transcript` | Adds the new message to the conversation and prepares the request for the AI |
| `Ollama` | Local AI (llama3.1) fills the fields and quotes the person's words as evidence |
| `Rules` | Checks the evidence, finds missing must-haves, decides Tomte's reply and the status – no AI |
| `Save` | Inserts or updates the idea's row (by `session_id`) |
| `If` → `Reply` / `Send an Email` | Answers on the channel the message came from |

## Repository

```
workflow/tomte_intake.json   the n8n workflow – import this
code/                        readable copies of the four Code nodes (identical to the code in the workflow)
data-table/                  columns of the backlog table (a data table is not part of a workflow export)
examples/                    the example requests and ready-to-type test conversations
tests/test_code_nodes.js     runs the Code nodes outside n8n with fake AI answers
CONCEPT.md                   problem, user journey, decisions, trade-offs, next steps
```

## Setup (about 15 minutes)

1. **Local AI** – install [Ollama](https://ollama.com), then `ollama pull llama3.1`
2. **n8n** (Node.js 20 or 22) – `npm install -g n8n`, then `n8n start`, open http://localhost:5678
3. **Backlog table** – *Overview → Data tables → Create* a table `tomte_backlog` with the columns in
   [data-table/tomte_backlog_columns.md](data-table/tomte_backlog_columns.md)
4. **Import** – *Workflows → Import from file* → `workflow/tomte_intake.json`.
   Open `Get row` and `Save` and select the `tomte_backlog` table (table IDs differ per installation).
5. **Publish** the workflow, then click **Open chat** and use a conversation from
   [examples/TEST_MESSAGES.md](examples/TEST_MESSAGES.md). Reset the chat session before each new idea.
   The results appear in *Data tables → tomte_backlog*.

## Optional: email channel

The email path is included but **deactivated** (`Email Trigger (IMAP)` is disabled). To try it, create an
*IMAP* and an *SMTP* credential for a test mailbox (e.g. Gmail with an app password: `imap.gmail.com:993`,
`smtp.gmail.com:465`, SSL), select them in `Email Trigger (IMAP)` and `Send an Email`, set your address in
`Send an Email → From`, then enable the trigger and publish.
Only emails with "Idea" in the subject are processed (`Only Ideas`). Send from a different address than the
test mailbox. No credentials are included in this repository.

## Tests

```bash
node tests/test_code_nodes.js
```
Plays full conversations through the Code nodes with fake AI answers – including invented or unrelated
answers that the rules must reject – plus the email parsing.

## Notes

- `Ollama` calls `http://127.0.0.1:11434` (not `localhost`), because n8n otherwise tries IPv6 first.
- The model is set in the `Transcript` node (`llama3.1`, chosen because it returns strict JSON reliably).
- Behaviour is configured at the top of the `Rules` node: must-have fields, questions, `MAX_QUESTIONS`, `MAX_ROUNDS`.
