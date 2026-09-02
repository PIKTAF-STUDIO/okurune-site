# -*- coding: utf-8 -*-
"""data/gifts.json から商品カードの静的HTMLを作り、index.html（話題の8点）と
gifts.html（先頭12点）のマーカー区間に埋め込む。JS 無効でも検索エンジンにも
商品名が見えるようにするため。カードの構造は js/site.js の card() と同じにする。

使い方: python tools/render_static.py   （リポジトリ直下で実行）"""
import io, json, html, re, os

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
data = json.load(io.open("data/gifts.json", encoding="utf-8"))
items = data["items"]

def esc(s): return html.escape(str(s if s is not None else ""), quote=True)
def yen(n): return f"{n:,}"

def card(it):
    shops = ""
    if it.get("rakuten"): shops += f'<a class="shop shop-rakuten" href="{esc(it["rakuten"])}" target="_blank" rel="sponsored noopener">楽天市場で見る</a>'
    if it.get("amazon"): shops += f'<a class="shop shop-amazon" href="{esc(it["amazon"])}" target="_blank" rel="sponsored noopener">Amazonで見る</a>'
    tags = it.get("scene", [])[:1] + it.get("to", [])[:1]
    tag_html = "".join(f'<span class="badge badge-soft">{esc(t)}</span>' for t in tags)
    price = f'<small>¥</small>{yen(it["price"])}' if it.get("price") is not None else '<small>価格は店舗で確認</small>'
    return ('<article class="gift-card">'
            f'<div class="ph"><img src="{esc(it["image"])}" alt="{esc(it["brand"] + " " + it["name"])}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add(\'noimg\');this.remove()"></div>'
            '<div class="body">'
            f'<div class="brand-name">{esc(it["brand"] or "ノーブランド")}</div>'
            f'<h3>{esc(it["name"])}</h3>'
            f'<p class="desc">{esc(it["desc"])}</p>'
            f'<div class="meta"><span class="price">{price}</span><span class="tags">{tag_html}</span></div>'
            f'<div class="shops">{shops}</div>'
            '</div></article>')

def featured(n):
    seen, picked = set(), []
    for it in items:
        b = it["brand"] or it["id"]
        if b in seen or len(picked) >= n: continue
        seen.add(b); picked.append(it)
    return picked

def inject(path, marker, body):
    s = io.open(path, encoding="utf-8").read()
    pat = re.compile(rf"(<!-- static:{marker} -->).*?(<!-- /static:{marker} -->)", re.S)
    assert pat.search(s), (path, marker)
    s = pat.sub(lambda m: m.group(1) + "\n" + body + "\n" + m.group(2), s)
    io.open(path, "w", encoding="utf-8", newline="\n").write(s)

inject("index.html", "trend", "".join(card(it) for it in featured(8)))
inject("gifts.html", "gifts", "".join(card(it) for it in items[:12]))
s = io.open("gifts.html", encoding="utf-8").read()
s = re.sub(r'<span id="result-count">.*?</span>\s*件</span>', f'<span id="result-count"><span class="num">{len(items)}</span> 件</span>', s, count=1)
io.open("gifts.html", "w", encoding="utf-8", newline="\n").write(s)
print("static cards injected:", len(items), "items")
