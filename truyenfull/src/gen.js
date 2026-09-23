load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    var cleanUrl = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL).replace(/\/+$/, '');
    var fetchUrl = cleanUrl;
    if (page !== '1') {
        fetchUrl += "/trang-" + page + "/";
    } else {
        fetchUrl += "/";
    }

    var ua = (typeof USER_AGENT !== 'undefined' && USER_AGENT) ? USER_AGENT : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    var cookie = (typeof getCookie === 'function') ? getCookie() : "";
    var headers = {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };
    if (cookie) headers['Cookie'] = cookie;

    var response = fetch(fetchUrl, { headers: headers });
    if (!response.ok) {
        sleep(500);
        response = fetch(fetchUrl, { headers: headers });
    }

    if (response.ok) {
        try {
            var sc = response.header("set-cookie") || (response.headers && response.headers["set-cookie"]);
            if (sc && typeof saveCookie === 'function') saveCookie(sc);
        } catch (e) {}

        var doc = response.html();
        var novelList = [];
        var next = doc.select(".pagination > li.active + li").last().text().trim();
        doc.select(".list-truyen div[itemscope]").forEach(function(e) {
            var titleEl = e.select(".truyen-title > a").first();
            if (titleEl) {
                var imgEl = e.select("[data-image]").first();
                var cover = imgEl ? imgEl.attr("data-image") : "";
                novelList.push({
                    name: titleEl.text().trim(),
                    link: titleEl.attr("href"),
                    description: e.select(".author").text().trim(),
                    cover: cover,
                    host: BASE_URL,
                });
            }
        });
        return Response.success(novelList, next);
    }
    return Response.error("HTTP " + response.status + " - Vui lòng mở trình duyệt để xác thực hoặc thử lại!");
}