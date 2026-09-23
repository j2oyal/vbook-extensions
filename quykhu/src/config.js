let BASE_URL = "https://quykhu.com";
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

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
