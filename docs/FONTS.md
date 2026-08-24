# Fonts — where each face is used, and how to change it

Three faces, defined once as CSS variables in `app/globals.css`:

| Variable | Face | Used for |
|---|---|---|
| `--font-display` | **Instrument Serif** | editorial headlines, the logotype, big numbers |
| `--font-sans` | **Geist** | body copy, UI, forms — the default for everything |
| `--font-mono` | **Geist Mono** | labels, code, timestamps, invoice meta |

`body` is `--font-sans`, so anything with no rule of its own is already sans.

---

## Where things landed, 2026-08-24

The site tried sans for the header and the hero headline on 2026-08-23, and both
were put back to Instrument Serif the next day. What stuck was **removing the
italic from the header text** — the wordmark and the nav, not the mark.

### Header (top bar) — `app/styles/base.css`

The rule is the block commented *"The 'f' tile keeps its italic"*.

| Item | Face | Slant |
|---|---|---|
| Brand mark, the "f" tile | Instrument Serif 17px | **italic** — the slant is the mark |
| Brand wordmark "Fastscraping" | Instrument Serif 20px | upright — matches the footer |
| Nav links + Solutions trigger | Instrument Serif 17px | upright |
| "Talk to Khalid" CTA | Instrument Serif 16px | upright |

⚠️ Scoped to `.topbar` **on purpose**. `.brand` and `.brand-mark` are shared with
the mobile drawer, the dashboard sidebar, the footer and the invoice letterhead.
Never unset the italic on the bare `.brand` rule — scope it, or all five change.

**To put the header italic back:** delete that `.topbar … { font-style: normal; }`
block. The italic declarations it overrides are still in the file above it.

### Hero headline — "We handle your web scraping pipeline."

Back to its original values, so there is nothing to revert:

```css
.display          { font-family: var(--font-display); font-weight: 400;
                    line-height: 0.96; letter-spacing: -0.02em; }
.hero h1.display  { font-size: clamp(54px, 6.6vw, 96px); }   /* 79px at 1280 */
```

The green "web scraping" is `<em>`, so it stays serif italic in emerald.
Responsive steps in `home-responsive.css` are the originals too:
`clamp(48px,6.2vw,84px)` / `clamp(46px,8vw,70px)` /
`clamp(40px,11.5vw,58px)` lh .98 / `clamp(36px,12vw,48px)`.

**If sans is ever wanted again:** the full recipe — weight 600, tighter sizes,
`.hero h1.display em { font-style: normal }` — is in commit `32b90b1`.

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
