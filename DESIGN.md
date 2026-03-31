# Design System — Resume Builder

## Product Context
- **What this is:** AI-powered resume builder with a content pool + version system
- **Who it's for:** Recently laid off tech workers applying to 15-30 companies fast
- **Space/industry:** Resume builders (Teal, Enhancv, Kickresume, Rezi)
- **Project type:** Web app — wizard-based SPA with inline AI at each step

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian
- **Decoration level:** Minimal — typography and spacing do the work
- **Mood:** Competent, fast, confident. Like a well-built instrument — Linear, Raycast, Vercel dashboard energy. Not a template gallery.
- **Reference sites:** tealhq.com, linear.app, vercel.com/dashboard

## Typography
- **Display/Hero:** Satoshi 700 — geometric but warm, distinct voice without being trendy
- **Body:** Instrument Sans 400/500 — excellent readability at small sizes, pairs well with Satoshi
- **UI/Labels:** Instrument Sans 500
- **Data/Tables:** Geist Mono 400 — tabular-nums support, clean at small sizes
- **Code:** Geist Mono
- **Loading:** Fontshare CDN (Satoshi, Instrument Sans), Google Fonts (Geist Mono)
- **Scale:**
  - xs: 11px — labels, metadata
  - sm: 13px — body text, UI elements
  - base: 15px — primary body
  - lg: 18px — subheadings
  - xl: 24px — section headings
  - 2xl: 32px — page headings
  - 3xl: 48px — hero/display

## Color
- **Approach:** Restrained — one accent + warm grays
- **Primary:** #2563EB — confident blue, professional without being generic
- **Primary hover:** #1d4ed8
- **Primary light:** #eff6ff — subtle highlight backgrounds
- **Neutrals:** Warm gray scale
  - Text: #1a1a1a
  - Secondary: #78716c
  - Muted: #a8a29e
  - Border: #e7e5e4
  - Muted BG: #f5f5f4
  - Background: #fafaf9
  - Card: #ffffff
- **Semantic:** success #16a34a, warning #d97706, error #dc2626, info #2563EB
- **Dark mode:** Invert neutrals (#0a0a0a bg, #171717 card, #262626 muted, #333333 border), reduce primary saturation 10%

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — efficient without being cramped
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined
- **Grid:** Wizard flow — step indicator (fixed below header) + full-width step body + nav bar (fixed bottom)
- **Step body:** Single column for steps 1-3 (max-width 640px centered), split view for steps 4-5 (40/60 left/right)
- **Max content width:** 1400px (full app), 640px (wizard step inner), 8.5in (resume preview)
- **Border radius:** sm:4px, md:6px, lg:8px, full:9999px

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Specific:** Drawer slide-up(200ms ease-out), checkbox feedback(150ms), hover states(150ms)

## Anti-patterns (never use)
- Purple/violet gradients
- Icons in colored circles
- Centered-everything layouts
- Uniform bubbly border-radius (16px+)
- Gradient buttons
- Stock-photo hero sections
- Inter, Roboto, Poppins, or Montserrat as primary font

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial design system | Created by /design-consultation. Industrial aesthetic chosen for stressed tech job seekers who need speed + confidence. Satoshi + Instrument Sans for distinct typography. Restrained blue accent avoids SaaS purple cliche. |
| 2026-03-23 | Landscape research | Analyzed Teal, Enhancv, Kickresume. Category converges on clean/airy/generic. Differentiation: industrial density (Linear-like), no decoration, Satoshi display font. |
