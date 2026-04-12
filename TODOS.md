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

## Security

**Priority:** P2
### Prompt Injection Mitigation
User-supplied content (resume text, job descriptions, content pool items) is interpolated into system prompts sent to the Anthropic API. A malicious user could craft content that manipulates AI behavior. Add input sanitization and/or structured prompt boundaries.
- **Effort:** M (CC: ~30 min)
- **Depends on:** Nothing

## Data Migration

**Priority:** P2
### IndexedDB → Firestore Migration
Existing users who sign in for the first time have data in IndexedDB but nothing in Firestore. Build a one-time migration flow that detects local IDB data when a user first authenticates and offers to upload it to their Firestore account.
- **Effort:** M (CC: ~30 min)
- **Depends on:** Firebase Auth (Phase 2)

## Completed

### Before/After Resume Diff ✓
Shipped in v0.4.2.0. Toggle in RefineStep shows word-level inline diff after AI suggestions.
