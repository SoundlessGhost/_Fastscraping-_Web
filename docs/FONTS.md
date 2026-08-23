# Fonts — where each face is used, and how to change it

Three faces, defined once as CSS variables in `app/globals.css`:

| Variable | Face | Used for |
|---|---|---|
| `--font-display` | **Instrument Serif** | editorial headlines, the logotype, big numbers |
| `--font-sans` | **Geist** | body copy, UI, forms — the default for everything |
| `--font-mono` | **Geist Mono** | labels, code, timestamps, invoice meta |

`body` is `--font-sans`, so anything with no rule of its own is already sans.

---

## Changed on 2026-08-23 — header and hero moved to sans

Both were Instrument Serif *italic*. They are now Geist, upright. To put either
back, delete the rule named below — the original serif rule underneath it is
still in the file and takes over again.

### 1. Header (top bar)

**File:** `app/styles/base.css` — the block commented *"Header runs in the body sans, upright"*

| Item | Was | Now |
|---|---|---|
| Brand wordmark "Fastscraping" | Instrument Serif italic, 20px / 27px | Geist 22px, 600 |
| Brand mark (the "f" tile) | Instrument Serif italic, 17px | Geist 15px, 600 |
| Nav links (Solutions, Services, …) | Instrument Serif italic, 17px | Geist 14.5px |
| Solutions dropdown trigger | Instrument Serif italic, 17px | Geist 14.5px |
| "Talk to Khalid" CTA | Instrument Serif italic, 16px | Geist 14px |

⚠️ The rule is scoped to `.topbar` **on purpose**. `.brand` and `.brand-mark` are
shared with the **dashboard sidebar** and the **invoice letterhead**, and both of
those still want the serif. Never unset the italic on the bare `.brand` rule —
scope it, or those two change with it.

**To revert:** delete the `.topbar … { font-family: var(--font-sans); font-style: normal; }`
block and the four size lines under it.

### 2. Hero headline — "We handle your web scraping pipeline."

**File:** `app/styles/base.css`, rule `.hero h1.display` (+ `.hero h1.display em`)

| | Was | Now |
|---|---|---|
| Face | Instrument Serif | **Geist** |
| Weight | 400 | **600** — sans looks thin at display size |
| Size (desktop) | `clamp(54px, 6.6vw, 96px)` → 79px | `clamp(44px, 5.2vw, 74px)` → 64px |
| Green "web scraping" | serif *italic* | sans upright, same weight |

Sans sets wider and reads heavier than the serif at the same px, which is why
every size came down a step.

**Also changed:** the four responsive steps in `app/styles/home-responsive.css`
(`.hero h1.display`), at ≤1100 / ≤900 / ≤680 / ≤430. Old values, if you revert:

```css
@media (max-width: 1100px) { .hero h1.display { font-size: clamp(48px, 6.2vw, 84px); } }
@media (max-width: 900px)  { .hero h1.display { font-size: clamp(46px, 8vw, 70px); } }
@media (max-width: 680px)  { .hero h1.display { font-size: clamp(40px, 11.5vw, 58px); line-height: 0.98; } }
@media (max-width: 430px)  { .hero h1.display { font-size: clamp(36px, 12vw, 48px); } }
```

**To revert:** drop `font-family` / `font-weight` / `letter-spacing` from
`.hero h1.display`, delete the `.hero h1.display em` rule, and restore the sizes
above.

---

## Other places the serif is still used — left alone deliberately

| Where | File | Note |
|---|---|---|
| Section headlines (`.display`) | `base.css` | the site's editorial voice |
| Footer wordmark | `base.css` `.footer-brand` | serif face, but **upright** (italic removed in `17ca192`, 2026-08-17) |
| Mobile menu brand | `nav-mobile.css` | still italic |
| Dashboard sidebar brand + nav | `dash-shell.css` | serif, **upright** — `.ds-side-head .brand > span:not(.brand-mark) { font-style: normal; }` |
| Invoice letterhead + totals | `invoice.css` | serif; the **amounts** are serif too — a change to sans was tried and reverted |
| Big stat numbers (`.num .v`) | `base.css` | serif with italic accent |

## Mono is used for

Eyebrow labels, table headers, timestamps, code samples, the invoice meta strip,
the footer base line, and the codes dashboard. Changing mono affects a lot of
small labels site-wide — check `grep -rn "font-mono" app/styles/`.

---

## Gotcha found 2026-08-23

Reverting the "Data River" hero commit (`087c75e`) silently **re-italicised the
whole dashboard sidebar** — that commit had made it upright, and the revert took
that with it. `app/styles/dash-shell.css` was restored by hand afterwards.

The same commit also carried the mobile header sizing in `nav-mobile.css`
(`.topbar-inner { min-height: 72px/62px }` and the brand step-downs). Those went
with the revert too; the header is smaller now, so it reads fine without them —
mobile bar measures 64px, brand 22px, no overflow. If the header ever grows
again, those rules are in `087c75e`.

**Lesson:** `.brand` / `.brand-mark` are shared by the site header, the mobile
drawer, the dashboard sidebar, the footer and the invoice. Anything that touches
them needs checking in all five.
