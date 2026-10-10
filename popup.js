const statusEl = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const logEl = document.getElementById("log");
const logWrap = document.getElementById("logWrap");
const tokenBox = document.getElementById("tokenBox");
const charList = document.getElementById("charList");
const totalDrawsEl = document.getElementById("drawsRemaining");
const autoCheckCheckbox = document.getElementById("autoCheckEnabled");
const autoCheckSettings = document.getElementById("autoCheckSettings");
const autoCheckDisclosure = document.getElementById("autoCheckDisclosure");
const autoCheckIntervalInput = document.getElementById("autoCheckIntervalMinutes");
const autoCheckSettingsStatus = document.getElementById("autoCheckSettingsStatus");
const autoReloginCheckbox = document.getElementById("autoReloginEnabled");
const autoReloginSettings = document.getElementById("autoReloginSettings");
const autoReloginDisclosure = document.getElementById("autoReloginDisclosure");
const loginSettingsStatus = document.getElementById("loginSettingsStatus");

const MALL_PATTERNS = {
    plutomall: ["plutomall.com"],
    lilithstore: ["store.lilith.com"]
};

const MALL_URLS = {
    plutomall: "https://www.plutomall.com.vn/rok/vn?tab=perks",
    lilithstore: "https://store.lilith.com/rok?tab=perks"
};

const MALL_TAB_PATTERNS = {
    plutomall: "*://www.plutomall.com.vn/*",
    lilithstore: "*://store.lilith.com/*"
};

function setStatus(text, on = false) {
    statusEl.textContent = text;
    if (statusDot) statusDot.className = "status-dot" + (on ? " on" : " off");
}

function showLog() {
    if (logWrap) logWrap.style.display = "";
    logEl.classList.add("visible");
}

function renderDrawLog(drawLog) {
    if (drawLog?.length) {
        showLog();
        logEl.textContent = drawLog.join("\n");
        logEl.scrollTop = logEl.scrollHeight;
    } else {
        logWrap.style.display = "none";
        logEl.textContent = "";
    }
}

function setCharsLoading() {
    charList.replaceChildren();
    const row = document.createElement("div");
    row.className = "char-row";
    const badge = document.createElement("span");
    badge.className = "draw-badge draw-loading";
    badge.textContent = "Loading...";
    row.appendChild(badge);
    charList.appendChild(row);
}

function setCharsEmpty(msg = "Chưa có token") {
    setCharsMessage(msg, "badge badge-warn");
}

function setCharsError(msg) {
    setCharsMessage(msg, "badge badge-error");
}

function setCharsMessage(message, className) {
    charList.replaceChildren();
    const row = document.createElement("div");
    row.className = "char-row";
    const badge = document.createElement("span");
    badge.className = className;
    badge.textContent = message;
    row.appendChild(badge);
    charList.appendChild(row);
}

function showMain() {
    const detailView = document.getElementById("detailView");
    if (detailView) detailView.remove();
    document.getElementById("main").style.display = "";
}

function syncRadio(mall) {
    const radio = document.querySelector(`input[name="store"][value="${mall}"]`);
    if (radio) radio.checked = true;
}

function getSelectedMall() {
    return document.querySelector('input[name="store"]:checked')?.value || "plutomall";
}

async function detectMall() {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const activeTab = tabs[0];
    if (activeTab?.url) {
        for (const [mall, patterns] of Object.entries(MALL_PATTERNS)) {
            if (patterns.some(p => activeTab.url.includes(p))) {
                await chrome.storage.local.set({ currentMall: mall });
                syncRadio(mall);
                return mall;
            }
        }
    }
    const { currentMall } = await chrome.storage.local.get("currentMall");
    const mall = currentMall || "plutomall";
    syncRadio(mall);
    return mall;
}

function renderChars(roles) {
    charList.replaceChildren();
    for (const role of roles) {
        const div = document.createElement("div");
        div.className = "char-row";
        const avatarWrap = document.createElement("span");
        avatarWrap.className = "char-avatar";
        const avatar = document.createElement("img");
        avatar.alt = "";
        const showFallback = () => showAvatarFallback(avatar, avatarWrap, role.name);
        avatar.addEventListener("error", showFallback);
        avatarWrap.appendChild(avatar);
        if (!setImageSource(avatar, role.avatar)) showFallback();

        const nameWrap = document.createElement("span");
        nameWrap.className = "char-name";
        const name = document.createElement("span");
        name.className = "char-history";
        name.dataset.roleId = String(role.roleId ?? "");
        name.textContent = String(role.name ?? "Không rõ tên");
        nameWrap.appendChild(name);

        const server = document.createElement("span");
        server.textContent = `#${role.svrId ?? "?"}`;
        div.append(avatarWrap, nameWrap, server);
        charList.appendChild(div);
    }
    attachHistoryListeners();
}

