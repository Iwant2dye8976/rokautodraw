const statusEl = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const utcClockEl = document.getElementById("utcClock");
const logEl = document.getElementById("log");
const logWrap = document.getElementById("logWrap");
const tokenBox = document.getElementById("tokenBox");
const tokenCopyStatus = document.getElementById("tokenCopyStatus");
const charList = document.getElementById("charList");
const totalDrawsEl = document.getElementById("drawsRemaining");
const autoCheckCheckbox = document.getElementById("autoCheckEnabled");
const autoCheckIntervalInput = document.getElementById("autoCheckIntervalMinutes");
const autoCheckSettingsStatus = document.getElementById("autoCheckSettingsStatus");
const autoReloginCheckbox = document.getElementById("autoReloginEnabled");
const loginSettingsStatus = document.getElementById("loginSettingsStatus");
const configSettingsStatus = document.getElementById("configSettingsStatus");
const importConfigFile = document.getElementById("importConfigFile");
const additionalSettingsDisclosure = document.getElementById("additionalSettingsDisclosure");
const additionalSettingsBody = document.getElementById("additionalSettingsBody");
const CONFIG_FORMAT = "rok-weekly-auto-config";
const CONFIG_VERSION = 1;
const CONFIG_SETTING_VALIDATORS = {
    autoReloginEnabled: value => typeof value === "boolean",
    autoCheckIntervalMinutes: value => Number.isSafeInteger(value) && value >= 1,
    autoCheckEnabled: value => typeof value === "boolean",
    storeAccounts: value => value && typeof value === "object" &&
        !Array.isArray(value) && ["plutomall", "lilithstore"].every(mall =>
            Array.isArray(value[mall]) &&
            value[mall].every(account =>
                account && typeof account.id === "string" &&
                /^[A-Za-z0-9-]+$/.test(account.id) &&
                typeof account.username === "string" && typeof account.password === "string"
            ) &&
            new Set(value[mall].map(account => account?.id)).size === value[mall].length
        ),
    favoriteRoleIds: value => value && typeof value === "object" &&
        !Array.isArray(value) && ["plutomall", "lilithstore"].every(mall =>
            value[mall] && typeof value[mall] === "object" &&
            !Array.isArray(value[mall]) &&
            Object.entries(value[mall]).every(([accountId, roleIds]) =>
                (!accountId || /^[A-Za-z0-9-]+$/.test(accountId)) &&
                Array.isArray(roleIds) && roleIds.every(roleId => typeof roleId === "string")
            )
        ),
    tokens: value => value && typeof value === "object" &&
        !Array.isArray(value) && ["plutomall", "lilithstore"].every(mall =>
            value[mall] && typeof value[mall] === "object" &&
            !Array.isArray(value[mall]) &&
            Object.entries(value[mall]).every(([accountId, token]) =>
                (!accountId || /^[A-Za-z0-9-]+$/.test(accountId)) &&
                typeof token === "string"
            )
        ),
    plutomallUsername: value => typeof value === "string",
    plutomallPassword: value => typeof value === "string",
    lilithstoreUsername: value => typeof value === "string",
    lilithstorePassword: value => typeof value === "string",
};
const utcClockFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
});

function updateUtcClock() {
    utcClockEl.textContent = `UTC ${utcClockFormatter.format(new Date())}-${new Date().toLocaleDateString()}`;
}

function showAccountViewLoading() {
    accountViewVersion++;
    setStatus("Đang tải dữ liệu…");
    setCharsLoading();
    tokenBox.value = "";
    totalDrawsEl.textContent = "— lượt còn lại";
    renderDrawLog([]);
}

updateUtcClock();
setInterval(updateUtcClock, 1000);

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

let charRenderVersion = 0;
let accountViewVersion = 0;
let accountPickerVersion = 0;
let accountsByMall = { plutomall: [], lilithstore: [] };
const activeAccountSelect = document.getElementById("activeAccountSelect");

function getSelectedAccountId() {
    return activeAccountSelect?.value || "";
}

function accountStorageKey(mall, accountId, name) {
    return accountId ? `${mall}_account_${accountId}_${name}` : `${mall}_${name}`;
}

function isCurrentAccountView(mall, accountId, viewVersion) {
    return viewVersion === accountViewVersion &&
        mall === getSelectedMall() &&
        accountId === getSelectedAccountId();
}

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
    charRenderVersion++;
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
    charRenderVersion++;
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

