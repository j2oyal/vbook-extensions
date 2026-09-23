load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let browser = Engine.newBrowser();
    browser.setUserAgent(UserAgent.android());
    browser.launch(url, 8000);
    browser.callJs("if (window.__loadXorContent) window.__loadXorContent();", 2500);
    let doc = browser.html();
    browser.close();

    let titleEl = doc.select("#chapter-title").first();
    let title = titleEl ? titleEl.text().trim() : "";

    let contentEl = doc.select("#ct-p").first();
    if (contentEl) {
        contentEl.select("script, style, svg, .animate-spin, .chapter-source-chrome").remove();
        let content = contentEl.html();
        if (content && content.length > 30 && content.indexOf("animate-spin") === -1) {
            return Response.success(content, title);
        }
    }

    let res = fetch(url, {
        headers: {
            'User-Agent': UserAgent.chrome()
        }
    });
    if (res.ok) {
        let fDoc = res.html();
        let fContentEl = fDoc.select("#ct-p, .reading-content").first();
        if (fContentEl) {
            fContentEl.select("script, style, svg, .animate-spin, .chapter-source-chrome").remove();
            let fContent = fContentEl.html();
            if (fContent && fContent.indexOf("animate-spin") === -1 && fContent.length > 50) {
                let fTitle = fDoc.select("#chapter-title").first();
                return Response.success(fContent, fTitle ? fTitle.text().trim() : title);
            }
        }
    }

    return Response.error("Không thể tải nội dung chương, vui lòng thử lại!");
}
