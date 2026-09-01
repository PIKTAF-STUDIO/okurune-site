/* okurune.com 共通スクリプト
   - ヘッダーのメニュー開閉（スマホ）
   - ギフトカタログ（data/gifts.json）の描画と絞り込み
   依存ライブラリなし。JS が無効でもページの本文とリンクはそのまま読める */
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

    // 絞り込みの語彙と表示順。データ側のタグをこの順に並べる
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

    function card(item) {
        var shops = '';
        if (item.rakuten) shops += '<a class="shop-rakuten" href="' + esc(item.rakuten) + '" target="_blank" rel="sponsored noopener">楽天市場で見る</a>';
        if (item.amazon) shops += '<a class="shop-amazon" href="' + esc(item.amazon) + '" target="_blank" rel="sponsored noopener">Amazonで見る</a>';
        var tags = values(item, 'to').slice(0, 1).concat(values(item, 'scene').slice(0, 1)).concat(values(item, 'feature').slice(0, 1));
        var tagHtml = tags.map(function (t) { return '<span class="badge badge-soft">' + esc(t) + '</span>'; }).join('');
        return '<article class="gift-card">' +
            '<div class="ph"><img src="' + esc(item.image) + '" alt="' + esc(item.brand + ' ' + item.name) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{textContent:\'🎁\',style:\'font-size:40px\'}))"></div>' +
            '<div class="body">' +
            '<div class="brand-name">' + esc(item.brand || 'ブランドなし') + '</div>' +
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
        .catch(function () {
            var box = featured || catalog;
            box.innerHTML = '<div class="empty">ギフトの一覧をいま読み込めません<br><a href="/articles/">マガジンの記事から探す</a></div>';
        });

    // ---- トップの「SNSで話題のギフト」 ----
    function renderFeatured(items) {
        // 同じブランドばかり並ばないように、ブランドごとに1点ずつ拾う
        var seen = {}, picked = [];
        items.forEach(function (it) {
            var b = it.brand || it.id;
            if (seen[b] || picked.length >= 8) return;
            seen[b] = true; picked.push(it);
        });
        featured.innerHTML = picked.map(card).join('');
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
        if (updatedEl && updated) updatedEl.textContent = updated.replace(/-/g, '/') + ' 更新';
        if (sortSel) { sortSel.value = sort; sortSel.addEventListener('change', function () { sort = sortSel.value; render(); }); }

        // 各グループのチップ。データに存在するタグだけ、決めた順で出す
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
                b.addEventListener('click', function () {
                    var arr = state[g.key];
                    var i = arr.indexOf(t);
                    if (i > -1) arr.splice(i, 1); else arr.push(t);
                    b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
                    render();
                });
                chips.appendChild(b);
            });
            filters.appendChild(row);
        });
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
