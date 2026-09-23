load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url, {
        headers: {
            'User-Agent': UserAgent.chrome()
        }
    });
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();
    let text = response.text();

    let name = doc.select("h1").first();
    let bookName = name ? name.text().trim() : "";

    let author = "";
    let authorMatch = text.match(/"author":\s*\{\s*"@type":\s*"Person",\s*"name":\s*"([^"]+)"/i);
    if (authorMatch) {
        author = authorMatch[1];
    } else {
        let aEl = doc.select('a[href*="/tac-gia/"]').first();
        if (aEl) author = aEl.text().trim();
    }
    if (!author) author = "Đang cập nhật";

    let cover = "";
    let coverEl = doc.select('meta[property="og:image"]').first();
    if (coverEl) cover = coverEl.attr("content");

    let descEl = doc.select('#post-content-wrapper, #content, .reading-content').first();
    let desc = descEl ? descEl.html() : "";
    if (!desc) {
        let metaDesc = doc.select('meta[name="description"]').first();
        if (metaDesc) desc = metaDesc.attr("content");
    }

    let tags = [];
    doc.select('a[href*="/the-loai/"]').forEach(function(el) {
        tags.push({
            title: el.text().trim(),
            input: el.attr("href"),
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
