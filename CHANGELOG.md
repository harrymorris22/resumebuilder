# Changelog

All notable changes to this project will be documented in this file.

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