async function renderChars(roles, mall, accountId = getSelectedAccountId(), viewVersion = accountViewVersion) {
    const renderVersion = ++charRenderVersion;
    const favoritesKey = accountStorageKey(mall, accountId, "favoriteRoleIds");
    let favoriteOrder;
    try {
        const savedFavorites = await chrome.storage.local.get(favoritesKey);
        if (
            renderVersion !== charRenderVersion ||
            !isCurrentAccountView(mall, accountId, viewVersion)
        ) return;
        favoriteOrder = Array.isArray(savedFavorites[favoritesKey])
            ? savedFavorites[favoritesKey].map(String)
            : [];
    } catch (error) {
        if (
            renderVersion !== charRenderVersion ||
            !isCurrentAccountView(mall, accountId, viewVersion)
        ) return;
        console.error("Could not load favorite characters:", error);
        setCharsError(`Không thể tải nhân vật yêu thích: ${error.message}`);
        return;
    }

    charList.replaceChildren();
    const favoritePositions = new Map(favoriteOrder.map((roleId, index) => [roleId, index]));
    const sortedRoles = [
        ...roles
            .filter(role => favoritePositions.has(String(role.roleId ?? "")))
            .sort((a, b) =>
                favoritePositions.get(String(a.roleId ?? "")) -
                favoritePositions.get(String(b.roleId ?? ""))
            ),
        ...roles.filter(role => !favoritePositions.has(String(role.roleId ?? "")))
    ];
    for (const role of sortedRoles) {
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
        const roleId = String(role.roleId ?? "");
        const roleName = String(role.name ?? "Không rõ tên");
        const name = document.createElement("span");
        name.className = "char-history";
        name.dataset.roleId = roleId;
        name.textContent = roleName;
        nameWrap.appendChild(name);

        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.className = "char-favorite-btn";
        const isFavorite = favoritePositions.has(roleId);
        favoriteButton.textContent = isFavorite ? "★" : "☆";
        favoriteButton.title = isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích";
        favoriteButton.setAttribute("aria-label", favoriteButton.title);
        favoriteButton.setAttribute("aria-pressed", String(isFavorite));
        if (isFavorite) favoriteButton.classList.add("is-favorite");
        favoriteButton.addEventListener("click", async () => {
            try {
                const savedFavorites = await chrome.storage.local.get(favoritesKey);
                const updatedFavorites = new Set(
                    Array.isArray(savedFavorites[favoritesKey])
                        ? savedFavorites[favoritesKey].map(String)
                        : []
                );
                if (updatedFavorites.has(roleId)) {
                    updatedFavorites.delete(roleId);
                } else {
                    updatedFavorites.add(roleId);
                }
                await chrome.storage.local.set({
                    [favoritesKey]: [...updatedFavorites]
                });
                await renderChars(roles, mall, accountId);
            } catch (error) {
                console.error("Could not update favorite character:", error);
                setStatus(`Không thể cập nhật yêu thích: ${error.message}`);
            }
        });

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "char-copy-btn";
        copyButton.textContent = "⧉";
        copyButton.title = "Sao chép ID và tên nhân vật";
        copyButton.setAttribute("aria-label", "Sao chép ID và tên nhân vật");
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(`ID: ${roleId} - ${roleName}`);
                copyButton.textContent = "✓";
                copyButton.title = "Đã sao chép";
                copyButton.setAttribute("aria-label", "Đã sao chép thông tin nhân vật");
            } catch (error) {
                console.error("Không thể sao chép thông tin nhân vật:", error);
                copyButton.textContent = "!";
                copyButton.title = "Không thể sao chép thông tin nhân vật";
                copyButton.setAttribute("aria-label", "Không thể sao chép thông tin nhân vật");
            }
            window.setTimeout(() => {
                copyButton.textContent = "⧉";
                copyButton.title = "Sao chép ID và tên nhân vật";
                copyButton.setAttribute("aria-label", "Sao chép ID và tên nhân vật");
            }, 1500);
        });

        const server = document.createElement("span");
        server.textContent = `#${role.svrId ?? "?"}`;
        div.append(avatarWrap, nameWrap, favoriteButton, copyButton, server);
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
    const accountId = getSelectedAccountId();
    const viewVersion = ++accountViewVersion;
    try {
        const res = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: "getCache", mall, accountId }, (r) => {
                if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
                resolve(r);
            });
        });

        if (!isCurrentAccountView(mall, accountId, viewVersion)) return;
        if (res?.error) throw new Error(res.error);
        const drawLogKey = accountStorageKey(mall, accountId, "drawLog");
        const { [drawLogKey]: drawLog } = await chrome.storage.local.get(drawLogKey);
        if (!isCurrentAccountView(mall, accountId, viewVersion)) return;
        if (!res?.hasToken) {
            setStatus("Chưa có dữ liệu, hãy Capture Token");
            setCharsEmpty("Chưa có dữ liệu, hãy Capture Token");
            tokenBox.value = "";
            totalDrawsEl.textContent = "— lượt còn lại";
            renderDrawLog(drawLog);
            return;
        }

        const tokenKey = accountStorageKey(mall, accountId, "token");
        const { [tokenKey]: token } = await chrome.storage.local.get(tokenKey);
        if (!isCurrentAccountView(mall, accountId, viewVersion)) return;

        setStatus(
            res.isValidToken === false ? "Token không hợp lệ" :
                res.isValidToken === true ? "Token OK" : "Token đã lưu",
            res.isValidToken === true
        );
        tokenBox.value = token || "";

        renderDrawsLeft(res.drawsLeft);

        renderDrawLog(drawLog);

        if (res.roles?.length > 0) {
            renderChars(res.roles, mall, accountId, viewVersion);
        } else {
            setCharsEmpty("Nhấn Làm mới để tải nhân vật");
        }
    } catch (err) {
        if (!isCurrentAccountView(mall, accountId, viewVersion)) return;
        console.error("renderCache error:", err);
        setStatus(`Lỗi đọc dữ liệu: ${err.message}`);
        setCharsError(err.message);
    }
}

