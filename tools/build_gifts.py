# -*- coding: utf-8 -*-
"""SNS調査で集めた候補商品（034_GiftManagement/candidate-products.json）と
商品台帳（gift-catalog-site/public/products.json）を突き合わせて、
サイトのギフトカタログが読む data/gifts.json を作る。

使い方: python tools/build_gifts.py <candidate-products.json> <products.json>
出力は静的JSON。画像は楽天のサムネイルURL、購入リンクは楽天アフィリエイト /
Amazon アソシエイト（okurune-22）付きのもの。
"""
import io, json, sys, os

cand_path, prod_path = sys.argv[1], sys.argv[2]
cands = json.load(io.open(cand_path, encoding="utf-8"))
prods = {p["id"]: p for p in json.load(io.open(prod_path, encoding="utf-8"))}

# 表示順・絞り込みに使うタグ語彙。ここに無いタグは「特徴」として残す
RECIPIENTS = ["女友達", "女性", "彼女", "妻", "彼氏", "夫", "夫婦", "男性", "母", "ママ", "父", "両親",
              "祖父母", "祖母", "祖父", "同僚", "上司", "赤ちゃん", "子ども", "家族", "友人", "友達"]
OCCASIONS = ["誕生日", "記念日", "結婚祝い", "出産祝い", "新築祝い", "引っ越し祝い", "退職祝い",
             "お礼", "手土産", "プレゼント交換", "クリスマス", "父の日", "母の日", "敬老の日",
             "バレンタイン", "ホワイトデー", "内祝い", "お返し"]
BUDGETS = ["1000-2000", "2000-3000", "3000-5000", "5000-10000", "10000-"]
AGES = ["10代", "20代", "30代", "40代", "50代", "60代"]

def bucket(price):
    if price is None: return None
    if price < 2000: return "1000-2000"
    if price < 3000: return "2000-3000"
    if price < 5000: return "3000-5000"
    if price < 10000: return "5000-10000"
    return "10000-"

out = []
for c in cands:
    p = prods.get(c["id"], {})
    tags = [t.strip() for t in c["tags"].split(",") if t.strip()]
    price = c.get("priceMin") or p.get("priceMin")
    item = {
        "id": c["id"],
        "brand": c.get("brand") or p.get("brand") or "",
        "name": c["name"],
        "price": price,
        "budget": bucket(price),
        "image": c.get("image") or p.get("image"),
        "rakuten": p.get("rakutenUrl"),
        "amazon": p.get("amazonUrl"),
        "desc": c.get("description") or p.get("description") or "",
        "to": [t for t in tags if t in RECIPIENTS],
        "scene": [t for t in tags if t in OCCASIONS],
        "age": [t for t in tags if t in AGES],
        "feature": [t for t in tags if t not in RECIPIENTS + OCCASIONS + BUDGETS + AGES],
        "evidence": p.get("evidenceCount", 1),
    }
    if not item["image"] or not (item["rakuten"] or item["amazon"]):
        continue
    out.append(item)

# 紹介された回数が多いもの → 価格が手頃なもの の順
out.sort(key=lambda x: (-x["evidence"], x["price"] or 0))
os.makedirs("data", exist_ok=True)
with io.open("data/gifts.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({"updated": "2026-09-02", "items": out}, f, ensure_ascii=False, indent=1)
print(len(out), "items")
import collections
for k in ("to", "scene", "budget", "feature"):
    cnt = collections.Counter()
    for x in out:
        v = x[k]
        for t in (v if isinstance(v, list) else [v]):
            if t: cnt[t] += 1
    print(k, cnt.most_common(20))
