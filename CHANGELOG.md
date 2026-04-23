# Changelog

All notable changes to this project will be documented in this file.

## [0.7.0.0] - 2026-04-23

### Added
- **Interview Prep** — new "Interview Prep" tab in the header (CV/job agnostic, always accessible). Opens a drawer with 12 common interview questions grouped into opener, behavioural, strengths/weaknesses, and motivation categories. Click "Generate Answer" per question, or "Generate All" to fan out 12 parallel requests (concurrency capped at 3). Answers are 3-5 first-person bullets grounded only in the content pool. No fabrication: if the pool lacks material for a question, the AI returns a single meta-bullet prompting the user to add pool entries.
- **Generate All + Copy All + Clear All** — batch actions on the drawer header. Live progress counter ("3 / 12 answered") with failed-count indicator. Per-card Copy / Regenerate / Clear actions.
- **Anthropic prompt caching** — content pool serialized once per batch with `cache_control: { type: 'ephemeral' }`, so the 11 follow-up calls read the pool from cache at ~10% input cost.
- Full persistence: answers saved to IndexedDB (DB version bumped 4 → 5, new `interviewPrep` store) and Firestore (`users/{uid}/interviewPrep/default`), synced across devices.
- `InterviewPrepDrawer`, `InterviewPrepPage`, `InterviewPrepCard` components matching the Content Pool drawer pattern.
- `useGenerateInterviewAnswer` hook (per-card) and `useGenerateAllInterviewAnswers` orchestrator (inline `pLimit(3)`, per-question failure isolation, abort support).
- `generate_interview_answer` tool added to Anthropic tool handler with `onInterviewAnswerGenerated` callback.
- `buildInterviewAnswerPrompt` system prompt with DEFENSE_PREAMBLE, grounding rules, and thin-pool fallback.
- Chat-bubble header button next to Content Pool / My Resumes.

## [0.6.0.0] - 2026-04-14

### Added
- **Interview questions generator** — new "Questions" tab in the Refine step. Enter a company website URL and generate 5 tailored interview questions based on your resume, job description, and company context. Questions are specific, research-backed, and role-relevant. Includes Copy All and Regenerate.
- Full persistence: questions saved to IndexedDB and Firestore, synced across devices
- `InterviewQuestionsPanel` component with company URL input, loading states, error handling, and numbered question cards
- `useGenerateInterviewQuestions` hook with streaming AI generation and abort support
- `buildInterviewQuestionsPrompt` system prompt for generating company-specific questions
- Questions tab added to both RefineStep wizard and RightPanel non-wizard view

## [0.5.3.7] - 2026-04-12

### Fixed
- **AI now sees role descriptions in content pool** — all 4 prompt builders (generation, pool recommendations, JD recommendations, cover letter) now include the description field when serializing pool data. Previously stripped to company+title only.
- **AI can update role descriptions on existing experience** — `update_experience_bullets` tool now accepts an optional `description` field alongside bullets.
- **CV upload captures role descriptions** — resume parser schema now extracts descriptions from uploaded CVs into content pool context.

## [0.5.3.6] - 2026-04-12

### Added
- **Role descriptions editable in content pool** — click "Add role description..." below the dates on any job group in the content pool. Auto-resizing textarea fits the text as you type. Descriptions sync to the matching experience entry on the active resume automatically.

### Fixed
- Content pool description changes now propagate to the resume in real time (previously required regenerating the resume)

## [0.5.3.5] - 2026-04-12

### Added
- **Optional role description for experience entries** — add a 1-2 sentence company or role description below each job header and above the bullet points. Renders in italic across all 4 templates (Classic, Modern, Minimal, Creative) and in Word export. The AI can include descriptions when generating resumes if company context is available.

## [0.5.3.4] - 2026-04-12

### Fixed
- **PDF export no longer produces extra blank pages** — print CSS collapsed the app shell to zero height (`#root { height: 0; overflow: hidden }`) so hidden UI elements don't paginate. Print areas use `position: fixed` to render independently. Cover letter print area hidden by default to prevent double-printing.

## [0.5.3.3] - 2026-04-12

