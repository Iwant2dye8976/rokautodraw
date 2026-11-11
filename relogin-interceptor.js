// Runs in MAIN world (page context) at document_start.
// Intercepts fetch and XMLHttpRequest responses from passport login endpoints
// and posts the parsed result to the isolated content script via window.postMessage.

(function () {
    if (window.__rokPassportInterceptorLoaded) return;
    window.__rokPassportInterceptorLoaded = true;

    const TARGET_ENDPOINTS = [
        "/passport-login/",
        "/login",
        "/auth",
    ];

    function isTargetUrl(url) {
        if (!url || typeof url !== "string") return false;
        return TARGET_ENDPOINTS.some(endpoint => url.includes(endpoint));
    }

    function dispatchResult(url, status, data) {
        try {
            window.postMessage({
                type: "ROK_PASSPORT_API_RESPONSE",
                url,
                status,
                data,
            }, "*");
        } catch {}
    }

    // Intercept window.fetch
    if (typeof window.fetch === "function") {
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const response = await originalFetch.apply(this, args);
            try {
                const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
                if (isTargetUrl(url)) {
                    const clone = response.clone();
                    clone.json().then(data => {
                        dispatchResult(url, response.status, data);
                    }).catch(() => {});
                }
            } catch {}
            return response;
        };
    }

    // Intercept XMLHttpRequest
    if (typeof XMLHttpRequest !== "undefined") {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            this._rokUrl = String(url || "");
            return originalOpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function (...args) {
            this.addEventListener("load", function () {
                try {
                    if (isTargetUrl(this._rokUrl)) {
                        let data = null;
                        try {
                            data = JSON.parse(this.responseText);
                        } catch {}
                        if (data && typeof data === "object") {
                            dispatchResult(this._rokUrl, this.status, data);
                        }
                    }
                } catch {}
            });
            return originalSend.apply(this, args);
        };
    }
})();
