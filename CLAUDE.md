# Resume Builder — Project Guide

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Testing
- Run: `npm run test` (vitest)
- Test directory: `src/**/*.test.*`
- See test files for conventions (vitest + @testing-library/react)
- 100% test coverage is the goal
- When writing new functions, write a corresponding test
- When fixing a bug, write a regression test
- Never commit code that makes existing tests fail