### Changed
- **Suggestions apply instantly without a second AI call** — the AI now includes structured mutation data in each suggestion. When you accept, the change is applied deterministically in code. No waiting, no API cost, and guaranteed to match the preview. Falls back to LLM execution for older suggestions without mutation data.

## [0.5.3.2] - 2026-04-12

### Fixed
- **Accepting a suggestion now always modifies the resume** — forced tool use (`tool_choice: any`) so the AI must call a resume-modifying tool instead of responding with text only. If no tool is called, the suggestion reverts to pending with an error message instead of silently marking as accepted.

## [0.5.3.1] - 2026-04-12

### Fixed
- **Suggestion previews now match applied changes** — recommendation execution now includes the preview text as a constraint, so the AI produces exactly what was shown to the user. Tool descriptions and system prompts updated to treat previews as commitments, not suggestions.

## [0.5.3.0] - 2026-04-12

### Added
- **Cover letter generation** — new Cover Letter tab in the Refine step. Select a tone (Professional, Conversational, or Technical), click Generate, and get a tailored cover letter based on your resume, content pool, and job description. Includes inline editing, copy to clipboard, PDF and Word export, and regenerate.
- `useGenerateCoverLetter` hook with streaming AI generation, abort support, and error handling for empty responses and missing prerequisites
- `buildCoverLetterPrompt` system prompt with tone-aware instructions and prompt injection defenses
- `updateCoverLetter` store action for inline editing with persistence
- `exportCoverLetterToWord` function for Word document export
- 20 new tests (hook, component, and tool handler coverage)

### Changed
- Refine step tabs renamed: "Suggestions" → "CV Suggestions", new "Cover Letter" tab added
- Right panel swaps between resume preview and cover letter panel based on active tab

### Fixed
- `jobDescriptionId` in `generate_cover_letter` tool handler was hardcoded to empty string, now correctly reads from context

## [0.5.2.0] - 2026-04-12

### Added
- **Prompt injection mitigation** — XML boundary tags (`<user-resume>`, `<user-job-description>`, `<user-content-pool>`, `<user-content>`) around all user-supplied content in LLM prompts. Defense preamble on every system prompt instructs the model to treat tagged content as data only. Input sanitization defangs role markers, XML tag escapes, and code fence breakout attempts. 50K character cap on user input.
- 21 new tests for `promptSafety` utility (sanitization patterns, wrapping, preamble assertions)

### Changed
- All 5 prompt builders in `systemPrompt.ts` and 3 inline prompts (`resumeParser.ts`, `useAnalyzeJobDescription.ts`, `useRecommendations.ts`) now use the defense preamble and XML-wrapped user content

## [0.5.1.0] - 2026-04-12

### Added
- **IDB → Firestore migration** — when a user with local data signs in for the first time, a modal offers to upload their IndexedDB data to Firestore. Covers all 7 data types (resumes, content pool, chat sessions, content bank, cover letters, job descriptions, recommendations). Smart detection skips empty default resumes. Per-user localStorage flag prevents re-prompting.
- 19 new tests for migration utility (detection, routing, full data copy, edge cases)

## [0.5.0.0] - 2026-04-12

### Added
- **Google Sign-In + Cloud Sync** — sign in with Google to sync resumes, content pool, chat sessions, cover letters, job descriptions, and recommendations across devices via Firestore
- **Landing page** — new homepage for logged-out users with feature overview and sign-in/continue-local CTAs
- **Persistence routing** — automatic routing: signed-in users → Firestore, anonymous users → IndexedDB (backward compatible)
- **Firestore error toasts** — non-blocking toast notifications when cloud operations fail
- **Account section in Settings** — shows signed-in user info, sign-out button, or sign-in prompt
- **Header auth UI** — sign-in button or user avatar/menu in the app header
- **Offline support** — Firestore persistent local cache for instant loads even without network
- **77 new tests** — persistence routing (44), Firestore CRUD (12), AuthContext (12), SignInButton (3), UserMenu (6)

### Changed
- **Firebase graceful degradation** — app works without Firebase env vars (local-only mode)

