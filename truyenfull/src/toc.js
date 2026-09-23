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

    // Case 1: Called via page.js (URL is ajax.php endpoint)
    if (url.indexOf("ajax.php") !== -1) {
        var ajaxHeaders = {
            'User-Agent': ua,
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest'
        };
        if (cookie) ajaxHeaders['Cookie'] = cookie;

        var response = fetch(url, { headers: ajaxHeaders });
        if (!response.ok) {
            sleep(500);
            response = fetch(url, { headers: ajaxHeaders });
        }
        if (response.ok) {
            var json = response.json();
            if (json && json.chap_list) {
                var doc = Html.parse(json.chap_list);
                var list = [];
                doc.select(".list-chapter li a").forEach(function(e) {
                    list.push({
                        name: e.text().trim(),
                        url: e.attr("href"),
                        host: BASE_URL
                    });
                });
                return Response.success(list);
            }
        }
        return Response.error("Không thể lấy danh sách chương từ trang!");
    }

    // Case 2: Called directly with story detail URL
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
        var truyenId = doc.select("input#truyen-id").attr("value");
        var truyenAscii = doc.select("input#truyen-ascii").attr("value");
        var totalPage = doc.select("input#total-page").attr("value");
        var page = totalPage ? parseInt(totalPage, 10) : 1;

        var list = [];
        var ajaxHeaders = {
            'User-Agent': ua,
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': url
        };
        if (cookie) ajaxHeaders['Cookie'] = cookie;

        for (var i = 1; i <= page; i++) {
            var ajaxUrl = BASE_URL + "/ajax.php?type=list_chapter&tid=" + truyenId + "&tascii=" + truyenAscii + "&page=" + i + "&totalp=" + page;
            var aRes = fetch(ajaxUrl, { headers: ajaxHeaders });
            if (aRes.ok) {
                var json = aRes.json();
                if (json && json.chap_list) {
                    var cDoc = Html.parse(json.chap_list);
                    cDoc.select(".list-chapter li a").forEach(function(e) {
                        list.push({
                            name: e.text().trim(),
                            url: e.attr("href"),
                            host: BASE_URL
                        });
                    });
                }
            }
        }
        if (list.length > 0) {
            return Response.success(list);
        }
    }

    return Response.error("HTTP " + response.status + " - Vui lòng mở trình duyệt để xác thực hoặc thử lại!");
}