# Data table `tomte_backlog`

One row = one idea. Create these columns, all of type **string**:

| Column | Meaning |
|---|---|
| `session_id` | Which conversation this is (chat session ID, or email sender + subject) |
| `title` | Short topic name, suggested by AI |
| `category` | One of: Process automation, Data transfer & integration, Document processing, Knowledge & search, Reporting & analytics, Internal tool, Unclear |
| `status` | `awaiting_details`, `ready_for_triage` or `needs_info` |
| `rounds` | How many times Tomte asked follow-up questions (max 2) |
| `problem` | **Must-have.** What goes wrong today |
| `affected` | **Must-have.** Who has the problem |
| `current_process` | **Must-have.** How it is done today |
| `desired_outcome` | **Must-have.** What should be different afterwards |
| `pain_and_effort` | Time, errors, frequency |
| `systems_and_data` | Systems, files, documents involved |
| `proposed_solution` | A solution the person asked for (kept separate from the problem) |
| `missing` | Must-haves still empty |
| `reply` | Tomte's last message |
| `transcript` | The whole conversation (`Person:` / `Tomte:`) |

The same column list as CSV header: [tomte_backlog_columns.csv](tomte_backlog_columns.csv).
