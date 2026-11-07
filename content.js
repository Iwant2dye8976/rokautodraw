(async () => {
    function waitForElement(selector, timeoutMs = 5000) {
        return new Promise(resolve => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            let settled = false;
            const observer = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found && !settled) {
                    settled = true;
                    observer.disconnect();
                    resolve(found);
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(() => {
                if (!settled) {
                    settled = true;
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            }, timeoutMs);
        });
    }

    const csrfInput = await waitForElement("input#_csrf");
    const surveyCsrf = csrfInput?.value;
    if (!surveyCsrf) {
        console.warn("[LilithDraw] Could not find CSRF token for survey");
        return;
    }
    const params = Object.fromEntries(new URL(location.href).searchParams.entries());
    chrome.runtime.sendMessage(
        { type: "surveyCsrf", csrf: surveyCsrf, params },
        response => {
            if (chrome.runtime.lastError) {
                console.error("[LilithDraw] Could not send survey request:", chrome.runtime.lastError.message);
            } else if (response?.error) {
                console.error("[LilithDraw] Survey submission failed:", response.error);
            }
        }
    );
})();