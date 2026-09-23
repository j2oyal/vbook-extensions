load('config.js');

function decodeBase64(input) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var str = String(input).replace(/=+$/, '');
    var output = [];
    for (var bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output.push(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
    }
    return output;
}

function decodeUtf8(bytes) {
    var out = '';
    var i = 0;
    var len = bytes.length;
    while (i < len) {
        var c = bytes[i++];
        if (c < 128) {
            out += String.fromCharCode(c);
        } else if (c > 191 && c < 224) {
            var c2 = bytes[i++];
            out += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        } else if (c > 223 && c < 240) {
            var c2 = bytes[i++];
            var c3 = bytes[i++];
            out += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        } else {
            var c2 = bytes[i++];
            var c3 = bytes[i++];
            var c4 = bytes[i++];
            var u = (((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000;
            out += String.fromCharCode(0xD800 + (u >> 10));
            out += String.fromCharCode(0xDC00 + (u & 0x3FF));
        }
    }
    return out;
}

function decryptContent(d, k) {
    var rawBytes = decodeBase64(d);
    var decryptedBytes = [];
    for (var i = 0; i < rawBytes.length; i++) {
        decryptedBytes.push(rawBytes[i] ^ k.charCodeAt(i % k.length));
    }
    return decodeUtf8(decryptedBytes);
}

function execute(url) {
    url = normalizeUrl(url);
    let res = fetch(url, {
        headers: {
            'User-Agent': USER_AGENT
        }
    });
    if (!res.ok) return Response.error("HTTP " + res.status);
    let text = res.text();
    let doc = res.html();

    // 1. Check if chapter is encrypted via Ajax (like Chapter 2+)
    let urlMatch = text.match(/contentUrl\s*=\s*"([^"]+)"/);
    let tokenMatch = text.match(/contentToken\s*=\s*"([^"]+)"/);
    let csrfMatch = text.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/);

    if (urlMatch && tokenMatch) {
        let rawContentUrl = urlMatch[1].replace(/\\/g, '');
        let fullContentUrl = BASE_URL + rawContentUrl;
        let apiRes = fetch(fullContentUrl, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfMatch ? csrfMatch[1] : '',
                'X-Content-Token': tokenMatch[1],
                'User-Agent': USER_AGENT,
                'Referer': url
            }
        });
        if (apiRes.ok) {
            let json = apiRes.json();
            if (json && json.d && json.k) {
                let decrypted = decryptContent(json.d, json.k);
                if (decrypted && decrypted.length > 20) {
                    return Response.success(decrypted);
                }
            }
        }
    }

    // 2. Fallback to static HTML (for chapters rendered statically, like chapter 1)
    let contentEl = doc.select("#content .chap").first();
    if (!contentEl) {
        contentEl = doc.select("#content, .reading-content, article").first();
    }

    if (contentEl) {
        contentEl.select("script, style, svg, .tts-exclude, .animate-spin, .chapter-source-chrome, button").remove();
        let content = contentEl.html().trim();
        let cleanText = content.replace(/<[^>]+>/g, '').trim();
        if (cleanText.length > 20) {
            return Response.success(content);
        }
    }

    return Response.error("Không thể tải nội dung chương, vui lòng thử lại!");
}
