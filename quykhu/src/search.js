load('config.js');
function execute(key, page) {
    page = page || "1";
    var url = BASE_URL + "/search?keyword=" + encodeURIComponent(key) + "&page=" + page;
    var ua = (typeof USER_AGENT !== 'undefined' && USER_AGENT) ? USER_AGENT : "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    var cookie = (typeof getCookie === 'function') ? getCookie() : "";
    var headers = {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };
    if (cookie) headers['Cookie'] = cookie;

    var response = fetch(url, { headers: headers });
    if (!response.ok) return Response.error("HTTP " + response.status);

    try {
        var sc = response.header("set-cookie") || (response.headers && response.headers["set-cookie"]);
        if (sc && typeof saveCookie === 'function') saveCookie(sc);
    } catch (e) {}

    var doc = response.html();

    var items = [];
    doc.select('.qk-post-card, article, div.flex.gap-3').forEach(function (el) {
        var titleEl = el.select('a.qk-post-card__title, h2 a, h3 a').first();
        if (titleEl) {
            var name = titleEl.text().trim();
            var link = titleEl.attr('href');
            var coverEl = el.select('img').first();
            var cover = coverEl ? (coverEl.attr('data-src') || coverEl.attr('src')) : "";
            var descEl = el.select('.qk-post-card__excerpt, p, .desc').first();
            var desc = descEl ? descEl.text().trim() : "";

            if (name && link) {
                items.push({
                    name: name,
                    link: normalizeUrl(link),
                    cover: cover,
                    description: desc,
                    host: BASE_URL
                });
            }
        }
    });

    var next = "";
    var nextBtn = doc.select('a[rel="next"], .pagination .next a').first();
    if (nextBtn) {
        next = (parseInt(page, 10) + 1).toString();
    }

    return Response.success(items, next);
}
