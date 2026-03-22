# Changelog

All notable changes to this project will be documented in this file.

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
