var BASE_URL = "https://truyenfull.live";
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}

var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function parseCookieMap(str) {
    var map = {};
    if (!str) return map;
    var reserved = /^(?:expires|max-age|path|domain|samesite|secure|httponly|priority)$/i;
    var parts = str.split(/[,;]\s*(?=[a-zA-Z0-9_\-]+=[^;]+)/g);
    for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split(';')[0].trim();
        var eq = pair.indexOf('=');
        if (eq > 0) {
            var k = pair.substring(0, eq).trim();
            var v = pair.substring(eq + 1).trim();
            if (!reserved.test(k) && !/^(?:mon|tue|wed|thu|fri|sat|sun)\b/i.test(k)) {
                map[k] = v;
            }
        }
    }
    return map;
}

function getCookie() {
    try {
        if (typeof localCookie !== "undefined") {
            return localCookie.getCookie() || "";
        }
    } catch (e) {}
    return "";
}

function saveCookie(cookieStr) {
    try {
        if (cookieStr && typeof localCookie !== "undefined") {
            var map = parseCookieMap(cookieStr);
            for (var k in map) {
                if (map.hasOwnProperty(k)) {
                    try {
                        localCookie.setCookie(k + "=" + map[k] + "; path=/; domain=.truyenfull.live");
                    } catch (err) {}
                }
            }
        }
    } catch (e) {}
}