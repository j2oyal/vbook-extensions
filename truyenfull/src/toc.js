load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    // Case 1: Called via page.js (URL is ajax.php endpoint)
    if (url.indexOf("ajax.php") !== -1) {
        let response = fetch(url);
        if (!response.ok) {
            sleep(500);
            response = fetch(url);
        }
        if (response.ok) {
            let json = response.json();
            if (json && json.chap_list) {
                let doc = Html.parse(json.chap_list);
                let list = [];
                doc.select(".list-chapter li a").forEach(e => {
                    list.push({
                        name: e.text(),
                        url: e.attr("href"),
                        host: BASE_URL
                    });
                });
                return Response.success(list);
            }
        }
        return null;
    }

    // Case 2: Called directly with story detail URL
    let response = fetch(url);
    if (!response.ok) {
        sleep(500);
        response = fetch(url);
    }
    if (response.ok) {
        let doc = response.html();
        let truyenId = doc.select("input#truyen-id").attr("value");
        let truyenAscii = doc.select("input#truyen-ascii").attr("value");
        let totalPage = doc.select("input#total-page").attr("value");
        let page = totalPage ? parseInt(totalPage, 10) : 1;

        let list = [];
        for (let i = 1; i <= page; i++) {
            let ajaxUrl = BASE_URL + "/ajax.php?type=list_chapter&tid=" + truyenId + "&tascii=" + truyenAscii + "&page=" + i + "&totalp=" + page;
            let aRes = fetch(ajaxUrl);
            if (aRes.ok) {
                let json = aRes.json();
                if (json && json.chap_list) {
                    let cDoc = Html.parse(json.chap_list);
                    cDoc.select(".list-chapter li a").forEach(e => {
                        list.push({
                            name: e.text(),
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

    return null;
}