function renderDrawsLeft(drawsLeft) {
    if (drawsLeft !== null && drawsLeft !== undefined) {
        totalDrawsEl.textContent = `${drawsLeft} lượt còn lại`;
    }
}

async function renderCache(mall) {
    try {
        const res = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: "getCache", mall }, (r) => {
                if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
                resolve(r);
            });
        });

        if (res?.error) throw new Error(res.error);
        const { [`${mall}_drawLog`]: drawLog } =
            await chrome.storage.local.get(`${mall}_drawLog`);
        if (!res?.hasToken) {
            setStatus("Chưa có dữ liệu, hãy Capture Token");
            setCharsEmpty("Chưa có dữ liệu, hãy Capture Token");
            tokenBox.value = "";
            totalDrawsEl.textContent = "— lượt còn lại";
            renderDrawLog(drawLog);
            return;
        }

        setStatus(
            res.isValidToken === false ? "Token không hợp lệ" :
                res.isValidToken === true ? "Token OK" : "Token đã lưu",
            res.isValidToken === true
        );

        const { [`${mall}_token`]: token } = await chrome.storage.local.get(`${mall}_token`);
        if (token) tokenBox.value = token;

        renderDrawsLeft(res.drawsLeft);

        renderDrawLog(drawLog);

        if (res.roles?.length > 0) {
            renderChars(res.roles);
        } else {
            setCharsEmpty("Nhấn Làm mới để tải nhân vật");
        }
    } catch (err) {
        console.error("renderCache error:", err);
        setStatus(`Lỗi đọc dữ liệu: ${err.message}`);
        setCharsError(err.message);
    }
}

async function fetchAndRender(mall) {
    const m = mall ?? getSelectedMall();
    setStatus("Đang làm mới…");
    setCharsLoading();
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "refresh", mall: m }, (res) => {
            if (chrome.runtime.lastError) {
                setCharsError("Lỗi kết nối extension");
                return reject(new Error(chrome.runtime.lastError.message));
            }
            if (!res) {
                setCharsError("Extension không trả về dữ liệu");
                return reject(new Error("Extension không trả về dữ liệu"));
            }
            if (res?.error) {
                setStatus(res.error, false);
                setCharsError(res.error);
                return reject(new Error(res.error));
            }

            chrome.storage.local.get(`${m}_token`, (data) => {
                if (chrome.runtime.lastError) {
                    setStatus(chrome.runtime.lastError.message);
                    return;
                }
                const token = data[`${m}_token`];
                tokenBox.value = token || "";
            });

            setStatus(res.isValidToken ? "Token OK" : "Token không hợp lệ", !!res.isValidToken);
            renderDrawsLeft(res.totalDrawsLeft);

            const roles = Array.isArray(res.roles) ? res.roles : [];
            if (roles.length > 0) {
                renderChars(roles);
            } else {
                setCharsEmpty("Không tìm thấy nhân vật");
            }

            resolve(res);
        });
    });
}

function attachHistoryListeners() {
    for (const el of document.querySelectorAll(".char-history")) {
        el.addEventListener("click", () => {
            const mall = getSelectedMall();
            showHistoryLoading(el.textContent);
            chrome.runtime.sendMessage(
                { action: "getDrawHistory", roleId: el.dataset.roleId, mall },
                (res) => {
                if (chrome.runtime.lastError) {
                    showHistoryError(chrome.runtime.lastError.message);
                    return;
                }
                if (res?.error || !res?.character || !res?.history) {
                    showHistoryError(res?.error || "Phản hồi lịch sử không hợp lệ");
                    return;
                }
                showHistory(res.character, res.history);
            });
        });
    }
}

