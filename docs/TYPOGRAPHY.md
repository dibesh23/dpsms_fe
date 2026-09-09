# DP-SMS typography

DP-SMS uses Satoshi as one coherent application family. Components use semantic roles rather than hardcoded family names:

- `--font-sans` / `font-sans` is used for branding, page titles, navigation, controls, tables, body copy, reports, and data.
- `--font-mono` / `font-mono` is reserved for credentials, JSON, and genuinely code-like values.

Reusable `type-*` classes in `src/app/globals.css` define size, weight, line height, numeric behavior, and foreground together. Dashboard headings and sidebar elements use the primary `#064E3B`; the sidebar surface uses `#FBFAF7`. Ordinary body, secondary, caption, helper, error, and status text retain their semantic content colors.

Decorative dashboard surfaces use warm stone/neutral colors rather than green tints. Green is reserved for primary identity and meaningful success states such as present, paid, active, and completed.

The desktop and mobile-drawer sidebar navigation implements the supplied reference exactly: Satoshi at 18px, weight 500, and 28px line height. Active navigation uses weight 600. The expanded desktop rail is 256px (up from 240px) so the longest navigation labels are not clipped; the collapsed 80px rail is unchanged. Group labels and profile metadata retain smaller role-appropriate sizes.

## Dashboard content scale

The authenticated dashboard content uses the same `9/7` scale ratio that takes the original 14px navigation text to the approved 18px sidebar reference. The `.dashboard-main` boundary proportionally scales raw Tailwind text sizes and semantic typography roles—including line heights—without changing the sidebar, authentication pages, or print-only documents.

## Satoshi asset requirement

The repository does not currently contain a verified or licensed Satoshi webfont. The application stack is configured as `"Satoshi", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`, so it currently uses the platform fallback unless Satoshi is installed locally.

To make rendering deterministic, supply a licensed `Satoshi-Variable.woff2` or verified WOFF2 files for weights 400, 500, 600, and 700. Load them with `next/font/local` using `display: "swap"`, then connect the generated variable to `--font-sans`. Do not rename a substitute font or add an unverified CDN.

## Usage

Use `type-numeric` for aligned dates, times, marks, percentages, financial values, and columnar numbers. Use `type-body-reading` for notices, instructions, long descriptions, and document copy. Keep `font-mono` for generated credentials and technical data only.

Report-card PDFs retain jsPDF's built-in Helvetica fallback because Satoshi cannot be embedded until a licensed font asset is supplied. Admission-letter printing uses the Satoshi-first system stack and remains visually aligned with the screen document.
