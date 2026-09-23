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

    let chapters = [];

    let section = doc.select('section[data-chapter-list]').first();
    let total = 0;
    if (section) {
        let totalAttr = section.attr('data-total');
        if (totalAttr) total = parseInt(totalAttr, 10);
    }

    if (total > 0) {
        let cleanBase = url.replace(/\/+$/, '');
        for (let i = 1; i <= total; i++) {
            chapters.push({
                name: "Chương " + i,
                url: cleanBase + "/chuong-" + i,
                host: BASE_URL
            });
        }
        return Response.success(chapters);
    }

    let links = doc.select('#chapter-list-page a, #chapter-list-content a, a[href*="/chuong-"]');
    if (!links.isEmpty()) {
        let seen = {};
        links.forEach(function (el) {
            let href = el.attr('href');
            if (href && href.indexOf('/chuong-') !== -1 && !seen[href]) {
                seen[href] = true;
                chapters.push({
                    name: el.text().trim(),
                    url: href,
                    host: BASE_URL
                });
            }
        });
        if (chapters.length > 0) {
            return Response.success(chapters);
        }
    }

    let browser = Engine.newBrowser();
    browser.setUserAgent(UserAgent.android());
    browser.launch(url, 6000);
    browser.callJs("if (document.getElementById('btn-toggle-chapters')) document.getElementById('btn-toggle-chapters').click();", 2500);
    let bDoc = browser.html();
    browser.close();

    let seen = {};
    bDoc.select('#chapter-list-page a, a[href*="/chuong-"]').forEach(function (el) {
        let href = el.attr('href');
        if (href && href.indexOf('/chuong-') !== -1 && !seen[href]) {
            seen[href] = true;
            chapters.push({
                name: el.text().trim(),
                url: href,
                host: BASE_URL
            });
        }
    });

    return Response.success(chapters);
}
