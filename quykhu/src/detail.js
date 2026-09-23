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

    var response = fetch(url, { headers: headers });
    if (!response.ok) return Response.error("HTTP " + response.status);

    try {
        var sc = response.header("set-cookie") || (response.headers && response.headers["set-cookie"]);
        if (sc && typeof saveCookie === 'function') saveCookie(sc);
    } catch (e) {}

    var doc = response.html();
    var text = response.text();

    var name = doc.select("h1").first();
    var bookName = name ? name.text().trim() : "";

    var author = "";
    var authorMatch = text.match(/"author":\s*\{\s*"@type":\s*"Person",\s*"name":\s*"([^"]+)"/i);
    if (authorMatch) {
        author = authorMatch[1];
    } else {
        var aEl = doc.select('a[href*="/tac-gia/"]').first();
        if (aEl) author = aEl.text().trim();
    }
    if (!author) author = "Đang cập nhật";

    var cover = "";
    var coverEl = doc.select('meta[property="og:image"]').first();
    if (coverEl) cover = coverEl.attr("content");

    var descEl = doc.select('#post-content-wrapper, #content, .reading-content').first();
    var desc = descEl ? descEl.html() : "";
    if (!desc) {
        var metaDesc = doc.select('meta[name="description"]').first();
        if (metaDesc) desc = metaDesc.attr("content");
    }

    var tags = [];
    doc.select('a[href*="/the-loai/"]').forEach(function(el) {
        tags.push({
            title: el.text().trim(),
            input: normalizeUrl(el.attr("href")),
            script: "gen.js"
        });
    });

    return Response.success({
        name: bookName,
        cover: cover,
        author: author,
        description: desc,
        detail: "Tác giả: " + author,
        ongoing: true,
        host: BASE_URL,
        genres: tags
    });
}