async function fetchAndRender(mall) {
    const m = mall ?? getSelectedMall();
    const accountId = getSelectedAccountId();
    const viewVersion = ++accountViewVersion;
    setStatus("Đang làm mới…");
    setCharsLoading();
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "refresh", mall: m, accountId }, async (res) => {
            if (!isCurrentAccountView(m, accountId, viewVersion)) {
                resolve(null);
                return;
            }
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

            const tokenKey = accountStorageKey(m, accountId, "token");
            try {
                const data = await chrome.storage.local.get(tokenKey);
                if (!isCurrentAccountView(m, accountId, viewVersion)) {
                    resolve(null);
                    return;
                }
                tokenBox.value = data[tokenKey] || "";
            } catch (error) {
                if (!isCurrentAccountView(m, accountId, viewVersion)) {
                    resolve(null);
                    return;
                }
                setStatus(`Không thể tải token: ${error.message}`);
                reject(error);
                return;
            }

            setStatus(res.isValidToken ? "Token OK" : "Token không hợp lệ", !!res.isValidToken);
            renderDrawsLeft(res.totalDrawsLeft);

            const roles = Array.isArray(res.roles) ? res.roles : [];
            if (roles.length > 0) {
                renderChars(roles, m, accountId, viewVersion);
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
                {
                    action: "getDrawHistory",
                    roleId: el.dataset.roleId,
                    mall,
                    accountId: getSelectedAccountId(),
                },
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
        showAccountViewLoading();
        await chrome.storage.local.set({ currentMall: mall });
        await renderActiveAccountPicker(mall);
        if (mall !== getSelectedMall()) return;
        await renderCache(mall);
    });
}

function setLoginSettingsStatus(message) {
    loginSettingsStatus.textContent = message;
}

additionalSettingsDisclosure.addEventListener("click", () => {
    const expanded = additionalSettingsDisclosure.getAttribute("aria-expanded") !== "true";
    additionalSettingsBody.hidden = !expanded;
    additionalSettingsDisclosure.setAttribute("aria-expanded", String(expanded));
    additionalSettingsDisclosure.setAttribute(
        "aria-label",
        `${expanded ? "Thu nhỏ" : "Mở rộng"} Cài đặt thêm`
    );
});

const copyTokenButton = document.getElementById("copyTokenBtn");
copyTokenButton.addEventListener("click", async () => {
    const token = tokenBox.value.trim();
    if (!token) {
        tokenCopyStatus.textContent = "Chưa có token để sao chép.";
        return;
    }

    try {
        await navigator.clipboard.writeText(token);
        copyTokenButton.textContent = "✓";
        copyTokenButton.title = "Đã sao chép";
        copyTokenButton.setAttribute("aria-label", "Đã sao chép token");
        tokenCopyStatus.textContent = "Đã sao chép token.";
    } catch (error) {
        console.error("Không thể sao chép token:", error);
        copyTokenButton.textContent = "!";
        copyTokenButton.title = "Không thể sao chép token";
        copyTokenButton.setAttribute("aria-label", "Không thể sao chép token");
        tokenCopyStatus.textContent = `Không thể sao chép token: ${error.message}`;
    }
    window.setTimeout(() => {
        copyTokenButton.textContent = "⧉";
        copyTokenButton.title = "Sao chép token";
        copyTokenButton.setAttribute("aria-label", "Sao chép token");
    }, 1500);
});

