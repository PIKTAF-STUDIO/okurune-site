/* okurune.com 共通スクリプト
   - ヘッダーのメニュー開閉（スマホ）
   - ギフトカタログ（data/gifts.json）の描画と絞り込み
   依存ライブラリなし。JS が無効でも本文・リンク・静的に埋め込んだカードはそのまま読める */
(function () {
    'use strict';

    // ---- スマホのメニュー ----
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.site-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (!nav.contains(e.target) && !toggle.contains(e.target)) nav.classList.remove('open');
        });
    }

    // ---- ギフトデータ ----
    var featured = document.getElementById('trend-grid');
    var catalog = document.getElementById('gift-grid');
    if (!featured && !catalog) return;

    var yen = function (n) { return n == null ? '' : n.toLocaleString('ja-JP'); };
    var esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };

    // 絞り込みの語彙と表示順。データ側のタグをこの順に並べる（tools/build_gifts.py と対応）
    var GROUPS = [
        { key: 'to', label: '相手', order: ['女友達', '女性', '彼女', '妻', '彼氏', '夫', '夫婦', '男性', '母', 'ママ', '父', '両親', '祖母', '祖父', '祖父母', '同僚', '上司', '赤ちゃん', '家族', '友達'] },
        { key: 'scene', label: 'シーン', order: ['誕生日', '記念日', '結婚祝い', '出産祝い', '新築祝い', '引っ越し祝い', '退職祝い', 'お礼', '手土産', 'プレゼント交換', 'クリスマス', '母の日', '父の日', '敬老の日'] },
        { key: 'budget', label: '予算', order: ['1000-2000', '2000-3000', '3000-5000', '5000-10000', '10000-'] },
        { key: 'feature', label: '特徴', order: ['実用的', '消耗品', '定番', '高見え', 'センスいい', 'おしゃれ', 'かわいい', '自分では買わない', '人と被らない', 'もらって嬉しい', '気を遣わせない', 'プチギフト', 'コスメ', 'デパコス', 'バッグ', 'アクセサリー', 'スイーツ'] }
    ];
    var BUDGET_LABEL = { '1000-2000': '〜2,000円', '2000-3000': '2,000〜3,000円', '3000-5000': '3,000〜5,000円', '5000-10000': '5,000〜10,000円', '10000-': '10,000円〜' };

    function values(item, key) {
        var v = item[key];
        if (v == null) return [];
        return Array.isArray(v) ? v : [v];
    }

    // 商品カード。tools/render_static.py が出す静的HTMLと同じ構造にしておく
    function card(item) {
        var shops = '';
        if (item.rakuten) shops += '<a class="shop shop-rakuten" href="' + esc(item.rakuten) + '" target="_blank" rel="sponsored noopener">楽天市場で見る</a>';
        if (item.amazon) shops += '<a class="shop shop-amazon" href="' + esc(item.amazon) + '" target="_blank" rel="sponsored noopener">Amazonで見る</a>';
        var tags = values(item, 'scene').slice(0, 1).concat(values(item, 'to').slice(0, 1));
        var tagHtml = tags.map(function (t) { return '<span class="badge badge-soft">' + esc(t) + '</span>'; }).join('');
        return '<article class="gift-card">' +
            '<div class="ph"><img src="' + esc(item.image) + '" alt="' + esc(item.brand + ' ' + item.name) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add(\'noimg\');this.remove()"></div>' +
            '<div class="body">' +
            '<div class="brand-name">' + esc(item.brand || 'ノーブランド') + '</div>' +
            '<h3>' + esc(item.name) + '</h3>' +
            '<p class="desc">' + esc(item.desc) + '</p>' +
            '<div class="meta"><span class="price">' + (item.price != null ? '<small>¥</small>' + yen(item.price) : '<small>価格は店舗で確認</small>') + '</span><span class="tags">' + tagHtml + '</span></div>' +
            '<div class="shops">' + shops + '</div>' +
            '</div></article>';
    }

    fetch('/data/gifts.json', { cache: 'force-cache' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
            var items = data.items || [];
            if (featured) renderFeatured(items);
            if (catalog) initCatalog(items, data.updated);
        })
        .catch(function () { /* 静的に埋め込んだカードがそのまま残るので何もしない */ });

    // ---- トップの「SNSで話題のギフト」（ブランドが重ならないよう8点） ----
    function pickFeatured(items, n) {
        var seen = {}, picked = [];
        items.forEach(function (it) {
            var b = it.brand || it.id;
            if (seen[b] || picked.length >= n) return;
            seen[b] = true; picked.push(it);
        });
        return picked;
    }
    function renderFeatured(items) {
        featured.innerHTML = pickFeatured(items, 8).map(card).join('');
    }

    // ---- カタログページ ----
    function initCatalog(items, updated) {
        var state = {};
        var params = new URLSearchParams(location.search);
        GROUPS.forEach(function (g) {
            var raw = params.get(g.key);
            state[g.key] = raw ? raw.split(',').filter(Boolean) : [];
        });
        var sort = params.get('sort') || 'recommended';

        var filters = document.getElementById('filters');
        var count = document.getElementById('result-count');
        var sortSel = document.getElementById('sort');
        var updatedEl = document.getElementById('data-updated');
        var openBtn = document.getElementById('filter-toggle');
        var active = document.getElementById('active-filters');
        if (updatedEl && updated) updatedEl.textContent = updated.replace(/-/g, '/') + ' 時点の情報です';
        if (sortSel) { sortSel.value = sort; sortSel.addEventListener('change', function () { sort = sortSel.value; render(); }); }

        // スマホでは絞り込みパネルを畳んでおき、ボタンで開閉する
        if (openBtn && filters) {
            openBtn.addEventListener('click', function () {
                var open = filters.classList.toggle('open');
                openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        }

        // 各グループのチップ。データに存在するタグだけ、決めた順で出す
        var chipByKey = {};
        GROUPS.forEach(function (g) {
            var present = {};
            items.forEach(function (it) { values(it, g.key).forEach(function (v) { present[v] = (present[v] || 0) + 1; }); });
            var tags = g.order.filter(function (t) { return present[t]; });
            if (!tags.length) return;
            var row = document.createElement('div');
            row.className = 'filter-group';
            row.innerHTML = '<div class="k">' + esc(g.label) + '</div><div class="chip-row" data-key="' + g.key + '"></div>';
            var chips = row.querySelector('.chip-row');
            tags.forEach(function (t) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'chip';
                b.dataset.value = t;
                b.textContent = g.key === 'budget' ? (BUDGET_LABEL[t] || t) : t;
                b.setAttribute('aria-pressed', state[g.key].indexOf(t) > -1 ? 'true' : 'false');
                b.addEventListener('click', function () { toggleValue(g.key, t); });
                chipByKey[g.key + ':' + t] = b;
                chips.appendChild(b);
            });
            filters.appendChild(row);
        });
        function toggleValue(key, t) {
            var arr = state[key];
            var i = arr.indexOf(t);
            if (i > -1) arr.splice(i, 1); else arr.push(t);
            var b = chipByKey[key + ':' + t];
            if (b) b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
            render();
        }
        var clear = document.getElementById('clear-filters');
        if (clear) clear.addEventListener('click', function () {
            GROUPS.forEach(function (g) { state[g.key] = []; });
            filters.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
            render();
        });

        function matches(it) {
            // グループ内は OR、グループ間は AND
            return GROUPS.every(function (g) {
                var want = state[g.key];
                if (!want.length) return true;
                var have = values(it, g.key);
                return want.some(function (w) { return have.indexOf(w) > -1; });
            });
        }

        function render() {
            var list = items.filter(matches);
            if (sort === 'price-low') list.sort(function (a, b) { return (a.price || 1e9) - (b.price || 1e9); });
            else if (sort === 'price-high') list.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
            else list.sort(function (a, b) { return (b.evidence - a.evidence) || ((a.price || 0) - (b.price || 0)); });

            catalog.innerHTML = list.length ? list.map(card).join('')
                : '<div class="empty">この条件に合う贈り物はまだありません<br>条件を減らすか <a href="/articles/">マガジンの記事</a> も参考にしてください</div>';
            if (count) count.innerHTML = '<span class="num">' + list.length + '</span> 件';

            // 選択中の条件をツールバーに出す（タップで解除）
            var n = 0;
            if (active) {
                active.innerHTML = '';
                GROUPS.forEach(function (g) {
                    state[g.key].forEach(function (t) {
                        n++;
                        var b = document.createElement('button');
                        b.type = 'button'; b.className = 'chip on';
                        b.textContent = (g.key === 'budget' ? (BUDGET_LABEL[t] || t) : t) + ' ×';
                        b.addEventListener('click', function () { toggleValue(g.key, t); });
                        active.appendChild(b);
                    });
                });
                active.hidden = n === 0;
            }
            if (openBtn) openBtn.textContent = n ? '絞り込み（' + n + '）' : '絞り込み';
            if (clear) clear.hidden = n === 0;

            // 選んだ条件を URL に残す（共有・戻るで再現できる）
            var p = new URLSearchParams();
            GROUPS.forEach(function (g) { if (state[g.key].length) p.set(g.key, state[g.key].join(',')); });
            if (sort !== 'recommended') p.set('sort', sort);
            var qs = p.toString();
            history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
        }
        render();
    }
})();