function showHistory(character, history) {
    document.getElementById("main").style.display = "none";
    const existing = document.getElementById("detailView");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "detailView";
    div.innerHTML = `
    <nav class="detail-nav">
      <button id="backBtn" class="back-btn">‹ Quay lại</button>
      <span class="detail-nav-title">Lịch sử quay</span>
    </nav>
    <div class="content">
      <div class="char-hero-card glass">
        <div class="char-hero-inner">
          <span class="hero-avatar-wrap"><img class="hero-avatar" alt=""></span>
          <div>
            <div class="hero-name"></div>
            <div class="hero-svr"></div>
          </div>
        </div>
      </div>
      <div class="history-card glass">
        <div class="history-card-head">Phần thưởng đã nhận</div>
        <div class="history-list"></div>
      </div>
    </div>`;

    const avatarWrap = div.querySelector(".hero-avatar-wrap");
    const avatar = div.querySelector(".hero-avatar");
    const showFallback = () => showAvatarFallback(avatar, avatarWrap, character?.name);
    avatar.addEventListener("error", showFallback);
    if (!setImageSource(avatar, character?.avatar)) showFallback();
    div.querySelector(".hero-name").textContent = String(character?.name ?? "Không rõ tên");
    div.querySelector(".hero-svr").textContent = `Server #${character?.svrId ?? "?"}`;

    const historyList = div.querySelector(".history-list");
    const entries = Array.isArray(history?.data?.list) ? history.data.list : [];
    if (entries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "history-empty";
        empty.textContent = "Chưa có lịch sử quay";
        historyList.appendChild(empty);
    }
    entries.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "history-row";
        const number = document.createElement("span");
        number.className = "h-idx";
        number.textContent = String(index + 1);

        const image = document.createElement("img");
        image.className = "reward-img";
        image.alt = "";
        if (/^\d+$/.test(String(item.rewardId ?? ""))) {
            image.src = `images/rewards/${item.rewardId}.png`;
        } else {
            image.style.display = "none";
        }
        image.addEventListener("error", () => { image.style.display = "none"; });

        const reward = document.createElement("span");
        reward.className = "h-reward";
        reward.textContent = `${item.rewardName ?? "—"} x${item.num || 1}`;
        row.append(number, image, reward);

        const timestamp = Number(item.timestamp);
        if (Number.isFinite(timestamp) && timestamp > 0) {
            const date = document.createElement("span");
            date.className = "h-time";
            date.textContent = new Date(timestamp * 1000).toLocaleString(
                "vi-VN",
                { dateStyle: "short", timeStyle: "short" }
            );
            row.appendChild(date);
        }
        historyList.appendChild(row);
    });

    document.getElementById("main").parentNode.insertBefore(div, document.getElementById("main").nextSibling);
    document.getElementById("backBtn").addEventListener("click", showMain);
}

function setImageSource(image, source) {
    if (typeof source !== "string") return false;
    try {
        const value = source.trim();
        if (!value) return false;
        if (/^data:image\/(?:png|jpe?g|gif|webp|avif);/i.test(value)) {
            image.src = value;
            return true;
        }
        const normalized = value.startsWith("//") ? `https:${value}` : value;
        const url = new URL(normalized);
        if (url.protocol === "https:" || url.protocol === "http:") {
            image.src = url.href;
            return true;
        }
    } catch {
        return false;
    }
    return false;
}

function showAvatarFallback(image, container, name) {
    image.remove();
    container.classList.add("avatar-fallback");
    container.textContent = getInitials(name);
}

function getInitials(name) {
    return String(name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toLocaleUpperCase())
        .join("") || "?";
}

function showHistoryLoading(name) {
    document.getElementById("main").style.display = "none";
    const existing = document.getElementById("detailView");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "detailView";
    div.innerHTML = `
    <nav class="detail-nav">
      <button id="backBtn" class="back-btn">‹ Quay lại</button>
      <span class="detail-nav-title">Lịch sử quay</span>
    </nav>
    <div class="content">
      <div class="char-hero-card glass">
        <div class="char-hero-inner">
          <div class="hero-name"></div>
        </div>
      </div>
      <div class="history-card glass">
        <div class="history-card-head">Phần thưởng đã nhận</div>
        <div class="history-list">
          <div class="history-empty history-loading">Đang tải…</div>
        </div>
      </div>
    </div>`;

    div.querySelector(".hero-name").textContent = name;
    document.getElementById("main").parentNode.insertBefore(div, document.getElementById("main").nextSibling);
    document.getElementById("backBtn").addEventListener("click", showMain);
}

function showHistoryError(message) {
    const list = document.querySelector("#detailView .history-list");
    if (!list) return;
    list.replaceChildren();
    const error = document.createElement("div");
    error.className = "history-empty history-err";
    error.textContent = `Lỗi: ${message}`;
    list.appendChild(error);
}

