# Test conversations

Reset the chat session before each one (one session = one idea). The AI phrases things
differently each time – watch the behaviour, not the exact words.

## 1. Solution first (Request 3) – ends ready
1. `Can you build an AI agent that checks our contracts?`
   → 3 questions; `proposed_solution` filled, `problem` empty
2. `Our project managers read about 20 supplier contracts a month by hand, and sometimes they miss penalty clauses.`
   → only the desired outcome is asked
3. `Nothing should be missed anymore, and reviews should take less time.`
   → ready for triage

## 2. Concrete (Request 2) – few questions
1. `Every Friday we manually copy around 150 rows from an Excel file into our CRM. It takes about two hours and mistakes sometimes happen. There should be a better way.`
   → fewer questions ("we" and "a better way" don't count as answers)
2. `It's the two of us in sales support. We want the rows to land in the CRM automatically, without typing errors.`
   → ready for triage

## 3. Vague (Request 1) – Tomte stops after two rounds
1. `We have way too many project notes now. We somehow need to automate this.` → 3 questions
2. `Not sure, it's just a lot.` → "Almost done" + questions
3. `I don't know.` → handed over, status `needs_info`, gaps listed

## 4. German
1. `Hallo Tomte, wir suchen jedes Mal ewig auf dem SharePoint nach alten Angeboten, wenn ein ähnliches Projekt reinkommt. Geht das nicht einfacher?`
   → questions (prepared in English); fields are filled in German

## Email (optional)
From a different address, send to the Tomte mailbox with subject `[Idea] Contract checks`
and the texts from conversation 1, replying to each of Tomte's emails.
