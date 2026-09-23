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
    var ua = (typeof USER_AGENT !== 'undefined' && USER_AGENT) ? USER_AGENT : "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    
    var cookie = "";
    if (typeof getCookie === 'function') {
        cookie = getCookie();
    }

    var headers = {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };
    if (cookie) {
        headers['Cookie'] = cookie;
    }

    var res = fetch(url, { headers: headers });
    if (!res.ok) return Response.error("HTTP " + res.status);

    // Save any returned session cookie
    try {
        var sc = res.header("set-cookie") || (res.headers && res.headers["set-cookie"]);
        if (sc && typeof saveCookie === 'function') {
            saveCookie(sc);
        }
    } catch (e) {}

    var text = res.text();
    var doc = res.html();

    // 1. Check if chapter content is encrypted via Ajax
    var urlMatch = text.match(/contentUrl\s*=\s*"([^"]+)"/);
    var tokenMatch = text.match(/contentToken\s*=\s*"([^"]+)"/);
    var csrfMatch = text.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/);

    if (urlMatch && tokenMatch) {
        var rawContentUrl = urlMatch[1].replace(/\\/g, '');
        var fullContentUrl = BASE_URL + rawContentUrl;
        
        var apiCookie = (typeof getCookie === 'function') ? getCookie() : "";
        if (!apiCookie && cookie) {
            apiCookie = cookie;
        }

        var apiHeaders = {
            'Accept': 'application/json, text/plain, */*',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfMatch ? csrfMatch[1] : '',
            'X-Content-Token': tokenMatch[1],
            'User-Agent': ua,
            'Referer': url
        };
        if (apiCookie) {
            apiHeaders['Cookie'] = apiCookie;
        }

        var apiRes = fetch(fullContentUrl, { headers: apiHeaders });
        if (apiRes.ok) {
            var json = apiRes.json();
            if (json && json.d && json.k) {
                var decrypted = decryptContent(json.d, json.k);
                if (decrypted && decrypted.length > 20) {
                    return Response.success(decrypted);
                }
            }
        }
    }

    // 2. Fallback to static HTML (for chapters rendered statically)
    var contentEl = doc.select("#content .chap").first();
    if (!contentEl) {
        contentEl = doc.select("#content, .reading-content, article").first();
    }

    if (contentEl) {
        contentEl.select("script, style, svg, .tts-exclude, .animate-spin, .chapter-source-chrome, button").remove();
        var content = contentEl.html().trim();
        var cleanText = content.replace(/<[^>]+>/g, '').trim();
        if (cleanText.length > 20) {
            return Response.success(content);
        }
    }

    return Response.error("Không thể tải nội dung chương, vui lòng thử lại!");
}
