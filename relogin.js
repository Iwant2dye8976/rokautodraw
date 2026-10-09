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

function findPasswordTab() {
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
    if (!setter) throw new Error("Không thể điền thông tin đăng nhập");
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function waitForStoreRedirect(mall, timeoutMs = 45000) {
    const config = STORE_CONFIG[mall];
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (
            location.origin === config.storeOrigin &&
            location.pathname.startsWith(config.storePath)
        ) return true;
        await delay(300);
    }
    return false;
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
    let mall;
    try {
        const credentials = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: "getReloginCredentials" },
                response => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (response?.error === "Không có phiên tự đăng nhập hợp lệ") {
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
            throw new Error("Trang đăng nhập không khớp với cửa hàng đang xử lý.");
        }
        if (!credentials.username || !credentials.password) {
            throw new Error(`Thiếu tài khoản hoặc mật khẩu ${mall === "lilithstore" ? "Lilith Store" : "Plutomall"}`);
        }

        const passwordTab = await waitForElement(findPasswordTab);
        if (!passwordTab) throw new Error("Không tìm thấy tab đăng nhập bằng mật khẩu trên passport.");
        passwordTab.click();

        const passwordPanel = await waitForElement(findPasswordPanel);
        if (!passwordPanel) throw new Error("Tab mật khẩu đã chọn nhưng form chưa xuất hiện.");
        const username = await waitForElement(() =>
            passwordPanel.querySelector('[id="1791530682711"]') ||
            passwordPanel.querySelector('input[placeholder*="địa chỉ e-mail" i]') ||
            passwordPanel.querySelector('input[type="text"]')
        );
        const password = passwordPanel.querySelector(PASSWORD_INPUT_SELECTOR);
        if (!username || !password) throw new Error("Không tìm thấy ô email hoặc mật khẩu trên passport.");

        const termsCheckbox = passwordPanel.querySelector('input[type="checkbox"]');
        if (!termsCheckbox) throw new Error("Không tìm thấy ô đồng ý điều khoản.");
        if (!termsCheckbox.checked) {
            const termsLabel = termsCheckbox.closest("label");
            if (!termsLabel) throw new Error("Không tìm thấy nhãn ô đồng ý điều khoản.");
            termsLabel.click();
        }

        setInputValue(username, credentials.username);
        setInputValue(password, credentials.password);

        const submit = passwordPanel.querySelector('button[type="submit"]');
        if (!submit) throw new Error("Không tìm thấy nút đăng nhập trong tab mật khẩu.");
        await delay(600);
        submit.click();
        if (!await waitForStoreRedirect(mall)) {
            const errorText = passwordPanel.querySelector(
                '[role="alert"], .ant-form-item-explain-error, .ant-message-error'
            )?.textContent?.trim();
            reportFinished(
                false,
                errorText || `Passport chưa chuyển về ${mall === "lilithstore" ? "Lilith Store" : "Plutomall"} sau khi gửi đăng nhập.`
            );
        }
    } catch (error) {
        console.error("[LilithDraw] Store auto-login failed:", error);
        if (mall) reportFinished(false, error.message);
    }
})();
