load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var ua = (typeof USER_AGENT !== 'undefined' && USER_AGENT) ? USER_AGENT : "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    var cookie = (typeof getCookie === 'function') ? getCookie() : "";
    var headers = {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };
    if (cookie) headers['Cookie'] = cookie;

    var doc = null;
    var text = "";

    var response = fetch(url, { headers: headers });
    if (response && response.ok) {
        try {
            var sc = response.header("set-cookie") || (response.headers && response.headers["set-cookie"]);
            if (sc && typeof saveCookie === 'function') saveCookie(sc);
        } catch (e) {}

        doc = response.html();
        text = response.text();
    } else {
        // Fallback to Headless WebView if 403 or blocked
        try {
            if (typeof Engine !== "undefined" && typeof Engine.newBrowser === "function") {
                var browser = Engine.newBrowser();
                if (typeof UserAgent !== "undefined" && typeof UserAgent.android === "function") {
                    browser.setUserAgent(UserAgent.android());
                }
                doc = browser.launch(url, 6000);
                browser.close();
                if (doc) text = doc.html();
            }
        } catch (e) {}
    }

    if (!doc) {
        return Response.error("HTTP " + (response ? response.status : 403) + " - Vui lòng mở trình duyệt để xác thực hoặc thử lại!");
    }

    var chapters = [];
    var cleanBase = url.replace(/\/+$/, '');

    // 1. Try finding total chapters from section[data-chapter-list] or text
    var section = doc.select('section[data-chapter-list]').first();
    var total = 0;
    if (section) {
        var totalAttr = section.attr('data-total');
        if (totalAttr) total = parseInt(totalAttr, 10);
    }
    if (!total || isNaN(total)) {
        var numPagesMatch = text.match(/"numberOfPages":\s*(\d+)/);
        if (numPagesMatch) {
            total = parseInt(numPagesMatch[1], 10);
        }
    }

    // 2. Map known chapter names from JSON-LD hasPart if available
    var nameMap = {};
    try {
        var jsonLdMatch = text.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
        if (jsonLdMatch) {
            jsonLdMatch.forEach(function (script) {
                var inner = script.replace(/<\/?script[^>]*>/g, '');
                var data = JSON.parse(inner);
                var list = [];
                if (data && data.hasPart) list = data.hasPart;
                if (data && Array.isArray(data['@graph'])) {
                    data['@graph'].forEach(function (item) {
                        if (item.hasPart) list = list.concat(item.hasPart);
                    });
                }
                list.forEach(function (ch) {
                    if (ch && ch.url && ch.name) {
                        nameMap[ch.url] = ch.name;
                    }
                });
            });
        }
    } catch (e) {
    }

    if (total > 0) {
        for (var i = 1; i <= total; i++) {
            var chapUrl = cleanBase + "/chuong-" + i;
            chapters.push({
                name: nameMap[chapUrl] || ("Chương " + i),
                url: chapUrl,
                host: BASE_URL
            });
        }
        return Response.success(chapters);
    }

    // 3. Fallback to links in static HTML
    var links = doc.select('#chapter-list-page a, #chapter-list-content a, a[href*="/chuong-"]');
    if (!links.isEmpty()) {
        var seen = {};
        links.forEach(function (el) {
            var href = el.attr('href');
            if (href && href.indexOf('/chuong-') !== -1 && !seen[href]) {
                seen[href] = true;
                chapters.push({
                    name: el.text().trim(),
                    url: normalizeUrl(href),
                    host: BASE_URL
                });
            }
        });
        if (chapters.length > 0) {
            return Response.success(chapters);
        }
    }

    return Response.error("Không thể lấy danh sách chương!");
}