for (const radio of document.querySelectorAll('input[name="store"]')) {
    radio.addEventListener("change", async () => {
        const mall = radio.value;
        await chrome.storage.local.set({ currentMall: mall });
        await renderCache(mall);
    });
}

function setLoginSettingsStatus(message) {
    loginSettingsStatus.textContent = message;
}

function setAutoCheckExpanded(expanded) {
    autoCheckSettings.hidden = !expanded;
    autoCheckDisclosure.setAttribute("aria-expanded", String(expanded));
    autoCheckDisclosure.setAttribute(
        "aria-label",
        `${expanded ? "Thu nhỏ" : "Mở rộng"} cài đặt Auto kiểm tra`
    );
}

autoCheckDisclosure.addEventListener("click", () => {
    setAutoCheckExpanded(autoCheckSettings.hidden);
});

autoCheckCheckbox.addEventListener("change", async () => {
    setAutoCheckExpanded(autoCheckCheckbox.checked);
    try {
        await chrome.storage.local.set({ autoCheckEnabled: autoCheckCheckbox.checked });
        autoCheckSettingsStatus.textContent = autoCheckCheckbox.checked
            ? "Đã bật kiểm tra tự động."
            : "Đã tắt kiểm tra tự động.";
    } catch (error) {
        autoCheckCheckbox.checked = !autoCheckCheckbox.checked;
        setAutoCheckExpanded(autoCheckCheckbox.checked);
        autoCheckSettingsStatus.textContent = `Không thể cập nhật cài đặt: ${error.message}`;
    }
});

autoCheckIntervalInput.addEventListener("change", async () => {
    const intervalMinutes = Number(autoCheckIntervalInput.value);
    if (!Number.isSafeInteger(intervalMinutes) || intervalMinutes < 1) {
        autoCheckSettingsStatus.textContent = "Thời gian kiểm tra phải là số phút nguyên từ 1 trở lên.";
        return;
    }

    try {
        await chrome.storage.local.set({ autoCheckIntervalMinutes: intervalMinutes });
        autoCheckSettingsStatus.textContent = `Đã đặt thời gian kiểm tra mỗi ${intervalMinutes} phút.`;
    } catch (error) {
        autoCheckSettingsStatus.textContent = `Không thể lưu thời gian kiểm tra: ${error.message}`;
    }
});

function setAutoReloginExpanded(expanded) {
    autoReloginSettings.hidden = !expanded;
    autoReloginDisclosure.setAttribute("aria-expanded", String(expanded));
    autoReloginDisclosure.setAttribute(
        "aria-label",
        `${expanded ? "Thu nhỏ" : "Mở rộng"} cài đặt Auto đăng nhập lại`
    );
}

function selectLoginTab(mall) {
    for (const button of document.querySelectorAll("[data-login-tab]")) {
        const selected = button.dataset.loginTab === mall;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
        document.getElementById(button.getAttribute("aria-controls")).hidden = !selected;
    }
}

selectLoginTab("plutomall");

async function loadSavedLoginCredentials() {
    const credentials = await chrome.storage.local.get([
        "lilithstoreUsername",
        "lilithstorePassword",
        "plutomallUsername",
        "plutomallPassword",
    ]);
    document.getElementById("lilithUsername").value = credentials.lilithstoreUsername || "";
    document.getElementById("lilithPassword").value = credentials.lilithstorePassword || "";
    document.getElementById("plutoUsername").value = credentials.plutomallUsername || "";
    document.getElementById("plutoPassword").value = credentials.plutomallPassword || "";
    return credentials;
}

for (const button of document.querySelectorAll("[data-login-tab]")) {
    button.addEventListener("click", () => selectLoginTab(button.dataset.loginTab));
}

autoReloginDisclosure.addEventListener("click", () => {
    setAutoReloginExpanded(autoReloginSettings.hidden);
});

