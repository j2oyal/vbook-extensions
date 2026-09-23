load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var ua = (typeof USER_AGENT !== 'undefined' && USER_AGENT) ? USER_AGENT : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    var cookie = (typeof getCookie === 'function') ? getCookie() : "";
    var headers = {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };
    if (cookie) headers['Cookie'] = cookie;

    var response = fetch(url, { headers: headers });
    if (!response.ok) {
        sleep(500);
        response = fetch(url, { headers: headers });
    }

    if (response.ok) {
        try {
            var sc = response.header("set-cookie") || (response.headers && response.headers["set-cookie"]);
            if (sc && typeof saveCookie === 'function') saveCookie(sc);
        } catch (e) {}

        var doc = response.html();
        var list = [];
        var truyenId = doc.select("input#truyen-id").attr("value");
        var truyenAscii = doc.select("input#truyen-ascii").attr("value");
        var page = doc.select("input#total-page").attr("value");
        if (page) page = parseInt(page, 10); else page = 1;
        for (var i = 1; i <= page; i++) {
            list.push(BASE_URL + "/ajax.php?type=list_chapter&tid=" + truyenId + "&tascii=" + truyenAscii + "&page=" + i + "&totalp=" + page);
        }
        return Response.success(list);
    }

    return Response.error("HTTP " + response.status + " - Vui lòng mở trình duyệt để xác thực hoặc thử lại!");
}