## [0.4.13.0] - 2026-04-08

### Fixed
- **Current jobs show "Present" instead of "null"** — jobs with no end date displayed the literal string "null" in the resume preview and PDF export. New `formatEndDate()` utility handles null, undefined, empty string, and the string "null" across all templates and exports.

### Added
- 6 new tests for `formatEndDate` utility

## [0.4.12.0] - 2026-04-08

### Changed
- **Education fits on one line** — "Degree in Field — Institution" with date right-aligned, across all 4 templates, PDF/Word export, and diff preview

## [0.4.11.0] - 2026-04-08

### Changed
- **CI now runs lint + build on PRs** — type errors and lint failures caught before merge
- **Build version stamp** — console logs version/commit on startup, hover app title to verify which build is live
- **Post-deploy smoke check** — curls live site after deploy, verifies HTTP 200 and correct commit hash
- **13 new PDF Unicode test fixtures** — real pdf.js garbage patterns in textClean tests

## [0.4.10.0] - 2026-04-08

### Fixed
- **Invisible Unicode characters no longer produce ghost bullets** — PDF text extraction introduces zero-width spaces, BOM, and other invisible chars that passed `.trim()`. New `hasVisibleText()` utility strips them across all 11 bullet rendering sites.

### Added
- 13 new tests for `hasVisibleText` utility covering all invisible Unicode code points

## [0.4.9.0] - 2026-04-08

### Fixed
- **Empty bullets no longer render in resume** — empty or whitespace-only bullets are filtered out of all 4 templates, PDF export, Word export, and diff preview. Existing persisted data with empty bullets is cleaned automatically on app load.

### Added
- 16 new tests for contact links utility and classic ContactSection component

## [0.4.8.0] - 2026-04-08

### Changed
- **Contact links are now clickable and on one line** — LinkedIn, GitHub, and Portfolio URLs display as labeled clickable links on the same line as email, phone, and location across all 4 templates, PDF export, and Word export

## [0.4.7.0] - 2026-04-08