autoReloginCheckbox.addEventListener("change", async () => {
    setAutoReloginExpanded(autoReloginCheckbox.checked);
    try {
        const credentials = await loadSavedLoginCredentials();
        await chrome.storage.local.set({ autoReloginEnabled: autoReloginCheckbox.checked });
        if (!autoReloginCheckbox.checked) {
            setLoginSettingsStatus("Đã tắt tự đăng nhập. Thông tin đã lưu được giữ nguyên.");
        } else {
            const mall = document.querySelector(".login-tab.active")?.dataset.loginTab || "lilithstore";
            const hasCredentials = Boolean(
                credentials[`${mall}Username`] && credentials[`${mall}Password`]
            );
            const storeName = mall === "lilithstore" ? "Lilith Store" : "Plutomall";
            setLoginSettingsStatus(
                hasCredentials
                    ? `Đã bật tự đăng nhập ${storeName} bằng thông tin đã lưu.`
                    : `Chưa có thông tin ${storeName} đã lưu. Nhập tài khoản, mật khẩu rồi bấm Lưu thông tin.`
            );
        }
    } catch (error) {
        autoReloginCheckbox.checked = !autoReloginCheckbox.checked;
        setAutoReloginExpanded(autoReloginCheckbox.checked);
        setLoginSettingsStatus(`Không thể cập nhật cài đặt: ${error.message}`);
    }
});

document.getElementById("saveLoginBtn").addEventListener("click", async () => {
    const lilithUsername = document.getElementById("lilithUsername").value.trim();
    const lilithPassword = document.getElementById("lilithPassword").value;
    try {
        await chrome.storage.local.set({
            autoReloginEnabled: autoReloginCheckbox.checked,
            lilithstoreUsername: lilithUsername,
            lilithstorePassword: lilithPassword,
            plutomallUsername: document.getElementById("plutoUsername").value.trim(),
            plutomallPassword: document.getElementById("plutoPassword").value,
        });
        setLoginSettingsStatus(
            autoReloginCheckbox.checked
                ? "Đã lưu. Tự đăng nhập sẽ dùng thông tin riêng của từng cửa hàng khi token hết hạn."
                : "Đã lưu thông tin."
        );
    } catch (error) {
        setLoginSettingsStatus(`Không thể lưu: ${error.message}`);
    }
});

document.getElementById("clearLoginBtn").addEventListener("click", async () => {
    try {
        autoReloginCheckbox.checked = false;
        setAutoReloginExpanded(false);
        await chrome.storage.local.set({ autoReloginEnabled: false });
        await chrome.storage.local.remove([
            "lilithstoreUsername",
            "lilithstorePassword",
            "plutomallUsername",
            "plutomallPassword",
        ]);
        await loadSavedLoginCredentials();
        setLoginSettingsStatus("Đã xóa toàn bộ thông tin đăng nhập đã lưu.");
    } catch (error) {
        try {
            const { autoReloginEnabled } = await chrome.storage.local.get("autoReloginEnabled");
            autoReloginCheckbox.checked = autoReloginEnabled === true;
            setAutoReloginExpanded(autoReloginCheckbox.checked);
        } catch (stateError) {
            console.error("Could not restore auto-relogin setting:", stateError);
        }
        setLoginSettingsStatus(`Không thể xóa thông tin: ${error.message}`);
    }
});

function testRelogin(mall) {
    const storeName = mall === "lilithstore" ? "Lilith Store" : "Plutomall";
    setLoginSettingsStatus(`Đang kiểm tra và mở tab đăng nhập ${storeName}…`);
    chrome.runtime.sendMessage({ action: "testRelogin", mall }, response => {
        if (chrome.runtime.lastError) {
            setLoginSettingsStatus(`Không gửi được yêu cầu: ${chrome.runtime.lastError.message}`);
        } else if (response?.error) {
            setLoginSettingsStatus(`Kiểm tra thất bại: ${response.error}`);
        } else if (response?.ok) {
            setLoginSettingsStatus(`Đã mở tab nền ${storeName}. Theo dõi trạng thái để kiểm tra flow đăng nhập.`);
        } else {
            chrome.storage.local.get("autoReloginStatus", state => {
                if (chrome.runtime.lastError) {
                    setLoginSettingsStatus(`Không thể khởi chạy đăng nhập: ${chrome.runtime.lastError.message}`);
                } else {
                    setLoginSettingsStatus(
                        state.autoReloginStatus ||
                        "Không thể khởi chạy đăng nhập. Kiểm tra cài đặt và thông tin tài khoản."
                    );
                }
            });
        }
    });
}

document.getElementById("testLilithReloginBtn").addEventListener("click", () => {
    testRelogin("lilithstore");
});

document.getElementById("testPlutoReloginBtn").addEventListener("click", () => {
    testRelogin("plutomall");
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.autoReloginStatus?.newValue) {
        setLoginSettingsStatus(changes.autoReloginStatus.newValue);
    }
    const mall = getSelectedMall();
    if (changes[`${mall}_drawLog`]) {
        renderDrawLog(changes[`${mall}_drawLog`].newValue);
    }
    if (
        changes[`${mall}_token`] ||
        changes[`${mall}_roles`] ||
        changes[`${mall}_drawsLeft`]
    ) {
        renderCache(mall);
    }
});

