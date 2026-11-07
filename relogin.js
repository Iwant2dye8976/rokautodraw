const PASSWORD_TAB_SELECTORS = [
    "#rc-tabs-0-tab-P",
    '[id$="-tab-P"]',
];
const PASSWORD_INPUT_SELECTOR = "#plogin_password";
const STORE_CONFIG = {
    lilithstore: {
        passportOrigin: "https://passport-global.lilith.com",
        storeOrigin: "https://store.lilith.com",
        storePath: "/rok",
    },
    plutomall: {
        passportOrigin: "https://passport.pup.vn",
        storeOrigin: "https://www.plutomall.com.vn",
        storePath: "/rok/vn",
    },
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkAndSkipTour() {
    const skipTourBtn = document.querySelector("#skipTourBtn");
    if (skipTourBtn) {
        try {
            skipTourBtn.click();
            console.log("[LilithDraw] Clicked #skipTourBtn");
        } catch (e) {
            console.warn("[LilithDraw] Failed to click #skipTourBtn:", e);
        }
        return true;
    }
    return false;
}

function findPasswordTab() {
    checkAndSkipTour();
    for (const selector of PASSWORD_TAB_SELECTORS) {
        const tab = document.querySelector(selector);
        if (tab) return tab;
    }
    return [...document.querySelectorAll('[role="tab"], [id*="-tab-"]')]
        .find(tab => /mật khẩu|password/i.test(tab.textContent || "")) || null;
}

function waitForElement(selectorOrFinder, timeoutMs = 20000) {
    const findElement = typeof selectorOrFinder === "function"
        ? selectorOrFinder
        : () => document.querySelector(selectorOrFinder);

    return new Promise(resolve => {
        let settled = false;
        const observer = new MutationObserver(check);
        const timeout = setTimeout(() => finish(null), timeoutMs);

        function finish(element) {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            observer.disconnect();
            resolve(element);
        }

        function check() {
            const element = findElement();
            if (element) finish(element);
        }

        check();
        if (!settled) {
            observer.observe(document, {
                childList: true,
                subtree: true,
                attributes: true,
            });
        }
    });
}

function findPasswordPanel() {
    const passwordInput = document.querySelector(PASSWORD_INPUT_SELECTOR);
    return passwordInput?.closest('[role="tabpanel"]') || null;
}

function setInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
    )?.set;
    if (!setter) throw new Error("Could not set login credentials");
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function waitForStoreRedirectOrError(mall, passwordPanel, timeoutMs = 20000) {
    const config = STORE_CONFIG[mall];
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (
            location.origin === config.storeOrigin &&
            location.pathname.startsWith(config.storePath)
        ) return { redirected: true };

        const errorEl = passwordPanel?.querySelector(
            '[role="alert"], .ant-form-item-explain-error, .ant-message-error'
        );
        const errorText = errorEl?.textContent?.trim();
        if (errorText) {
            return { redirected: false, error: errorText };
        }

        await delay(300);
    }
    return {
        redirected: false,
        error: `Passport did not redirect to ${mall === "lilithstore" ? "Lilith Store" : "Plutomall"} after submitting login.`
    };
}

function reportFinished(success, error) {
    chrome.runtime.sendMessage(
        { action: "reloginFinished", success, error },
        () => {
            if (chrome.runtime.lastError) {
                console.error("[LilithDraw] Could not report relogin result:", chrome.runtime.lastError.message);
            }
        }
    );
}

(async () => {
    if (checkAndSkipTour()) {
        await delay(300);
    }

    let mall;
    try {
        const credentials = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: "getReloginCredentials" },
                response => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (response?.error === "Không có phiên tự đăng nhập hợp lệ" || response?.error === "No valid auto-relogin session") {
                        resolve(null);
                    } else if (response?.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response);
                    }
                }
            );
        });

        if (!credentials) return;
        mall = credentials.mall;
        const config = STORE_CONFIG[mall];
        if (!config || location.origin !== config.passportOrigin) {
            throw new Error("Login page does not match store being processed.");
        }
        if (!credentials.username || !credentials.password) {
            throw new Error(`Missing username or password for ${mall === "lilithstore" ? "Lilith Store" : "Plutomall"}`);
        }

        const passwordTab = await waitForElement(findPasswordTab);
        if (!passwordTab) throw new Error("Could not find password login tab on passport.");
        checkAndSkipTour();
        passwordTab.click();

        const passwordPanel = await waitForElement(findPasswordPanel);
        if (!passwordPanel) throw new Error("Password tab selected but form did not appear.");
        const username = await waitForElement(() =>
            passwordPanel.querySelector('#plogin_username') ||
            passwordPanel.querySelector('#plogin_account') ||
            passwordPanel.querySelector('input[name="username"]') ||
            passwordPanel.querySelector('input[name="account"]') ||
            passwordPanel.querySelector('input[autocomplete="username"]') ||
            passwordPanel.querySelector('input[placeholder*="địa chỉ e-mail" i]') ||
            passwordPanel.querySelector('input[placeholder*="email" i]') ||
            passwordPanel.querySelector('input[placeholder*="tài khoản" i]') ||
            passwordPanel.querySelector('input[type="email"]') ||
            passwordPanel.querySelector('input[type="text"]')
        );
        const password = passwordPanel.querySelector(PASSWORD_INPUT_SELECTOR);
        if (!username || !password) throw new Error("Could not find email or password input on passport.");

        const termsCheckbox = passwordPanel.querySelector('input[type="checkbox"]');
        if (!termsCheckbox) throw new Error("Could not find terms agreement checkbox.");
        if (!termsCheckbox.checked) {
            const termsLabel = termsCheckbox.closest("label");
            if (!termsLabel) throw new Error("Could not find terms agreement checkbox label.");
            termsLabel.click();
        }

        setInputValue(username, credentials.username);
        setInputValue(password, credentials.password);

        const submit = passwordPanel.querySelector('button[type="submit"]');
        if (!submit) throw new Error("Could not find submit button in password tab.");
        await delay(600);
        submit.click();
        const outcome = await waitForStoreRedirectOrError(mall, passwordPanel);
        if (!outcome.redirected) {
            reportFinished(false, outcome.error);
        }
    } catch (error) {
        console.error("[LilithDraw] Store auto-login failed:", error);
        if (mall) reportFinished(false, error.message);
    }
})();