### Changed
- **Company location fully removed from experience data model** — `location` field stripped from ExperienceItem type, all 4 templates, PDF/Word export, diff preview, resume parser, CV generation tools, content pool, and seed data. Existing persisted data is migrated automatically on app load. Contact location (user's personal location in the CV header) is preserved.

## [0.4.6.0] - 2026-04-08

### Fixed
- **Generated CV content now syncs to content pool** — skills, experience, education, and other sections created during CV generation now appear in the content pool. Previously, generated content was written directly to the resume but not to the pool, so the content pool showed "No items yet" for sections that were visible in the CV. Content is deduplicated against existing pool entries to avoid doubles.

### Changed
- **Tighter classic template spacing** — reduced page margins (0.5in to 0.4in), section gaps, heading spacing, and experience item spacing. A typical 6-role CV now fits comfortably on one page instead of spilling onto page two.
- **Removed company location from experience sections** — classic and modern templates no longer display location (e.g., "London", "Canada") under each role. Keeps the CV cleaner without redundant geographic info.
- Dev server reads API key from `VITE_ANTHROPIC_API_KEY` env var, so you no longer need to paste it into Settings every session

## [0.4.5.0] - 2026-04-04

### Added
- **Personal Details form in Content Pool** — set your name, email, phone, location, LinkedIn, GitHub, and portfolio URL in one place. Values sync to the resume automatically. Blank URL fields don't appear in the CV.
- All 4 resume templates (classic, modern, minimal, creative) now render LinkedIn, GitHub, and website URLs when present

### Changed
- Contact info in resume preview is now read-only (edit via Content Pool only, not inline on the resume)

## [0.4.4.0] - 2026-04-04

### Changed
- **Decluttered RefineStep left panel** — removed redundant "Refine Your CV" heading, job subtitle, and Export/Template row. Left panel now starts directly with the tab bar, giving more vertical space to actual content.
- **TemplateSelector moved to right panel toolbar** — template picker now sits above the resume preview where it belongs, alongside the Show Changes diff toggle.
- Removed unused `ExportMenu` import from RefineStep (Export lives in ResumePreview bottom bar)

## [0.4.3.0] - 2026-04-01

### Added
- **Tabbed left panel in Refine step** — swap between Suggestions, Content Pool, and Job Description without leaving the refine view. No more scrolling past AI recommendations to find your content pool. Each tab loads instantly, and the resume preview stays locked on the right.
- **Resume name in wizard header** — always shows which resume you're editing above the step indicator

### Changed
- Refine step left panel restructured from stacked sections to tabbed layout
- Removed remaining `dark:` class variants from Refine step (light-mode-only enforcement)

## [0.4.2.0] - 2026-04-01

### Added
- **Before/after resume diff** — after accepting an AI suggestion in the Refine step, a "Show Changes" toggle appears. Flip it to see exactly what changed: removed text crossed out in red, new text highlighted in green. Word-level precision so you can see individual keyword swaps, not just "something changed."
- `diffWords` utility using LCS algorithm for word-level diffing
- `DiffText` component rendering inline red/green diff spans
- `DiffResumePreview` component showing section-by-section diff across summary, experience, skills, education, and projects
- 17 new tests covering diff utility, diff components, and RefineStep toggle behavior

## [0.4.1.0] - 2026-03-31

### Fixed
- **CV generation no longer fabricates content** — generated resumes now use your exact content pool text, word for word. Previously, the AI could rewrite bullets, invent summaries, and add skills not in your pool. Now it selects from your pool only, skipping sections with no matching content.

## [0.4.0.0] - 2026-03-31

### Added
- **Wizard-based UI** replacing the two-panel + chat layout with a guided 5-step flow: Content Pool, AI Recommendations, Job Description, Generate CV, Refine
- **Step-by-step navigation** with progress indicator, back/next buttons, and step gates
- **AI Recommendations** (Step 2) analyzes your content pool and suggests improvements inline
- **Job Description analysis** (Step 3) extracts keywords and generates JD-specific recommendations
- **CV Generation** (Step 4) creates a new 1-page resume from your content pool, targeted to the job description, with section-by-section progress checklist
- **Refine step** (Step 5) with JD-specific AI suggestions and prominent export
- **Resume Library drawer** accessible from header, showing all generated resumes grouped by job application
- **Job description persistence** with saved JD list, keyword extraction, and select/delete
- **Empty states** for all wizard steps with clear calls-to-action

### Changed
- Header simplified (removed ResumeMenu dropdown and TemplateSelector, added "My Resumes" button)
- DESIGN.md updated for wizard-based layout
- Recommendations and job descriptions now persist to IndexedDB (survive page refresh)

### Removed
- Floating chat drawer (FloatingChat, ChatPanel, ActionPanel, MessageBubble)
- Split pane two-panel layout
- Content Bank drawer (replaced by Content Pool in wizard)
- Mode toggle (general/job-customisation)
- Coach notes and resume score components

### Fixed
- "Add Manually" button on empty content pool now shows the full ContentPoolPage

## [0.3.9.3] - 2026-03-31

### Fixed
- **"e.keywords.join is not a function" crash** — `analyze_job_description` tool handler assumed `keywords` was always an array, but Claude sometimes returns a comma-separated string; now handles both formats gracefully

## [0.3.9.2] - 2026-03-31

### Fixed
- **Generate Recommendations button** now triggers AI analysis (was missing onClick handler after UI refactor)
- **Analyze Job Description button** now sends job description to AI for resume tailoring (was an empty callback)
- **AI Coach drawer auto-opens** when recommendations are triggered from the content pool page
- Button disables while a recommendation request is pending to prevent duplicate requests

## [0.3.9.1] - 2026-03-28

### Changed
- **Empty sections hidden from resume** — sections with no content (skills, certifications, projects, experience, education, summary, custom) no longer render on the resume, keeping the layout clean

## [0.3.9.0] - 2026-03-27

### Added
- **Page-accurate resume preview** — preview padding now matches print CSS exactly (`0.5in` instead of Tailwind `p-8`), so what you see is what you print
- **Page overflow indicator** — dashed amber boundary line at the one-page mark and amber warning bar when content overflows: "Content overflows one page. Remove items to fit."
- **Overflow detection tests** — `ResumePreview.test.tsx` with 3 tests covering no-overflow, overflow-detected, and boundary-line-hidden states

### Changed
- Page boundary line is hidden in `@media print` so it never appears in exported PDFs

## [0.3.8.0] - 2026-03-27

### Fixed
- **PDF export matches preview** — replaced react-pdf/renderer (separate layout with mismatched fonts and styles) with `window.print()` targeting `#resume-print-area`; print CSS uses `visibility: hidden` isolation so only the active resume template renders, pixel-perfect match with what the user sees
- **Reset confirmation dialog null guard** — closing the confirm dialog when `activeResumeId` is null no longer leaves the dialog stuck open

## [0.3.7.0] - 2026-03-27

### Added
- **Reset resume** — "Reset content" option in the resume menu clears all resume sections back to defaults while leaving the content pool untouched; two-step confirm (amber) with "Cannot be undone." warning prevents accidental data loss
- `resetResume` store action — replaces sections with fresh defaults, persists to IDB

### Fixed
- Reset confirmation dialog no longer gets stuck open when `activeResumeId` is null

## [0.3.6.1] - 2026-03-27

### Fixed
- **Duplicate bullets in resume preview** — checking a bullet in the content pool when experience entries already existed could push the same bullet multiple times due to direct state mutation and a missing deduplication guard
- **State mutation bug** — `addPoolItemToResume` and `removePoolItemFromResume` now clone arrays before mutating, preventing Zustand from missing updates
- **Startup cleanup** — `hydrateFromIdb` deduplicates any already-corrupted bullet arrays on first load, so existing data heals automatically

## [0.3.6.0] - 2026-03-27

### Added
- **Editable job headers** — click any job header field (title, company, start date, end date) to edit inline; changes propagate to all bullets in that job group
- **"Present" for current roles** — end date shows "Present" when null; typing "Present" stores null
- `allowEmpty` option on `EditableText` — enables clearing the start date field (previously a cleared value was silently discarded)

### Fixed
- **Empty start date now saveable** — clearing a job's start date previously did nothing silently; the field now saves correctly
- **Type-safe field updates** — context field parameter is now typed as a union (`'title' | 'company' | 'startDate' | 'endDate'`) instead of `string`, preventing silent typo-induced corruption

## [0.3.5.0] - 2026-03-27

### Added
- **Pool section order synced with resume** — content pool sections display in the same order as the resume sections
- **Drag-and-drop section reorder** — drag section headers in the pool to reorder; resume preview updates to match
- **Drag-and-drop item reorder** — drag individual bullets within a job or items within any section to reorder
- **reorderPoolEntries** store action for persisting item-level reordering
- **Seed Test Data** button for development testing (visible when pool is empty)

### Fixed
- Job chronological sorting now parses "Mon YYYY" date formats correctly (was doing alphabetical comparison)
- Experience items added to resume via checkbox now sort chronologically (newest first)

### Changed
- Applied DESIGN.md design system across entire UI (fonts, colors, warm grays)

## [0.3.4.0] - 2026-03-27

### Changed
- Applied DESIGN.md design system across entire UI
- Font: Inter → Instrument Sans (body) + Satoshi (headings) + Geist Mono (data)
- Primary color: indigo (#6366f1) → blue (#2563EB) per design system
- Neutrals: cool gray → warm gray (stone palette) across all 44 components
- Font imports via Fontshare CDN + Google Fonts with font-display: swap

## [0.3.3.0] - 2026-03-23

### Added
- **CV Content as primary left panel** — see content pool and resume preview side-by-side
- **Floating AI Coach** — Intercom-style chat drawer (400px, 60vh) slides up from bottom-right
- **Generate Recommendations** button in content pool header (visible when API key set)
- **Job Match mode toggle** restored in content pool header (General / Job Match)
- **JobDescriptionInput** shown when in Job Match mode
- **Inline editable bullets** — click any bullet to edit in-place with auto-sizing textarea
- **Editable summary text** — click summary to edit inline
- Slide-up animation for chat drawer

### Changed
- Left panel: ActionPanel → ContentPoolPage (content pool is now the primary interface)
- Right panel: RightPanel with tabs → ResumePreview only (always visible)
- AI Coach moved from permanent left panel to floating drawer

## [0.3.2.0] - 2026-03-23

### Added
- Selection checkboxes on each CV Content pool item — check to add to current resume version, uncheck to remove
- `isEntryInResume()` matching logic for all item types (bullets by company+title+text, education by institution+degree, skills by category name, etc.)
- Checked items get highlighted border (primary color) for visual feedback

### Changed
- CV Content moved back to RightPanel tab (reverted from header nav) — clearer UX alongside Resume + Cover Letter tabs
- Header simplified — removed CV Content button and conditional props

## [0.3.1.1] - 2026-03-23

### Changed
- Moved CV Content from RightPanel tab to header nav button — full-page toggle makes it clear the content pool is global across all resume versions
- ResumeMenu and TemplateSelector hidden when viewing content pool
- Removed CV Content tab from RightPanel (now only Resume + Cover Letter)

## [0.3.1.0] - 2026-03-23

### Added
- "+ New Job" form in Experience section — add company, title, start date, and optional first bullet
- "+ Bullet" button on each job group header — add bullets to existing jobs inline
- JobGroupCard component with persistent inline add-bullet form (stays open for rapid entry)

### Changed
- Experience section header button changed from "+ Add" to "+ New Job" for clarity

## [0.3.0.0] - 2026-03-23

### Added
- **CV Content Pool** — shared content library that persists across all resume versions
  - Upload populates pool with individual bullets (grouped by job), education, skills, projects, certifications
  - Bullet-level granularity — pick specific achievements per version, not whole jobs
  - "+ Add" forms per section for manual content entry
  - Automated deduplication within uploads and across existing pool (fingerprint-based matching)
- **CV Content tab** in right panel alongside Resume and Cover Letter
- **Multi-resume management** — create, duplicate, rename, and delete resume versions from header dropdown
  - `ResumeMenu` custom dropdown replacing plain select
  - Deep clone with full ID regeneration for all nested items
  - Delete prevention for last remaining resume
  - Inline rename with Enter/blur save, Escape cancel
- **ContentPoolEntry** type for structured pool items (IDB v2)
- `cloneResume()` utility, `duplicateResume()`/`renameResume()` store actions

## [0.2.1.0] - 2026-03-23

### Added
- Multi-resume management — create, duplicate, rename, and delete resume versions from header dropdown
- ResumeMenu dropdown component replacing plain select element in header
- `cloneResume()` utility with deep ID regeneration for all nested items (experience, education, skills, certs, projects)
- `duplicateResume()` and `renameResume()` store actions
- Delete prevention for last remaining resume
- Inline rename with Enter/blur save and Escape cancel

## [0.2.0.0] - 2026-03-22

### Changed
- **Replaced chat interface with action-list UI** — AI suggests specific fixes as clickable cards instead of open-ended conversation
- Left panel is now ActionPanel with three zones: Resume Score + progress bar, scrollable action cards, compact freeform input
- System prompt rewritten for action-list paradigm — AI generates categorized, prioritized suggestions with previews
- `suggest_actions` tool now supports up to 5 items with priority (high/medium/low), category (content/metrics/structure/missing/question), and preview text

### Added
- ActionCard component with 4 states (pending → executing → completed → dismissed) and category-colored borders
- Undo system — 5-second undo window after each AI fix, with resume state snapshot/restore
- Progress bar showing "N of M suggestions addressed"
- Inline preview — expand action cards to see what the AI will change before clicking Fix
- AiBanner — temporary AI text responses shown as dismissable banners (auto-dismiss after 10s, questions stay pinned)
- FreeformInput — compact "Ask anything..." input for secondary chat
- Job Match mode toggle and job description input restored in new ActionPanel header

### Removed
- Chat bubbles / conversational message display (ChatPanel archived, not deleted)
- CoachNote component (absorbed into ActionCard)
- Static ActionSuggestions chips (replaced by AI-driven action cards)

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
