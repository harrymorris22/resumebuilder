# Changelog

All notable changes to this project will be documented in this file.

## [0.1.1.0] - 2026-03-22

### Added
- Action suggestion chips in chat panel — contextual buttons that change based on resume state (empty, populated, job mode)
- AI-driven `suggest_actions` tool — Claude suggests personalized next steps after resume modifications
- Smart onboarding flow — guided first-visit wizard replacing blank chat greeting (Upload or Start from scratch)
- Resume Score (0-100) with category breakdown (contact, summary, experience, education, skills, extras)
- Coach Note — persistent AI recommendation at top of resume preview panel
- Post-upload auto-analysis — AI automatically analyzes uploaded resumes without user prompting
- Proactive coaching in system prompt — AI now identifies weak bullets, flags missing sections, asks probing questions
- TODOS.md for tracking deferred features (Cmd+K shortcut, Before/After diff)

### Fixed
- React hooks ordering in ResumePreview (called after conditional return)

## [0.1.0.1] - 2026-03-22

### Fixed
- Chat input now supports Shift+Enter for newlines (converted from single-line input to auto-resizing textarea)
- Chat text area starts at 3 rows and grows up to 8 rows for comfortable long-form input

## [0.1.0.0] - 2026-03-21

### Added
- Upload existing resume (PDF, DOCX, TXT) and parse into editable sections via Claude
- Drag-and-drop file upload with progress states and error handling
- Resume parser service with dynamic imports for PDF.js and Mammoth
- Vitest + Testing Library test framework with CI pipeline
- GitHub Actions workflow for automated test runs
