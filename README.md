# okurune-site

おくるね公式サイト（https://okurune.com/ ・GitHub Pages）。
piktaf-studio.com/okurune/ から 2026-09-01 に切り出した。

## 構成

| パス | 役割 |
|---|---|
| `index.html` | 贈り物の総合トップ（シーン/相手/予算の入口・SNSで話題のギフト・マナー早見表・お問い合わせ `#contact`） |
| `gifts.html` + `data/gifts.json` | ギフトカタログ。`tools/build_gifts.py` で 034 リポの candidate-products.json から生成 |
| `app.html` | アプリ紹介（機能・プライバシー・プレミアム・ダウンロード） |
| `privacy.html` `terms.html` `tokushoho.html` | アプリの規約類。ストア掲載・アプリ内リンクの飛び先 |
| `site-privacy.html` | このサイト自体（GA4・Cookie）のポリシー。同意バナーの飛び先 |
| `articles/` | おくるねマガジン（記事・`media.css` `media.js`） |
| `data/articles.json` | **アプリが1日1回取得する記事一覧**。パスと項目名を変えない |
| `css/okurune.css` `js/site.js` | アプリのポップテーマ（app_theme.dart の OkuruneColors）と同じトークンで組んだ共通スタイル・メニュー/カタログの動き |
| `js/analytics.js` | piktaf-studio.com と共通の GA4 同意管理 |

## アプリとの取り決め

- アプリ（`app/lib/config/app_links.dart`）が開くURL: `/privacy.html` `/terms.html` `/tokushoho.html` `/#contact`
- アプリが取得するJSON: `/data/articles.json`（記事）、`/data/rakuten-config.json`（楽天キーの上書き・任意）
- `articles.json` のタグ規約（`scene:` `gender:` `age:` `scene:okaeshi`）と `showFrom` / `showUntil` はアプリ側の選別に使う

## 旧URLについて

旧 `https://piktaf-studio.com/okurune/` は当面そのまま残す（配布済みアプリが旧 `articles.json` を読むため）。
新ドメインのアプリが行き渡ったら、旧ページを本サイトへの転送に切り替える。
