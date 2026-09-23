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
            localCookie.setCookie(cookieStr);
        }
    } catch (e) {}
}