document.getElementById("captureBtn").addEventListener("click", async () => {
    const mall = getSelectedMall();
    try {
        const [tab] = await chrome.tabs.query({ url: MALL_TAB_PATTERNS[mall] });
        if (tab?.id !== undefined) {
            await chrome.tabs.update(tab.id, { active: true, url: MALL_URLS[mall] });
        } else {
            await chrome.tabs.create({ url: MALL_URLS[mall], active: true });
        }
        setStatus("Đã mở cửa hàng; token sẽ được lưu tự động");
    } catch (error) {
        setStatus(`Không thể mở cửa hàng: ${error.message}`);
    }
});

document.getElementById("refreshCharsBtn").addEventListener("click", () => {
    fetchAndRender(getSelectedMall()).catch(() => {});
});

document.getElementById("drawNowBtn").addEventListener("click", () => {
    const mall = getSelectedMall();
    const btn = document.getElementById("drawNowBtn");
    btn.disabled = true;
    btn.textContent = "Đang quay…";
    showLog();
    logEl.textContent = "Bắt đầu quay thưởng...";

    chrome.runtime.sendMessage({ action: "drawNow", mall }, (res) => {
        if (chrome.runtime.lastError) {
            setStatus(chrome.runtime.lastError.message);
            btn.disabled = false;
            btn.textContent = "✦ Quay thưởng ngay";
            return;
        }
        if (res?.error) {
            setStatus(res.error);
            btn.disabled = false;
            btn.textContent = "✦ Quay thưởng ngay";
            return;
        }

        const pollStartedAt = Date.now();
        const poll = setInterval(async () => {
            if (Date.now() - pollStartedAt >= 290000) {
                clearInterval(poll);
                setStatus("Lượt quay không phản hồi; hãy làm mới trạng thái trước khi chạy lại");
                btn.disabled = false;
                btn.textContent = "✦ Quay thưởng ngay";
                return;
            }
            let data;
            try {
                data = await chrome.storage.local.get(`${mall}_drawLog`);
            } catch (error) {
                clearInterval(poll);
                setStatus(`Không đọc được nhật ký: ${error.message}`);
                btn.disabled = false;
                btn.textContent = "✦ Quay thưởng ngay";
                return;
            }
            const drawLog = data[`${mall}_drawLog`];
            if (drawLog?.length > 0) {
                logEl.textContent = drawLog.join("\n");
                logEl.scrollTop = logEl.scrollHeight;
                const lastLine = drawLog[drawLog.length - 1];
                if (
                    lastLine === "Done!" ||
                    lastLine.startsWith("Lỗi") ||
                    lastLine.startsWith("Đã tạm dừng") ||
                    lastLine.includes("Không còn")
                ) {
                    clearInterval(poll);
                    btn.disabled = false;
                    btn.textContent = "✦ Quay thưởng ngay";
                    fetchAndRender(mall).catch(() => {});
                }
            }
        }, 1000);
    });
});

(async () => {
    try {
        const settings = await chrome.storage.local.get([
            "autoCheckEnabled",
            "autoCheckIntervalMinutes",
            "autoReloginEnabled",
            "lilithstoreUsername",
            "lilithstorePassword",
            "plutomallUsername",
            "plutomallPassword",
            "autoReloginStatus",
        ]);
        autoCheckCheckbox.checked = settings.autoCheckEnabled !== false;
        autoCheckIntervalInput.value = Number.isSafeInteger(settings.autoCheckIntervalMinutes) &&
            settings.autoCheckIntervalMinutes >= 1
            ? String(settings.autoCheckIntervalMinutes)
            : "60";
        setAutoCheckExpanded(!autoCheckCheckbox.checked);
        autoReloginCheckbox.checked = settings.autoReloginEnabled === true;
        setAutoReloginExpanded(!autoReloginCheckbox.checked);
        if (settings.autoReloginStatus) setLoginSettingsStatus(settings.autoReloginStatus);
        await loadSavedLoginCredentials();

        const mall = await detectMall();
        await renderCache(mall);
    } catch (error) {
        setStatus(`Không thể khởi tạo popup: ${error.message}`);
        setCharsError(error.message);
    }
})();