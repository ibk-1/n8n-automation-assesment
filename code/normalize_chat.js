// n8n Code node "Normalize chat" (copy of the code inside workflow/tomte_intake.json)
const c = $input.first().json;
return [{ json: { sessionId: c.sessionId, chatInput: c.chatInput,
                  channel: "chat", sender: "chat user", subject: "" } }];
