"""Convert the standalone Shopee Listings API (POST /cbc) reference into a scoped module the Next.js
/docs/shopee-cbc page renders.

  python scripts/gen_cbc_doc.py <source cbc.html>

Source of truth: /opt/getpc_docs/cbc.html on the getpc server. Same approach as gen_getlist_doc.py:
- CSS: light theme only, every selector scoped under .apidoc, every doc class prefixed "d-", fonts -> the site's
  Manrope / JetBrains Mono (the source already uses the Ultraviolet palette).
- HTML: <BASE_URL> -> https://shopee-multi-region.fastscraping.com (never a raw server IP), <main> -> div,
  absolute links to www.fastscraping.com -> site-relative links.
- Guards: no server IP or port, and no internal wording in the visible text.
Writes lib/docs/shopee-cbc-doc.ts.
"""
import html
import json
import pathlib
import re
import sys

BASE_NEW = "https://shopee-multi-region.fastscraping.com"

src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8").replace("\r\n", "\n")
css = "\n".join(re.findall(r"(?s)<style[^>]*>(.*?)</style>", src))
script = re.findall(r"(?s)<script[^>]*>(.*?)</script>", src)[-1]
body = re.search(r"(?s)<body[^>]*>(.*)</body>", src).group(1)
body = re.sub(r"(?s)<script.*?</script>", "", body)


def drop_block(text, head):
    out, i = [], 0
    while True:
        j = text.find(head, i)
        if j < 0:
            out.append(text[i:])
            break
        out.append(text[i:j])
        k = text.index("{", j)
        depth = 0
        for p in range(k, len(text)):
            if text[p] == "{":
                depth += 1
            elif text[p] == "}":
                depth -= 1
                if depth == 0:
                    i = p + 1
                    break
    return "".join(out)


css = drop_block(css, "@media (prefers-color-scheme: dark)")
css = drop_block(css, ':root[data-theme="dark"]')
css = drop_block(css, "@media (prefers-reduced-motion:reduce)")
css = re.sub(r"(?s)/\*.*?\*/", "", css)
assert "#4B3FA3" in css, "source is not on the Ultraviolet palette"
css = re.sub(r"--sans:[^;]+;", "--sans:var(--uv-sans);", css)
css = re.sub(r"--mono:[^;]+;", "--mono:var(--uv-mono);", css)
for a in ("html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}", "main{min-width:0}"):
    assert a in css, a
css = css.replace("html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}", "")
css = css.replace("main{min-width:0}", ".main{min-width:0}")


def scope_sel(sel):
    sel = sel.strip()
    if not sel:
        return sel
    if sel.startswith(":root"):
        return ".apidoc" + sel[5:]
    if sel == "body":
        return ".apidoc"
    if sel.startswith("html"):
        return ".apidoc" + sel[4:]
    return ".apidoc " + sel


def scope(text):
    out, i = [], 0
    while i < len(text):
        j = text.find("{", i)
        if j < 0:
            out.append(text[i:])
            break
        head = text[i:j].strip()
        if head.startswith("@media") or head.startswith("@supports"):
            depth, k = 0, j
            for p in range(j, len(text)):
                if text[p] == "{":
                    depth += 1
                elif text[p] == "}":
                    depth -= 1
                    if depth == 0:
                        k = p
                        break
            out.append(head + "{" + scope(text[j + 1:k]) + "}\n")
            i = k + 1
            continue
        k = text.index("}", j)
        sels = ",".join(scope_sel(s) for s in head.split(","))
        out.append(sels + "{" + text[j + 1:k].strip() + "}\n")
        i = k + 1
    return "".join(out)


# <main> inside the site's own <main> is invalid: a div does the same job here.
assert body.count("<main>") == 1 and body.count("</main>") == 1
body = body.replace("<main>", '<div class="main">').replace("</main>", "</div>")

# "d-" prefix on every doc class so .brand, .card, .top ... never collide with the site's stylesheets.
css = re.sub(r"\.(?=[A-Za-z_][\w-]*)", ".d-", css)
body = re.sub(r'class="([^"]*)"', lambda m: 'class="' + " ".join("d-" + c for c in m.group(1).split()) + '"', body)
for a, b in [("'.toc a[href^=\"#\"]'", "'.d-toc a[href^=\"#\"]'"), ("'.code .copy'", "'.d-code .d-copy'"),
             ("closest('.code')", "closest('.d-code')"), ("'main section[id]'", "'.d-main section[id]'"),
             ("'active'", "'d-active'")]:
    assert a in script, a
    script = script.replace(a, b)

css = scope(css)
css += ".apidoc{background:var(--bg);color:var(--ink);font:15px/1.65 var(--sans)}\n"
css += ".apidoc .d-top .d-wrap{padding-block:40px 36px}\n"
css += ".apidoc .d-facts dd{overflow-wrap:anywhere}\n"
css += ".apidoc .d-anatomy .d-url{overflow-wrap:anywhere}\n"

# The live page shows the real base URL (like /docs/shopee-api); the standalone copy says <BASE_URL>.
WORDING = {
    "Replace <code>&lt;BASE_URL&gt;</code> and <code>YOUR_API_KEY</code> with the values we send you. "
    "Your base URL is sent together with your API key.":
        "Base URL: <code>%s</code>. Replace <code>YOUR_API_KEY</code> with your API key." % BASE_NEW,
    " Your base URL is sent together with your API key.</p>": "</p>",
}
for a, b in WORDING.items():
    assert a in body, a
    body = body.replace(a, b)
body = re.sub(r'\s+<span class="d-c">(?:#|//) sent together with your API key</span>', "", body)
body = body.replace("&lt;BASE_URL&gt;", BASE_NEW)
# Sibling docs are linked absolutely in the standalone copy; on the site they are internal links.
body = body.replace('href="https://www.fastscraping.com/', 'href="/')

assert "BASE_URL" not in body and "sent together" not in body, "base URL wording left"
assert "169.58" not in body and not re.search(r"\b\d{1,3}(?:\.\d{1,3}){3}\b", body), "server IP in the docs"
port = re.search(r"https?://[^\s\"'<>]*:\d{2,5}", body)
assert not port, "server port in the docs: %s" % port.group(0)
# Public wording: no infrastructure talk in what a reader sees (tags stripped, entities decoded).
FORBIDDEN = re.compile(r"\b(devices?|phones?|accounts?|log-?ins?|logged|workers?|bridge|lsposed|redroid|kameleo|"
                       r"emulators?|android|captchas?|prox(?:y|ies)|mitm|app-signed|getpc|search_items|"
                       r"fe_categoryids|match_id|mr\.? ?scraper|contabo)\b", re.I)
text = html.unescape(re.sub(r"<[^>]+>", " ", body))
bad = FORBIDDEN.search(text)
if bad:
    print("forbidden wording %r near: %r" % (bad.group(0), text[max(0, bad.start() - 60):bad.end() + 60]))
assert not bad, "internal wording in the docs"
assert 'data-doc="shopee-cbc"' in body, "script root marker missing"
assert "d-active" in script
body = body.strip()

out = pathlib.Path(__file__).resolve().parent.parent / "lib" / "docs" / "shopee-cbc-doc.ts"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(
    "// GENERATED by scripts/gen_cbc_doc.py from the Shopee Listings API reference. Do not edit by hand.\n"
    f"export const DOC_CSS = {json.dumps(css)};\n"
    f"export const DOC_HTML = {json.dumps(body)};\n"
    f"export const DOC_JS = {json.dumps(script.strip())};\n",
    encoding="utf-8",
    newline="\n",
)
print("wrote", out, len(css), len(body), len(script))