autoCheckCheckbox.addEventListener("change", async () => {
    try {
        await chrome.storage.local.set({ autoCheckEnabled: autoCheckCheckbox.checked });
        autoCheckSettingsStatus.textContent = autoCheckCheckbox.checked
            ? "Đã bật kiểm tra tự động."
            : "Đã tắt kiểm tra tự động.";
    } catch (error) {
        autoCheckCheckbox.checked = !autoCheckCheckbox.checked;
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

function selectLoginTab(mall) {
    for (const button of document.querySelectorAll("[data-login-tab]")) {
        const selected = button.dataset.loginTab === mall;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
        document.getElementById(button.getAttribute("aria-controls")).hidden = !selected;
    }
}

selectLoginTab("plutomall");

function renderAccountRows(mall) {
    const container = document.getElementById(`${mall}Accounts`);
    container.replaceChildren();
    accountsByMall[mall].forEach((account, index) => {
        const row = document.createElement("div");
        row.className = "saved-account";
        row.dataset.accountId = account.id;
        const heading = document.createElement("div");
        heading.className = "saved-account-heading";
        const title = document.createElement("strong");
        title.textContent = `Tài khoản ${index + 1}`;
        const actions = document.createElement("div");
        actions.className = "saved-account-actions";
        const body = document.createElement("div");
        body.className = "saved-account-body";
        body.id = `savedAccountBody-${mall}-${account.id}`;
        const disclosure = document.createElement("button");
        disclosure.className = "btn-util account-disclosure-btn";
        disclosure.type = "button";
        disclosure.setAttribute("aria-expanded", "true");
        disclosure.setAttribute("aria-controls", body.id);
        disclosure.setAttribute("aria-label", `Thu nhỏ Tài khoản ${index + 1}`);
        disclosure.title = `Thu nhỏ Tài khoản ${index + 1}`;
        const disclosureIcon = document.createElement("span");
        disclosureIcon.className = "account-disclosure-icon";
        disclosureIcon.setAttribute("aria-hidden", "true");
        disclosure.appendChild(disclosureIcon);
        disclosure.addEventListener("click", () => {
            const expanded = disclosure.getAttribute("aria-expanded") !== "true";
            disclosure.setAttribute("aria-expanded", String(expanded));
            disclosure.setAttribute(
                "aria-label",
                `${expanded ? "Thu nhỏ" : "Mở rộng"} Tài khoản ${index + 1}`
            );
            disclosure.title = `${expanded ? "Thu nhỏ" : "Mở rộng"} Tài khoản ${index + 1}`;
            body.hidden = !expanded;
        });
        const remove = document.createElement("button");
        remove.className = "btn-util remove-account-btn";
        remove.type = "button";
        remove.textContent = "×";
        remove.title = "Xóa tài khoản";
        remove.setAttribute("aria-label", "Xóa tài khoản");
        remove.addEventListener("click", () => {
            accountsByMall[mall] = accountsByMall[mall].filter(item => item.id !== account.id);
            renderAccountRows(mall);
            void renderActiveAccountPicker(getSelectedMall());
        });
        actions.append(disclosure, remove);
        heading.append(title, actions);

        const username = document.createElement("label");
        username.className = "login-field";
        const usernameLabel = document.createElement("span");
        usernameLabel.textContent = `Tài khoản ${mall === "plutomall" ? "Plutomall" : "Lilith Store"}`;
        const usernameInput = document.createElement("input");
        usernameInput.type = "text";
        usernameInput.autocomplete = "username";
        usernameInput.spellcheck = false;
        usernameInput.className = "account-username";
        usernameInput.value = account.username;
        username.append(usernameLabel, usernameInput);

        const password = document.createElement("label");
        password.className = "login-field";
        const passwordLabel = document.createElement("span");
        passwordLabel.textContent = "Mật khẩu";
        const passwordInput = document.createElement("input");
        passwordInput.type = "password";
        passwordInput.autocomplete = "current-password";
        passwordInput.className = "account-password";
        passwordInput.value = account.password;
        password.append(passwordLabel, passwordInput);
        body.append(username, password);
        row.append(heading, body);
        container.appendChild(row);
    });
}

async function renderActiveAccountPicker(mall) {
    const pickerVersion = ++accountPickerVersion;
    const saved = await chrome.storage.local.get("activeAccountIds");
    if (pickerVersion !== accountPickerVersion || mall !== getSelectedMall()) return;

    activeAccountSelect.replaceChildren();
    const accounts = accountsByMall[mall];
    for (const account of accounts) {
        const option = document.createElement("option");
        option.value = account.id;
        option.textContent = account.username || "Tài khoản chưa đặt tên";
        activeAccountSelect.appendChild(option);
    }
    const activeAccountIds = saved.activeAccountIds &&
        typeof saved.activeAccountIds === "object" &&
        !Array.isArray(saved.activeAccountIds)
        ? saved.activeAccountIds
        : {};
    const selected = activeAccountIds[mall];
    activeAccountSelect.value = accounts.some(account => account.id === selected)
        ? selected
        : accounts[0]?.id || "";
    activeAccountSelect.closest(".account-picker").hidden = accounts.length === 0;
    if (activeAccountIds[mall] !== activeAccountSelect.value) {
        activeAccountIds[mall] = activeAccountSelect.value;
        await chrome.storage.local.set({ activeAccountIds });
    }
}

async function loadSavedLoginCredentials() {
    const stored = await chrome.storage.local.get([
        "storeAccounts",
        "lilithstoreUsername",
        "lilithstorePassword",
        "plutomallUsername",
        "plutomallPassword",
    ]);
    const savedAccounts = stored.storeAccounts && typeof stored.storeAccounts === "object"
        ? stored.storeAccounts
        : {};
    let changed = !stored.storeAccounts;
    for (const mall of ["plutomall", "lilithstore"]) {
        const existing = Array.isArray(savedAccounts[mall])
            ? savedAccounts[mall].filter(account =>
                account && typeof account.id === "string" &&
                /^[A-Za-z0-9-]+$/.test(account.id) &&
                typeof account.username === "string" && typeof account.password === "string"
            )
            : [];
        const username = stored[`${mall}Username`] || "";
        const password = stored[`${mall}Password`] || "";
        if (existing.length === 0 && (username || password)) {
            existing.push({ id: "legacy", username, password });
            changed = true;
        }
        accountsByMall[mall] = existing;
        renderAccountRows(mall);
    }

    if (changed) {
        await chrome.storage.local.set({ storeAccounts: accountsByMall });
        const data = await chrome.storage.local.get(null);
        const migrated = {};
        const removals = [];
        const names = ["token", "roles", "drawsLeft", "lastCheck", "appUid", "appId", "isValidToken", "tokenTimestamp", "drawLog", "favoriteRoleIds"];
        for (const mall of ["plutomall", "lilithstore"]) {
            if (!accountsByMall[mall].some(account => account.id === "legacy")) continue;
            for (const name of names) {
                const oldKey = `${mall}_${name}`;
                if (Object.prototype.hasOwnProperty.call(data, oldKey)) {
                    migrated[`${mall}_account_legacy_${name}`] = data[oldKey];
                    removals.push(oldKey);
                }
            }
        }
        if (Object.keys(migrated).length > 0) await chrome.storage.local.set(migrated);
        if (removals.length > 0) await chrome.storage.local.remove(removals);
    }
    await chrome.storage.local.remove([
        "lilithstoreUsername",
        "lilithstorePassword",
        "plutomallUsername",
        "plutomallPassword",
    ]);
    await renderActiveAccountPicker(getSelectedMall());
}

for (const button of document.querySelectorAll("[data-add-account]")) {
    button.addEventListener("click", async () => {
        const mall = button.dataset.addAccount;
        const account = {
            id: crypto.randomUUID(),
            username: "",
            password: "",
        };
        accountsByMall[mall].push(account);
        renderAccountRows(mall);
        const saved = await chrome.storage.local.get("activeAccountIds");
        const activeAccountIds = saved.activeAccountIds &&
            typeof saved.activeAccountIds === "object" &&
            !Array.isArray(saved.activeAccountIds)
            ? saved.activeAccountIds
            : {};
        activeAccountIds[mall] = account.id;
        await chrome.storage.local.set({
            storeAccounts: accountsByMall,
            activeAccountIds,
        });
        await renderActiveAccountPicker(getSelectedMall());
    });
}

activeAccountSelect.addEventListener("change", async () => {
    const mall = getSelectedMall();
    const accountId = getSelectedAccountId();
    showAccountViewLoading();
    const saved = await chrome.storage.local.get("activeAccountIds");
    const activeAccountIds = saved.activeAccountIds &&
        typeof saved.activeAccountIds === "object" &&
        !Array.isArray(saved.activeAccountIds)
        ? saved.activeAccountIds
        : {};
    activeAccountIds[mall] = accountId;
    await chrome.storage.local.set({ activeAccountIds });
    if (mall !== getSelectedMall() || accountId !== getSelectedAccountId()) return;
    await renderCache(mall);
});

async function persistLoginAccounts({ validate = true, saveAutoRelogin = false } = {}) {
    const nextAccounts = {};
    for (const mall of ["plutomall", "lilithstore"]) {
        nextAccounts[mall] = [...document.querySelectorAll(`#${mall}Accounts .saved-account`)]
            .map(row => ({
                id: row.dataset.accountId,
                username: row.querySelector(".account-username").value.trim(),
                password: row.querySelector(".account-password").value,
            }));
        if (nextAccounts[mall].some(account =>
            Boolean(account.username) !== Boolean(account.password)
        )) {
            if (validate) {
                throw new Error(`Mỗi tài khoản ${mall === "plutomall" ? "Plutomall" : "Lilith Store"} cần có cả tên đăng nhập và mật khẩu.`);
            }
        }
    }

    const saved = await chrome.storage.local.get(null);
    const removedKeys = [];
    for (const mall of ["plutomall", "lilithstore"]) {
        const keep = new Set(nextAccounts[mall].map(account => account.id));
        for (const key of Object.keys(saved)) {
            const match = key.match(new RegExp(`^${mall}_account_(.+)_`));
            if (match && !keep.has(match[1])) removedKeys.push(key);
        }
    }
    const valuesToSave = { storeAccounts: nextAccounts };
    if (saveAutoRelogin) valuesToSave.autoReloginEnabled = autoReloginCheckbox.checked;
    await chrome.storage.local.set(valuesToSave);
    if (removedKeys.length) await chrome.storage.local.remove(removedKeys);
    accountsByMall = nextAccounts;

    const savedActive = await chrome.storage.local.get("activeAccountIds");
    const activeAccountIds = savedActive.activeAccountIds &&
        typeof savedActive.activeAccountIds === "object" &&
        !Array.isArray(savedActive.activeAccountIds)
        ? savedActive.activeAccountIds
        : {};
    for (const mall of ["plutomall", "lilithstore"]) {
        if (!nextAccounts[mall].some(account => account.id === activeAccountIds[mall])) {
            activeAccountIds[mall] = nextAccounts[mall][0]?.id || "";
        }
    }
    await chrome.storage.local.set({ activeAccountIds });
    await renderActiveAccountPicker(getSelectedMall());
    return true;
}

for (const accountContainer of document.querySelectorAll(".saved-accounts")) {
    accountContainer.addEventListener("change", () => {
        void persistLoginAccounts({ validate: false }).catch(error => {
            setLoginSettingsStatus(`Không thể lưu tài khoản: ${error.message}`);
        });
    });
}

for (const button of document.querySelectorAll("[data-login-tab]")) {
    button.addEventListener("click", () => selectLoginTab(button.dataset.loginTab));
}

autoReloginCheckbox.addEventListener("change", async () => {
    try {
        await persistLoginAccounts({ validate: false, saveAutoRelogin: true });
        await chrome.storage.local.set({ autoReloginEnabled: autoReloginCheckbox.checked });
        if (!autoReloginCheckbox.checked) {
            setLoginSettingsStatus("Đã tắt tự đăng nhập. Thông tin đã lưu được giữ nguyên.");
        } else {
            const mall = document.querySelector(".login-tab.active")?.dataset.loginTab || "lilithstore";
            const hasCredentials = accountsByMall[mall].some(account =>
                account.username && account.password
            );
            const storeName = mall === "lilithstore" ? "Lilith Store" : "Plutomall";
            setLoginSettingsStatus(
                hasCredentials
                    ? `Đã bật tự đăng nhập ${storeName} bằng thông tin đã lưu.`
                    : `Chưa có thông tin ${storeName} đã lưu. Thêm tài khoản và bấm Lưu thông tin.`
            );
        }
    } catch (error) {
        autoReloginCheckbox.checked = !autoReloginCheckbox.checked;
        setLoginSettingsStatus(`Không thể cập nhật cài đặt: ${error.message}`);
    }
});

document.getElementById("saveLoginBtn").addEventListener("click", async () => {
    try {
        await persistLoginAccounts({ saveAutoRelogin: true });
        setLoginSettingsStatus(
            autoReloginCheckbox.checked
                ? "Đã lưu tài khoản. Auto kiểm tra sẽ xử lý lần lượt các tài khoản có token."
                : "Đã lưu thông tin đăng nhập."
        );
    } catch (error) {
        setLoginSettingsStatus(`Không thể lưu: ${error.message}`);
    }
});

document.getElementById("clearLoginBtn").addEventListener("click", async () => {
    try {
        autoReloginCheckbox.checked = false;
        await chrome.storage.local.set({ autoReloginEnabled: false });
        const data = await chrome.storage.local.get(null);
        const removeKeys = Object.keys(data).filter(key =>
            key === "storeAccounts" ||
            key === "activeAccountIds" ||
            key === "plutomallUsername" || key === "plutomallPassword" ||
            key === "lilithstoreUsername" || key === "lilithstorePassword" ||
            /^plutomall_account_/.test(key) || /^lilithstore_account_/.test(key)
        );
        await chrome.storage.local.remove(removeKeys);
        accountsByMall = { plutomall: [], lilithstore: [] };
        await loadSavedLoginCredentials();
        setLoginSettingsStatus("Đã xóa toàn bộ tài khoản đã lưu.");
    } catch (error) {
        try {
            const { autoReloginEnabled } = await chrome.storage.local.get("autoReloginEnabled");
            autoReloginCheckbox.checked = autoReloginEnabled === true;
        } catch (stateError) {
            console.error("Could not restore auto-relogin setting:", stateError);
        }
        setLoginSettingsStatus(`Không thể xóa thông tin: ${error.message}`);
    }
});

async function testRelogin(mall, accountId) {
    const storeName = mall === "lilithstore" ? "Lilith Store" : "Plutomall";
    try {
        await persistLoginAccounts({ validate: false });
    } catch (error) {
        setLoginSettingsStatus(`Không thể kiểm tra: ${error.message}`);
        return;
    }
    if (!accountId) {
        const { activeAccountIds = {} } = await chrome.storage.local.get("activeAccountIds");
        accountId = mall === getSelectedMall()
            ? getSelectedAccountId()
            : activeAccountIds[mall] || accountsByMall[mall][0]?.id;
    }
    if (!accountId) {
        setLoginSettingsStatus(`Hãy chọn hoặc thêm tài khoản ${storeName} trước khi kiểm tra.`);
        return;
    }
    const account = accountsByMall[mall].find(item => item.id === accountId);
    if (!account?.username || !account.password) {
        setLoginSettingsStatus(`Hãy nhập và lưu đủ tài khoản, mật khẩu ${storeName} trước khi kiểm tra.`);
        return;
    }
    setLoginSettingsStatus(`Đang kiểm tra và mở tab đăng nhập ${storeName}…`);
    chrome.runtime.sendMessage({ action: "testRelogin", mall, accountId }, response => {
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
document.getElementById("testPlutoReloginBtn").title =
    "Kiểm tra tài khoản Plutomall đang chọn";
document.getElementById("testPlutoReloginBtn").setAttribute(
    "aria-label",
    "Kiểm tra tài khoản Plutomall đang chọn"
);
document.getElementById("testLilithReloginBtn").title =
    "Kiểm tra tài khoản Lilith Store đang chọn";
document.getElementById("testLilithReloginBtn").setAttribute(
    "aria-label",
    "Kiểm tra tài khoản Lilith Store đang chọn"
);

for (const [buttonId, mall] of [
    ["testPlutoAccountsBtn", "plutomall"],
    ["testLilithAccountsBtn", "lilithstore"],
]) {
    document.getElementById(buttonId).addEventListener("click", async () => {
        try {
            await persistLoginAccounts({ validate: false });
        } catch (error) {
            setLoginSettingsStatus(`Không thể bắt đầu kiểm tra: ${error.message}`);
            return;
        }
        const accounts = accountsByMall[mall].filter(account =>
            account.username && account.password
        );
        if (!accounts.length) {
            setLoginSettingsStatus(`Chưa có tài khoản đầy đủ của ${mall === "plutomall" ? "Plutomall" : "Lilith Store"}.`);
            return;
        }
        chrome.runtime.sendMessage({
            action: "testReloginSequence",
            mall,
            accountIds: accounts.map(account => account.id),
        }, response => {
            if (chrome.runtime.lastError) {
                setLoginSettingsStatus(`Không gửi được yêu cầu: ${chrome.runtime.lastError.message}`);
            } else if (response?.error) {
                setLoginSettingsStatus(`Không thể bắt đầu kiểm tra: ${response.error}`);
            } else {
                setLoginSettingsStatus(`Đang kiểm tra tuần tự ${accounts.length} tài khoản ${mall === "plutomall" ? "Plutomall" : "Lilith Store"}.`);
            }
        });
    });
}

const configSelectionCheckboxes = [
    ...document.querySelectorAll(".config-options input[type='checkbox']"),
];
const toggleAllConfigButton = document.getElementById("toggleAllConfigBtn");
const toggleAllConfigLabel = document.getElementById("toggleAllConfigLabel");
const configSelectionCount = document.getElementById("configSelectionCount");

function updateConfigSelectionButton() {
    const allSelected = configSelectionCheckboxes.length > 0 &&
        configSelectionCheckboxes.every(checkbox => checkbox.checked);
    const selectedCount = configSelectionCheckboxes.filter(checkbox => checkbox.checked).length;
    toggleAllConfigButton.classList.toggle("is-selected", allSelected);
    toggleAllConfigLabel.textContent = allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả";
    configSelectionCount.textContent =
        `${selectedCount}/${configSelectionCheckboxes.length} được chọn`;
    toggleAllConfigButton.setAttribute(
        "aria-label",
        allSelected ? "Bỏ chọn tất cả cài đặt" : "Chọn tất cả cài đặt"
    );
}

toggleAllConfigButton.addEventListener("click", () => {
    const allSelected = configSelectionCheckboxes.length > 0 &&
        configSelectionCheckboxes.every(checkbox => checkbox.checked);
    for (const checkbox of configSelectionCheckboxes) {
        checkbox.checked = !allSelected;
    }
    updateConfigSelectionButton();
});

for (const checkbox of configSelectionCheckboxes) {
    checkbox.addEventListener("change", updateConfigSelectionButton);
}
updateConfigSelectionButton();

document.getElementById("exportConfigBtn").addEventListener("click", async () => {
    const selectedKeys = [...document.querySelectorAll(".config-options input:checked")]
        .map(input => input.value);
    if (selectedKeys.length === 0) {
        configSettingsStatus.textContent = "Hãy chọn ít nhất một cài đặt để xuất.";
        return;
    }

    try {
        const accountDataKeys = new Set(["favoriteRoleIds", "tokens"]);
        const storageKeys = selectedKeys.filter(key => !accountDataKeys.has(key));
        const storedSettings = storageKeys.length > 0
            ? await chrome.storage.local.get(storageKeys)
            : {};
        const currentSettings = {
            autoReloginEnabled: autoReloginCheckbox.checked,
            autoCheckIntervalMinutes: Number(autoCheckIntervalInput.value),
            autoCheckEnabled: autoCheckCheckbox.checked,
        };
        const settings = {};
        for (const key of selectedKeys) {
            if (Object.prototype.hasOwnProperty.call(storedSettings, key)) {
                settings[key] = storedSettings[key];
            } else if (Object.prototype.hasOwnProperty.call(currentSettings, key)) {
                settings[key] = currentSettings[key];
            }
        }
        if (selectedKeys.includes("favoriteRoleIds")) {
            const favoriteKeysByMall = {};
            const favoriteKeys = [];
            for (const mall of ["plutomall", "lilithstore"]) {
                const accountIds = [
                    "",
                    ...accountsByMall[mall].map(account => account.id),
                ];
                favoriteKeysByMall[mall] = accountIds;
                favoriteKeys.push(
                    ...accountIds.map(accountId =>
                        accountStorageKey(mall, accountId, "favoriteRoleIds")
                    )
                );
            }
            const storedFavorites = favoriteKeys.length > 0
                ? await chrome.storage.local.get(favoriteKeys)
                : {};
            const favoritesByAccount = { plutomall: {}, lilithstore: {} };
            for (const mall of ["plutomall", "lilithstore"]) {
                for (const accountId of favoriteKeysByMall[mall]) {
                    const key = accountStorageKey(mall, accountId, "favoriteRoleIds");
                    if (Object.prototype.hasOwnProperty.call(storedFavorites, key)) {
                        favoritesByAccount[mall][accountId] = storedFavorites[key];
                    }
                }
            }
            settings.favoriteRoleIds = favoritesByAccount;
        }
        if (selectedKeys.includes("tokens")) {
            const tokenKeysByMall = {};
            const tokenKeys = [];
            for (const mall of ["plutomall", "lilithstore"]) {
                const accountIds = [
                    "",
                    ...accountsByMall[mall].map(account => account.id),
                ];
                tokenKeysByMall[mall] = accountIds;
                tokenKeys.push(
                    ...accountIds.map(accountId =>
                        accountStorageKey(mall, accountId, "token")
                    )
                );
            }
            const storedTokens = tokenKeys.length > 0
                ? await chrome.storage.local.get(tokenKeys)
                : {};
            const tokensByAccount = { plutomall: {}, lilithstore: {} };
            for (const mall of ["plutomall", "lilithstore"]) {
                for (const accountId of tokenKeysByMall[mall]) {
                    const key = accountStorageKey(mall, accountId, "token");
                    if (Object.prototype.hasOwnProperty.call(storedTokens, key)) {
                        tokensByAccount[mall][accountId] = storedTokens[key];
                    }
                }
            }
            settings.tokens = tokensByAccount;
        }
        if (Object.keys(settings).length === 0) {
            configSettingsStatus.textContent = "Không có cài đặt đã lưu nào trong các mục được chọn.";
            return;
        }
        for (const [key, value] of Object.entries(settings)) {
            if (!CONFIG_SETTING_VALIDATORS[key](value)) {
                throw new Error(`Giá trị cài đặt ${key} không hợp lệ.`);
            }
        }

        const config = {
            format: CONFIG_FORMAT,
            version: CONFIG_VERSION,
            settings,
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], {
            type: "application/json",
        });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `rok-weekly-auto-config-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        configSettingsStatus.textContent =
            `Đã xuất ${Object.keys(settings).length} cài đặt.`;
    } catch (error) {
        configSettingsStatus.textContent = `Không thể xuất cấu hình: ${error.message}`;
    }
});

document.getElementById("importConfigBtn").addEventListener("click", () => {
    importConfigFile.click();
});

importConfigFile.addEventListener("change", async () => {
    const file = importConfigFile.files[0];
    if (!file) return;

    try {
        const config = JSON.parse(await file.text());
        if (
            !config ||
            typeof config !== "object" ||
            Array.isArray(config) ||
            config.format !== CONFIG_FORMAT ||
            config.version !== CONFIG_VERSION ||
            !config.settings ||
            typeof config.settings !== "object" ||
            Array.isArray(config.settings)
        ) {
            throw new Error("File không đúng định dạng cấu hình được hỗ trợ.");
        }

        const entries = Object.entries(config.settings);
        if (
            entries.length === 0 ||
            entries.some(([key, value]) =>
                !Object.prototype.hasOwnProperty.call(CONFIG_SETTING_VALIDATORS, key) ||
                !CONFIG_SETTING_VALIDATORS[key](value)
            )
        ) {
            throw new Error("Cài đặt trong file không hợp lệ hoặc không được hỗ trợ.");
        }

        const importedSettings = Object.fromEntries(entries);
        const importedSettingCount = entries.length;
        const importedFavorites = importedSettings.favoriteRoleIds;
        delete importedSettings.favoriteRoleIds;
        const importedTokens = importedSettings.tokens;
        delete importedSettings.tokens;
        const legacyFields = [
            "plutomallUsername", "plutomallPassword",
            "lilithstoreUsername", "lilithstorePassword",
        ];
        if (
            legacyFields.some(key => Object.prototype.hasOwnProperty.call(importedSettings, key)) &&
            !Object.prototype.hasOwnProperty.call(importedSettings, "storeAccounts")
        ) {
            const importedAccounts = { plutomall: [], lilithstore: [] };
            for (const mall of ["plutomall", "lilithstore"]) {
                const username = importedSettings[`${mall}Username`] || "";
                const password = importedSettings[`${mall}Password`] || "";
                if (username || password) {
                    if (!username || !password) {
                        throw new Error(`File cần có cả tài khoản và mật khẩu ${mall === "plutomall" ? "Plutomall" : "Lilith Store"}.`);
                    }
                    importedAccounts[mall].push({
                        id: `imported-${crypto.randomUUID()}`,
                        username,
                        password,
                    });
                }
            }
            importedSettings.storeAccounts = importedAccounts;
            for (const key of legacyFields) delete importedSettings[key];
        }
        const accountDataToStore = {};
        if (importedFavorites) {
            for (const mall of ["plutomall", "lilithstore"]) {
                for (const [accountId, roleIds] of Object.entries(importedFavorites[mall])) {
                    const key = accountStorageKey(mall, accountId, "favoriteRoleIds");
                    accountDataToStore[key] = roleIds;
                }
            }
        }
        if (importedTokens) {
            for (const mall of ["plutomall", "lilithstore"]) {
                for (const [accountId, token] of Object.entries(importedTokens[mall])) {
                    const key = accountStorageKey(mall, accountId, "token");
                    accountDataToStore[key] = token;
                }
            }
        }
        await chrome.storage.local.set({ ...importedSettings, ...accountDataToStore });
        if (Object.prototype.hasOwnProperty.call(importedSettings, "autoCheckEnabled")) {
            autoCheckCheckbox.checked = importedSettings.autoCheckEnabled;
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "autoCheckIntervalMinutes")) {
            autoCheckIntervalInput.value = String(importedSettings.autoCheckIntervalMinutes);
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "autoReloginEnabled")) {
            autoReloginCheckbox.checked = importedSettings.autoReloginEnabled;
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "storeAccounts")) {
            accountsByMall = importedSettings.storeAccounts;
            renderAccountRows("plutomall");
            renderAccountRows("lilithstore");
            await renderActiveAccountPicker(getSelectedMall());
        }
        if (importedFavorites || importedTokens) {
            await renderCache(getSelectedMall());
        }
        configSettingsStatus.textContent =
            `Đã nhập ${importedSettingCount} cài đặt từ ${file.name}.`;
    } catch (error) {
        configSettingsStatus.textContent = `Không thể nhập cấu hình: ${error.message}`;
    } finally {
        importConfigFile.value = "";
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.autoReloginStatus?.newValue) {
        setLoginSettingsStatus(changes.autoReloginStatus.newValue);
    }
    const mall = getSelectedMall();
    const accountId = getSelectedAccountId();
    const drawLogKey = accountStorageKey(mall, accountId, "drawLog");
    if (changes[drawLogKey]) {
        renderDrawLog(changes[drawLogKey].newValue);
    }
    if (
        changes[accountStorageKey(mall, accountId, "token")] ||
        changes[accountStorageKey(mall, accountId, "roles")] ||
        changes[accountStorageKey(mall, accountId, "drawsLeft")]
    ) {
        renderCache(mall);
    }
});

document.getElementById("captureBtn").addEventListener("click", async () => {
    const mall = getSelectedMall();
    try {
        await persistLoginAccounts({ validate: false });
        const stored = await chrome.storage.local.get("activeAccountIds");
        const activeAccountIds = stored.activeAccountIds &&
            typeof stored.activeAccountIds === "object" &&
            !Array.isArray(stored.activeAccountIds)
            ? stored.activeAccountIds
            : {};
        activeAccountIds[mall] = getSelectedAccountId();
        await chrome.storage.local.set({ activeAccountIds, currentMall: mall });
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

document.getElementById("refreshCharsBtn").addEventListener("click", async () => {
    try {
        await persistLoginAccounts({ validate: false });
        await fetchAndRender(getSelectedMall());
    } catch (error) {
        setStatus(`Không thể làm mới: ${error.message}`);
    }
});

document.getElementById("drawNowBtn").addEventListener("click", async () => {
    try {
        await persistLoginAccounts({ validate: false });
    } catch (error) {
        setStatus(`Không thể quay thưởng: ${error.message}`);
        return;
    }
    const mall = getSelectedMall();
    const accountId = getSelectedAccountId();
    const drawLogKey = accountStorageKey(mall, accountId, "drawLog");
    const btn = document.getElementById("drawNowBtn");
    btn.disabled = true;
    btn.textContent = "Đang quay…";
    showLog();
    logEl.textContent = "Bắt đầu quay thưởng...";

    chrome.runtime.sendMessage({ action: "drawNow", mall, accountId }, (res) => {
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
                data = await chrome.storage.local.get(drawLogKey);
            } catch (error) {
                clearInterval(poll);
                setStatus(`Không đọc được nhật ký: ${error.message}`);
                btn.disabled = false;
                btn.textContent = "✦ Quay thưởng ngay";
                return;
            }
            const drawLog = data[drawLogKey];
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
        autoReloginCheckbox.checked = settings.autoReloginEnabled === true;
        if (settings.autoReloginStatus) setLoginSettingsStatus(settings.autoReloginStatus);
        await loadSavedLoginCredentials();

        const mall = await detectMall();
        await renderActiveAccountPicker(mall);
        await renderCache(mall);
    } catch (error) {
        setStatus(`Không thể khởi tạo popup: ${error.message}`);
        setCharsError(error.message);
    }
})();