load('config.js');

function cleanHtml(htm) {
    if (!htm) return "";
    var text = htm
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<a[^>]*>.*?<\/a>/gi, '')
        .replace(/<\/?(?:div|span)[^>]*>/gi, '')
        .replace(/&(?:nbsp|amp|quot|lt|gt);/g, '')
        .replace(/(<br>\s*){2,}/g, '<br>')
        .replace(/^(?:<br>\s*)+|(?:<br>\s*)+$/g, '')
        .replace(/[\\]/g, '')
        .replace(/[\u201c\u201d"]/g, '"')
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .replace(/ch\*t/gi, 'chết')
        .replace(/gi\*t/gi, 'giết')
        .replace(/s\*t/gi, 'sát')
        .replace(/v\*n/gi, 'vẫn')
        .replace(/th\*/gi, 'thi')
        .replace(/t\s*\*\s*nh\s*d\s*\*\s*c/gi, 'tình dục')
        .replace(/\*m\s*đ\**/gi, 'âm đạo')
        .replace(/\//g, '')
        .replace(/ƣ/g, 'ư')
        .trim();
    // Gom chữ bị chấm ngắt trong cùng từ, không xóa dấu câu giữa câu
    for (var i = 0; i < 3; i++) {
        text = text.replace(/([a-zà-ỹ])\s*\.\s*([a-zà-ỹ])/g, '$1$2');
    }
    text = text.replace(/([a-zà-ỹ])\s*\/\s*([a-zà-ỹ])/g, '$1$2');
    return text;
}

function parseDetailDoc(doc) {
    if (!doc) return null;
    var genres = [];

    // tác giả
    var authorEl = doc.select("a[itemprop=author]").first();
    var authorName = authorEl ? authorEl.text().trim() : "";
    var authorHref = authorEl ? authorEl.attr("href") : "";
    if (authorName) {
        genres.push({
            title: authorName,
            input: authorHref,
            script: "gen.js"
        });
    }

    // thể loại
    doc.select(".info a[itemprop=genre]").forEach(function(e) {
        genres.push({
            title: e.text().trim(),
            input: e.attr("href"),
            script: "gen.js"
        });
    });

    // gợi ý cùng tác giả
    var suggests = [];
    if (authorHref) {
        suggests.push({
            title: "Cùng tác giả",
            input: authorHref,
            script: "gen.js"
        });
    }

    // mô tả, đã làm sạch HTML
    var rawDesc = doc.select("div.desc-text").html();
    var cleanedDesc = cleanHtml(rawDesc);

    var titleEl = doc.select("h3.title").first();
    var title = titleEl ? titleEl.text().trim() : "";

    var coverEl = doc.select("div.book img").first();
    var cover = coverEl ? (coverEl.attr("data-src") || coverEl.attr("src")) : "";

    var authorInfoEl = doc.select("div.info div a").first();
    var authorText = authorInfoEl ? authorInfoEl.text().trim() : (authorName || "Đang cập nhật");

    if (!title && !authorText) return null;

    return {
        name: title,
        cover: cover,
        author: authorText,
        description: cleanedDesc,
        detail: "Tác giả: " + authorText,
        ongoing: doc.select("div.info").html().indexOf(">Đang ra<") > 0,
        genres: genres,
        suggests: suggests,
        host: BASE_URL
    };
}

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

    if (response && response.ok) {
        try {
            var sc = response.header("set-cookie") || (response.headers && response.headers["set-cookie"]);
            if (sc && typeof saveCookie === 'function') saveCookie(sc);
        } catch (e) {}

        var doc = response.html();
        var data = parseDetailDoc(doc);
        if (data) {
            return Response.success(data);
        }
    }

    // Headless WebView Fallback (for Cloudflare challenges or protected pages)
    try {
        if (typeof Engine !== "undefined" && typeof Engine.newBrowser === "function") {
            var browser = Engine.newBrowser();
            if (typeof UserAgent !== "undefined" && typeof UserAgent.android === "function") {
                browser.setUserAgent(UserAgent.android());
            }
            var bDoc = browser.launch(url, 6000);
            browser.close();
            if (bDoc) {
                var bData = parseDetailDoc(bDoc);
                if (bData) {
                    return Response.success(bData);
                }
            }
        }
    } catch (e) {}

    return Response.error("HTTP " + (response ? response.status : 403) + " - Vui lòng mở trình duyệt để xác thực hoặc thử lại!");
}
