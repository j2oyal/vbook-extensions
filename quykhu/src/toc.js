load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url, {
        headers: {
            'User-Agent': USER_AGENT
        }
    });
    if (!response.ok) return Response.error("HTTP " + response.status);
    let text = response.text();
    let doc = response.html();

    let chapters = [];
    let cleanBase = url.replace(/\/+$/, '');

    // 1. Try finding total chapters from section[data-chapter-list] or text
    let section = doc.select('section[data-chapter-list]').first();
    let total = 0;
    if (section) {
        let totalAttr = section.attr('data-total');
        if (totalAttr) total = parseInt(totalAttr, 10);
    }
    if (!total || isNaN(total)) {
        let numPagesMatch = text.match(/"numberOfPages":\s*(\d+)/);
        if (numPagesMatch) {
            total = parseInt(numPagesMatch[1], 10);
        }
    }

    // 2. Map known chapter names from JSON-LD hasPart if available
    let nameMap = {};
    try {
        let jsonLdMatch = text.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
        if (jsonLdMatch) {
            jsonLdMatch.forEach(function (script) {
                let inner = script.replace(/<\/?script[^>]*>/g, '');
                let data = JSON.parse(inner);
                let list = [];
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
        for (let i = 1; i <= total; i++) {
            let chapUrl = cleanBase + "/chuong-" + i;
            chapters.push({
                name: nameMap[chapUrl] || ("Chương " + i),
                url: chapUrl,
                host: BASE_URL
            });
        }
        return Response.success(chapters);
    }

    // 3. Fallback to links in static HTML
    let links = doc.select('#chapter-list-page a, #chapter-list-content a, a[href*="/chuong-"]');
    if (!links.isEmpty()) {
        let seen = {};
        links.forEach(function (el) {
            let href = el.attr('href');
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

