# Concept – Tomte as the single intake for wyn.link

## 1. Problem understanding

Ideas reach wyn.link through email, Teams and hallway conversations, in very different quality.
They get lost, the team has to chase people for basic information, and ideas can't be compared.

The core problem is **not** collecting messages – it is turning a half-formed thought into something the
team can **understand and compare**, with as little effort as possible for the person who had the idea.
Two users pull in opposite directions:

- **Submitter:** wants to drop an idea quickly; may not know the systems or the right solution.
- **wyn.link team:** needs the real problem, who has it, how it works today and what should improve.

People also often send a **solution** ("build an AI agent") instead of a problem. The intake keeps the
suggestion, but still uncovers the underlying problem.

## 2. User journey

1. The person writes to Tomte in their own words, where they already are (chat; email as a second channel).
2. Tomte replies **in the same conversation**, asking only what is still missing – at most 3 questions.
3. The person just answers. Tomte asks the rest, or confirms "ready for the wyn.link team".
4. After 2 rounds Tomte stops asking and hands the idea over with the gaps listed –
   nobody gets interrogated, and no idea gets lost.
5. The team finds every idea as one row in the same backlog table, whatever channel it came from.

I first built a version that replied with a link to a form. Testing showed that leaving the conversation to
fill a form is too much friction, especially in chat – so Tomte now asks where the person already is.

## 3. Information need

| Must-have (needed to understand the problem) | Helpful, can stay open |
|---|---|
| Problem – what goes wrong today | Pain & effort (time, errors, frequency) |
| Who is affected | Systems, data, documents |
| How it works today | Proposed solution |
| Desired outcome | |

The must-haves describe a problem **without** choosing a solution. Unknown details become **open questions**
for the team instead of blocking. A detailed message gets one or two questions, a vague one more.

## 4. Solution approach

- **Conversation, not a form:** lowest friction, and it works the same in any channel.
- **Prepared questions, not generated ones:** one question per must-have – predictable and easy to change.
- **n8n:** every step is a visible node, easy to change live, and a new channel is just another trigger in
  front of the same flow. All decisions live in one small Code node (`Rules`, copied in `code/rules.js`),
  so the team can change questions, limits or required fields in one place.

## 5. AI / automation

**AI reads, rules decide.**

- **AI (local llama3.1 via Ollama)** only turns free text into fields – where rules fail, because people
  describe the same thing in endless ways and in two languages. I rejected keyword rules for this.
- **Rules, no AI**, decide what is required, which question to ask, when to stop and the status.
  Predictable, explainable, and the team can change them.
- **The AI must prove every field.** For each field it quotes the person's own words; plain code checks that
  the quote really appears in what the person wrote and matches the value. No quote, no field – Tomte asks
  instead. In testing, the AI turned the vague "automate project notes" into four plausible-sounding fields,
  and once copied text from its own instructions into a field; both are now rejected.
- **Local model:** ideas can contain contracts or customer data, so nothing leaves the machine; no paid service.
- **AI never blocks:** if the answer is unusable, Tomte simply knows nothing new and asks.

## 6. Data / architecture

```
channel trigger → Normalize (same shape: sessionId, text, channel, sender)
  → Input → Get row (what do we know?) → Transcript (add message) → Ollama (fields + evidence)
  → Rules (check, find gaps, decide) → Save (upsert row) → reply on the same channel
```

- **Channel independence:** each channel only needs a trigger and a small Normalize node. Chat and email
  share everything after `Input`.
- **Conversation memory:** the `session_id` links all messages of one idea (chat session; for email,
  sender + subject without "Re:").
- **The backlog item** is one row of `tomte_backlog` with fixed columns: title, category, status, rounds,
  the 7 detail fields, missing must-haves, open questions, last reply and the full transcript.
  It can be exported or read by another system; in production it would live in the team's backlog tool.

## 7. Trade-offs (deliberately not built)

- **Real Tomte mailbox / Teams:** not available; the n8n chat stands in for a messenger. The email channel is
  included as a sketch (trigger deactivated): it works with a test mailbox, but replies don't appear as one
  thread in the mail client, because the simple SMTP node can't set reply headers (Microsoft Graph would).
- **How Tomte recognises a new idea:** in the prototype, a chat session or `[Idea]` in the email subject.
- **Prioritisation, duplicate detection, notifications, authentication, editing by the team.**
- **German questions:** the AI understands German, the prepared questions are English for now.

## 8. Next steps

1. **Real channels:** the Tomte mailbox and a Teams bot via Microsoft Graph, each as a trigger + Normalize
   node in front of the same flow.
2. **Help the team triage:** flag similar ideas (several people with the same Excel problem raise its
   priority) and add a simple, explainable priority score based on effort, frequency and people affected.

## Assumptions

I had no access to wynkraft's systems or users, so these are worth checking:

- People prefer answering a short question where they are over filling in a form elsewhere.
- Submitters often don't know system names or the right solution, but they do know their pain.
- wynkraft works with Microsoft 365, so production channels would use Microsoft Graph.
- Ideas can contain sensitive data, so AI must run locally or in a trusted environment.
- For the team, comparable items with honest gaps are more useful than complete but slow submissions.
