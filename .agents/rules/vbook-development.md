# vBook Extension Development Rules & Guidelines

## 1. Engine & Runtime Architecture
- Runtime: Rhino `1.8.1`, `languageVersion = ES6`, jsoup HTML parser.
- DO NOT use: `async/await`, `?.` optional chaining, `??` nullish coalescing, object/array spread `{...x}`, arrow functions `() => {}`, template literals `` ` ``.
- ALWAYS use: `var`, `function`, string concatenation with `+`, sequential calls, `obj && obj.prop`, `x || default`.

## 2. Cookie Management & Login Sessions
- Android's `CookieManager.setCookie(url, value)` accepts ONLY ONE cookie per call.
- NEVER pass a joined `Set-Cookie` string (which has multiple cookies separated by commas) directly to `localCookie.setCookie()`. It drops session cookies (like `quykhu_sess_v3`), causing HTTP 419 Page Expired and stalling batch downloads at 0/xx.
- ALWAYS parse individual cookies using `parseCookieMap()` and save them one by one.
- ALWAYS merge existing cookies from `localCookie.getCookie()` with newly received response cookies before calling content APIs.

## 3. Batch Download vs Single Read
- Batch download runs headless without WebView. All chapters MUST be retrieved via `fetch()` + client decryption (XOR / Base64 / AES). Do NOT depend solely on `Engine.newBrowser()`.
- Single direct read may use `Engine.newBrowser()`, but MUST use `browser.waitUrl(["ajax_endpoint"], timeout)` if the page loads text via client-side AJAX.

## 4. Packaging Specification (PKZIP)
- Android `java.util.zip.ZipFile` expects:
  - Entry #0: `plugin.json`
  - Entry #1: `icon.png` (if available)
  - `src/*.js` entries
  - Deflate compression (method 8) with `general purpose flags = 0`.
- DO NOT use Windows `tar.exe` to package extensions. Use `scratch/build_vbook_zip.mjs`.

## 5. Versioning & Conflict Management
- Every change to an extension must bump `version` in:
  1. `[extension_name]/plugin.json`
  2. Workspace root `plugin.json`
  3. `my_plugins.json`
- If an extension's domain `source` changes, users with the old extension installed in vBook must uninstall the old version from "Đã cài đặt" before installing the new one to prevent SQLite unique key conflicts.
