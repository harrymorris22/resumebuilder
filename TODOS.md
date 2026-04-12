# TODOS

## Resume Builder Features

**Priority:** P2
### Quick-Tailor Shortcut (Cmd+K)
Cmd+K keyboard shortcut opens a "paste job description" modal for instant resume tailoring. Fastest path from "found a job" to "resume is tailored." Core user applies to 20 companies — this makes each one 10 seconds instead of 2 minutes.
- **Effort:** S (CC: ~15 min)
- **Depends on:** Action Suggestions feature

**Priority:** P3
### Completed Actions Log
Collapsible "Completed (N)" section at bottom of action panel showing what the AI already fixed. Users can expand to see history and re-open any action. Gives sense of accomplishment and answers "what did it change?"
- **Effort:** S (CC: ~10 min)
- **Depends on:** Action-list UI (shipped)

## Completed

### Prompt Injection Mitigation ✓
Shipped in v0.5.2.0. XML boundary tags around all user content in prompts, defense preamble on every system prompt, sanitization of common injection patterns (role markers, tag escapes, code fence breakouts). 21 tests. Covers all 5 prompt builders + 3 inline prompts.

### IndexedDB → Firestore Migration ✓
Shipped in v0.5.1.0. When a user with local IDB data signs in for the first time, a modal offers to upload their data to Firestore. Covers all 7 data types including per-resume cover letters. 19 tests.

### Before/After Resume Diff ✓
Shipped in v0.4.2.0. Toggle in RefineStep shows word-level inline diff after AI suggestions.
