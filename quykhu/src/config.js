var BASE_URL = "https://quykhu.com";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

function normalizeUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === -1) {
        return BASE_URL + (url.startsWith("/") ? url : "/" + url);
    }
    return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

var USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

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
                        localCookie.setCookie(k + "=" + map[k] + "; path=/; domain=.quykhu.com");
                    } catch (err) {}
                }
            }
        }
    } catch (e) {}
}

function getCombinedCookieHeader(responseSetCookie) {
    var existingStr = getCookie();
    var map = parseCookieMap(existingStr);
    if (responseSetCookie) {
        var newMap = parseCookieMap(responseSetCookie);
        for (var k in newMap) {
            if (newMap.hasOwnProperty(k)) {
                map[k] = newMap[k];
            }
        }
    }
    var arr = [];
    for (var key in map) {
        if (map.hasOwnProperty(key)) {
            arr.push(key + "=" + map[key]);
        }
    }
    return arr.join("; ");
}
