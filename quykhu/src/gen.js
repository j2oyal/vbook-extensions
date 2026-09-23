load('config.js');
function execute(url, page) {
    page = page || "1";
    let fetchUrl = BASE_URL + url;
    if (fetchUrl.indexOf('?') === -1) {
        fetchUrl += "?page=" + page;
    } else {
        fetchUrl += "&page=" + page;
    }

    let response = fetch(fetchUrl, {
        headers: {
            'User-Agent': UserAgent.chrome()
        }
    });
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = [];
    doc.select('.qk-post-card, article, div.flex.gap-3').forEach(function (el) {
        let titleEl = el.select('a.qk-post-card__title, h2 a, h3 a').first();
        if (titleEl) {
            let name = titleEl.text().trim();
            let link = titleEl.attr('href');
            let coverEl = el.select('img').first();
            let cover = coverEl ? (coverEl.attr('data-src') || coverEl.attr('src')) : "";
            let descEl = el.select('.qk-post-card__excerpt, p, .desc').first();
            let desc = descEl ? descEl.text().trim() : "";

            if (name && link) {
                items.push({
                    name: name,
                    link: link,
                    cover: cover,
                    description: desc,
                    host: BASE_URL
                });
            }
        }
    });

    let next = "";
    let nextBtn = doc.select('a[rel="next"], .pagination .next a').first();
    if (nextBtn) {
        next = (parseInt(page, 10) + 1).toString();
    }

    return Response.success(items, next);
}
