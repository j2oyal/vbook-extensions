var BASE_URL = "https://truyenfull.live";
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}

var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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