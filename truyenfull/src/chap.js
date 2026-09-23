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
        .replace(/ƣ/g, 'ư')
        .trim();
    // Gom chữ bị chấm ngắt trong cùng từ, không xóa dấu câu giữa câu
    for (var i = 0; i < 3; i++) {
        text = text.replace(/([a-zà-ỹ])\s*\.\s*([a-zà-ỹ])/g, '$1$2');
    }
    text = text.replace(/([a-zà-ỹ])\s*\/\s*([a-zà-ỹ])/g, '$1$2');
    return text;
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

    if (response.ok) {
        try {
            var sc = response.header("set-cookie") || (response.headers && response.headers["set-cookie"]);
            if (sc && typeof saveCookie === 'function') saveCookie(sc);
        } catch (e) {}

        var doc = response.html();
        // loại bỏ các phần tử rác
        doc.select("noscript").remove();
        doc.select("script").remove();
        doc.select("iframe").remove();
        doc.select("div.ads-responsive").remove();
        doc.select("[style=font-size.0px;]").remove();
        doc.select("a").remove();
        // lấy nội dung chương
        var rawTxt = doc.select("div.chapter-c").html();
        // xóa phần chú thích "chương có ảnh"
        rawTxt = rawTxt.replace(/<em>.*?Chương này có nội dung ảnh.*?<\/em>/gi, '');
        // làm sạch HTML
        var cleanedTxt = cleanHtml(rawTxt);
        return Response.success(cleanedTxt);
    }
    return Response.error("HTTP " + response.status + " - Vui lòng mở trình duyệt để xác thực hoặc thử lại!");
}