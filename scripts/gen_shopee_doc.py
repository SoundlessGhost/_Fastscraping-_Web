"""Convert the standalone Shopee Product API reference (getpc_docs index.html)
into a scoped module the Next.js /docs/shopee-api page renders.

  python scripts/gen_shopee_doc.py <source index.html>

- CSS: light theme only, every selector scoped under .apidoc, Shopee-orange
  palette swapped for the Ultraviolet brand, fonts -> Manrope / JetBrains Mono.
- HTML: base URL -> https://shopee-api.fastscraping.com (never a raw server IP),
  a few wording fixes, footer -> support email.
Writes lib/docs/shopee-api-doc.ts.
"""
import json, re, sys, pathlib

BASE_OLD = "http://169.58.203.69:7007"
BASE_NEW = "https://shopee-api.fastscraping.com"

src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
styles = re.findall(r"(?s)<style[^>]*>(.*?)</style>", src)
script = re.findall(r"(?s)<script[^>]*>(.*?)</script>", src)[-1]
body = re.search(r"(?s)<body[^>]*>(.*)</body>", src).group(1)
body = re.sub(r"(?s)<script.*?</script>", "", body)

css = styles[1] + "\n" + styles[2]

# drop dark-mode blocks (the site is light-only)
def drop_block(text, head):
    out, i = [], 0
    while True:
        j = text.find(head, i)
        if j < 0:
            out.append(text[i:]); break
        out.append(text[i:j])
        k = text.index("{", j); depth = 0
        for p in range(k, len(text)):
            if text[p] == "{": depth += 1
            elif text[p] == "}":
                depth -= 1
                if depth == 0: i = p + 1; break
    return "".join(out)

css = drop_block(css, "@media (prefers-color-scheme: dark)")
css = drop_block(css, ':root[data-theme="dark"]')
css = re.sub(r"(?s)/\*.*?\*/", "", css)

PALETTE = {
    "--accent:#D9411C": "--accent:#4B3FA3", "--accent-soft:#FCEBE5": "--accent-soft:#ECEAF8",
    "--accent:#D63F1A": "--accent:#4B3FA3",
    "--brand:#EE4D2D": "--brand:#4B3FA3", "--brand-ink:#B8321A": "--brand-ink:#3F3590", "--brand-soft:#FFF0EA": "--brand-soft:#ECEAF8",
    "--th-bg:#FFF4EF": "--th-bg:#F3F1FB", "--th-ink:#A8361C": "--th-ink:#3F3590",
    "--hero-1:#EE4D2D": "--hero-1:#3F3590", "--hero-2:#F2622E": "--hero-2:#4B3FA3", "--hero-3:#F7941D": "--hero-3:#6A5FD0",
    "--bg:#F5F6F8": "--bg:#F7F6FC", "--ink:#141A22": "--ink:#16131F", "--line:#E1E5EB": "--line:#E3E0F2", "--line-2:#EDF0F4": "--line-2:#F0EEF8",
    "--code-bg:#0F141B": "--code-bg:#16131F",
}
for a, b in PALETTE.items():
    assert a in css, a
    css = css.replace(a, b)
css = re.sub(r'--sans:[^;]+;', "--sans:var(--uv-sans);", css)
css = re.sub(r'--mono:[^;]+;', "--mono:var(--uv-mono);", css)
css = css.replace("html{scroll-behavior:smooth}", "")

def scope_sel(sel):
    sel = sel.strip()
    if not sel: return sel
    if sel.startswith(":root"): return ".apidoc" + sel[5:]
    if sel == "body": return ".apidoc"
    if sel.startswith("html"): return ".apidoc" + sel[4:]
    return ".apidoc " + sel

def scope(text):
    out, i = [], 0
    while i < len(text):
        j = text.find("{", i)
        if j < 0: out.append(text[i:]); break
        head = text[i:j].strip()
        if head.startswith("@media") or head.startswith("@supports"):
            depth, k = 0, j
            for p in range(j, len(text)):
                if text[p] == "{": depth += 1
                elif text[p] == "}":
                    depth -= 1
                    if depth == 0: k = p; break
            out.append(head + "{" + scope(text[j + 1:k]) + "}\n")
            i = k + 1; continue
        k = text.index("}", j)
        sels = ",".join(scope_sel(s) for s in head.split(","))
        out.append(sels + "{" + text[j + 1:k].strip() + "}\n")
        i = k + 1
    return "".join(out)

# Prefix every doc class with "d-" so names like .brand, .eyebrow or .card
# never collide with the site's own stylesheets.
css = re.sub(r"\.(?=[A-Za-z_][\w-]*)", ".d-", css)
body = re.sub(r'class="([^"]*)"', lambda m: 'class="' + " ".join("d-" + c for c in m.group(1).split()) + '"', body)
for a, b in [("'.tab'", "'.d-tab'"), ("'.toc a[href^=\"#\"]'", "'.d-toc a[href^=\"#\"]'"), ("'.code .copy'", "'.d-code .d-copy'"),
             ("closest('.code')", "closest('.d-code')"), ("'active'", "'d-active'")]:
    assert a in script, a
    script = script.replace(a, b)

css = scope(css)
css += ".apidoc{background:var(--bg);color:var(--ink);font:15px/1.65 var(--sans)}\n"
css += ".apidoc .top .wrap{padding-block:40px 36px}\n"

WORDING = {
    BASE_OLD: BASE_NEW,
    "Our device fleet scrapes the product": "Our infrastructure collects the product",
    "Accounts and anti-bot handled": "Anti-bot handled",
    "Logins, device sessions and blocking are managed on our side.": "Sessions, proxies and blocking are managed on our side.",
    "For production limits and support, contact your account manager.":
        'Questions or higher limits: <a href="mailto:support@fastscraping.com">support@fastscraping.com</a> · <a href="/dashboard/login">Get an API key</a>',
}
for a, b in WORDING.items():
    assert a in body, a
    body = body.replace(a, b)
assert "169.58" not in body
body = body.strip()

out = pathlib.Path(__file__).resolve().parent.parent / "lib" / "docs" / "shopee-api-doc.ts"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(
    "// GENERATED by scripts/gen_shopee_doc.py from the Shopee Product API reference. Do not edit by hand.\n"
    f"export const DOC_CSS = {json.dumps(css)};\n"
    f"export const DOC_HTML = {json.dumps(body)};\n"
    f"export const DOC_JS = {json.dumps(script.strip())};\n",
    encoding="utf-8",
)
print("wrote", out, len(css), len(body), len(script))
