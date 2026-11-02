// n8n Code node "Normalize email" (copy of the code inside workflow/tomte_intake.json)
const m = $input.first().json;
const sender = (String(m.from || "").match(/[\w.+-]+@[\w.-]+\.\w+/) || ["unknown"])[0].toLowerCase();
// one conversation = same sender + same subject (without Re:/AW:)
const subject = String(m.subject || "").replace(/^\s*((re|aw|fwd|wg)\s*:\s*)+/i, "").trim();

// the email text: plain version, or the HTML version without tags
const raw = m.textPlain || m.text || String(m.textHtml || "")
  .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(div|p)>/gi, "\n")
  .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");

// keep only the new text of a reply, drop the quoted earlier mail
const body = String(raw)
  .split(/\n\s*(?:On [\s\S]{0,200}?wrote:|Am [\s\S]{0,200}?schrieb[\s\S]{0,60}?:)/)[0]
  .split("\n").filter(line => !line.startsWith(">")).join("\n").trim();

return [{ json: { sessionId: `${sender}|${subject.toLowerCase()}`, chatInput: body,
                  channel: "email", sender, subject } }];
