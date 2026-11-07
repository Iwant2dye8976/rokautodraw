const statusEl = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const utcClockEl = document.getElementById("utcClock");
const logEl = document.getElementById("log");
const logWrap = document.getElementById("logWrap");
const tokenBox = document.getElementById("tokenBox");
const tokenCopyStatus = document.getElementById("tokenCopyStatus");
const charList = document.getElementById("charList");
const charSearchInput = document.getElementById("charSearchInput");
const clearCharSearchBtn = document.getElementById("clearCharSearchBtn");
const totalDrawsEl = document.getElementById("drawsRemaining");
const drawFavoritesOnlyCheckbox = document.getElementById("drawFavoritesOnly");
const drawFavoritesOnlyLabel = document.getElementById("drawFavoritesOnlyLabel");
const autoCheckCheckbox = document.getElementById("autoCheckEnabled");
const autoCheckToggleLabel = document.getElementById("autoCheckToggleLabel");
const autoCheckIntervalInput = document.getElementById("autoCheckIntervalMinutes");
const autoCheckSettingsStatus = document.getElementById("autoCheckSettingsStatus");
const autoCheckModeRadios = [...document.querySelectorAll('input[name="autoCheckMode"]')];
const utcResetPanel = document.getElementById("utcResetPanel");
const intervalPanel = document.getElementById("intervalPanel");
const utcResetDaySelect = document.getElementById("utcResetDaySelect");

function applyAutoCheckMode(mode) {
    const activeMode = mode === "interval" ? "interval" : "utcReset";
    for (const radio of autoCheckModeRadios) {
        radio.checked = (radio.value === activeMode);
    }
    if (utcResetPanel) utcResetPanel.hidden = (activeMode !== "utcReset");
    if (intervalPanel) intervalPanel.hidden = (activeMode !== "interval");
}
const autoReloginCheckbox = document.getElementById("autoReloginEnabled");
const autoReloginToggleLabel = document.getElementById("autoReloginToggleLabel");
const loginSettingsStatus = document.getElementById("loginSettingsStatus");
const configSettingsStatus = document.getElementById("configSettingsStatus");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const currentThemeLabel = document.getElementById("currentThemeLabel");
const themeRadios = [...document.querySelectorAll('input[name="themeMode"]')];
const langToggleBtn = document.getElementById("langToggleBtn");
const currentLanguageLabel = document.getElementById("currentLanguageLabel");
const languageRadios = [...document.querySelectorAll('input[name="languageMode"]')];

let currentLanguage = typeof DEFAULT_LANGUAGE !== "undefined" ? DEFAULT_LANGUAGE : "en";

function tr(key, params = {}) {
    return t(key, params, currentLanguage);
}

function getLocaleTag() {
    return currentLanguage === "vi" ? "vi-VN" : "en-US";
}

function applyStaticDomTranslations() {
    for (const el of document.querySelectorAll("[data-i18n]")) {
        const key = el.getAttribute("data-i18n");
        if (key) el.textContent = tr(key);
    }
    for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
        const key = el.getAttribute("data-i18n-placeholder");
        if (key) el.setAttribute("placeholder", tr(key));
    }
    for (const el of document.querySelectorAll("[data-i18n-title]")) {
        const key = el.getAttribute("data-i18n-title");
        if (key) el.setAttribute("title", tr(key));
    }
    for (const el of document.querySelectorAll("[data-i18n-aria-label]")) {
        const key = el.getAttribute("data-i18n-aria-label");
        if (key) el.setAttribute("aria-label", tr(key));
    }
}

const SVG_ICONS = {
    copy: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" /></svg>`,
    check: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6" /></svg>`,
    starFilled: `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="8 1.5 10.2 5.8 15 6.5 11.5 9.9 12.3 14.5 8 12.2 3.7 14.5 4.5 9.9 1 6.5 5.8 5.8 8 1.5" /></svg>`,
    starOutline: `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="8 1.5 10.2 5.8 15 6.5 11.5 9.9 12.3 14.5 8 12.2 3.7 14.5 4.5 9.9 1 6.5 5.8 5.8 8 1.5" /></svg>`,
    arrowLeft: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12.5" y1="8" x2="3.5" y2="8" /><polyline points="7.5 12 3.5 8 7.5 4" /></svg>`,
    close: `<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="4" x2="4" y2="12" /><line x1="4" y1="4" x2="12" y2="12" /></svg>`,
};

let currentThemeSetting = "system";

function getEffectiveTheme(choice) {
    if (choice === "dark" || choice === "light") {
        return choice;
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(choice) {
    currentThemeSetting = choice || "system";
    const effective = getEffectiveTheme(currentThemeSetting);
    document.documentElement.setAttribute("data-theme", effective);

    if (themeToggleBtn) {
        const label = effective === "dark" ? tr("switchThemeToLight") : tr("switchThemeToDark");
        themeToggleBtn.setAttribute("aria-label", label);
        themeToggleBtn.setAttribute("title", label);
    }

    if (currentThemeLabel) {
        currentThemeLabel.textContent = effective === "dark" ? tr("themeDark") : tr("themeLight");
    }

    for (const radio of themeRadios) {
        radio.checked = radio.value === currentThemeSetting;
    }
}

function applyLanguage(lang, rerenderDynamic = true) {
    currentLanguage = normalizeLanguage(lang);
    document.documentElement.setAttribute("lang", currentLanguage);

    if (langToggleBtn) {
        langToggleBtn.textContent = currentLanguage.toUpperCase();
        const switchLabel = tr("switchLangTitle");
        langToggleBtn.setAttribute("title", switchLabel);
        langToggleBtn.setAttribute("aria-label", switchLabel);
    }

    if (currentLanguageLabel) {
        currentLanguageLabel.textContent = currentLanguage === "vi" ? tr("langVietnamese") : tr("langEnglish");
    }

    for (const radio of languageRadios) {
        radio.checked = radio.value === currentLanguage;
    }

    applyStaticDomTranslations();
    applyTheme(currentThemeSetting);
    updateSwitchToggleLabels();
    if (typeof webhookEnabledCheckbox !== "undefined" && webhookEnabledCheckbox && webhookToggleLabel) {
        webhookToggleLabel.textContent = webhookEnabledCheckbox.checked ? tr("toggleOn") : tr("toggleOff");
    }
    if (typeof updateConfigSelectionButton === "function") {
        updateConfigSelectionButton();
    }
    if (rerenderDynamic) {
        if (typeof renderAccountRows === "function" && accountsByMall) {
            renderAccountRows("plutomall");
            renderAccountRows("lilithstore");
        }
        if (typeof renderActiveAccountPicker === "function" && typeof getSelectedMall === "function") {
            void renderActiveAccountPicker(getSelectedMall());
        }
        if (typeof renderRewardTotals === "function") {
            void renderRewardTotals();
        }
        if (typeof renderCache === "function" && typeof getSelectedMall === "function") {
            void renderCache(getSelectedMall());
        }
    }
}

async function setLanguageMode(newLang) {
    const normalized = normalizeLanguage(newLang);
    applyLanguage(normalized, true);
    try {
        await chrome.storage.local.set({ language: normalized });
    } catch (error) {
        console.error("Failed to save language setting:", error);
    }
}

if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
        const nextLang = currentLanguage === "vi" ? "en" : "vi";
        void setLanguageMode(nextLang);
    });
}

for (const radio of languageRadios) {
    radio.addEventListener("change", (e) => {
        if (e.target.checked) {
            void setLanguageMode(e.target.value);
        }
    });
}

try {
    const darkModeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    darkModeMedia.addEventListener("change", () => {
        if (currentThemeSetting === "system") {
            applyTheme("system");
        }
    });
} catch {
    // Non-fatal fallback
}

async function setThemeMode(newMode) {
    applyTheme(newMode);
    try {
        await chrome.storage.local.set({ theme: newMode });
    } catch (error) {
        console.error("Failed to save theme setting:", error);
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        const currentEffective = getEffectiveTheme(currentThemeSetting);
        const nextTheme = currentEffective === "dark" ? "light" : "dark";
        setThemeMode(nextTheme);
    });
}

for (const radio of themeRadios) {
    radio.addEventListener("change", (e) => {
        if (e.target.checked) {
            setThemeMode(e.target.value);
        }
    });
}

(async () => {
    try {
        const { theme, language } = await chrome.storage.local.get(["theme", "language"]);
        applyLanguage(language || DEFAULT_LANGUAGE, false);
        applyTheme(theme || "system");
    } catch {
        applyLanguage(DEFAULT_LANGUAGE, false);
        applyTheme("system");
    }
})();

function updateSwitchToggleLabels() {
    if (drawFavoritesOnlyLabel && drawFavoritesOnlyCheckbox) {
        drawFavoritesOnlyLabel.textContent = drawFavoritesOnlyCheckbox.checked ? tr("toggleOn") : tr("toggleOff");
    }
    if (autoCheckToggleLabel && autoCheckCheckbox) {
        autoCheckToggleLabel.textContent = autoCheckCheckbox.checked ? tr("toggleOn") : tr("toggleOff");
    }
    if (autoReloginToggleLabel && autoReloginCheckbox) {
        autoReloginToggleLabel.textContent = autoReloginCheckbox.checked ? tr("toggleOn") : tr("toggleOff");
    }
}

if (drawFavoritesOnlyCheckbox) {
    drawFavoritesOnlyCheckbox.addEventListener("change", async () => {
        updateSwitchToggleLabels();
        try {
            await chrome.storage.local.set({ drawFavoritesOnly: drawFavoritesOnlyCheckbox.checked });
        } catch (error) {
            drawFavoritesOnlyCheckbox.checked = !drawFavoritesOnlyCheckbox.checked;
            updateSwitchToggleLabels();
            setStatus(tr("saveSettingError", { error: error.message }));
        }
    });
}
const importConfigFile = document.getElementById("importConfigFile");
const configPassphraseInput = document.getElementById("configPassphraseInput");
const heroTokenBadge = document.getElementById("heroTokenBadge");
const toggleLogBtn = document.getElementById("toggleLogBtn");
const closeLogBtn = document.getElementById("closeLogBtn");
const headerContextBar = document.getElementById("headerContextBar");
const popupTabButtons = [...document.querySelectorAll("[data-popup-tab]")];
const popupTabPanels = [...document.querySelectorAll("[data-tab-panel]")];
const CONFIG_FORMAT = "rok-weekly-auto-config";

function selectPopupTab(rawTab) {
    const activeTab = normalizePopupTab(rawTab);
    showMain();
    for (const btn of popupTabButtons) {
        const isSelected = btn.dataset.popupTab === activeTab;
        btn.classList.toggle("active", isSelected);
        btn.setAttribute("aria-selected", String(isSelected));
    }
    for (const panel of popupTabPanels) {
        panel.hidden = panel.dataset.tabPanel !== activeTab;
    }
    if (headerContextBar) {
        headerContextBar.hidden = activeTab !== "draw";
    }
    if (activeTab === "analytics") {
        void renderRewardTotals();
    }
}

for (const btn of popupTabButtons) {
    btn.addEventListener("click", () => {
        selectPopupTab(btn.dataset.popupTab);
    });
}

function exportToCsv(filename, rows) {
    const csvContent = toCsv(rows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

const CONFIG_VERSION = 1;
const utcClockFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
});

function updateUtcClock() {
    const now = new Date();
    const utcDate = now.toISOString().slice(0, 10);
    utcClockEl.textContent = `UTC ${utcClockFormatter.format(now)}`;
    utcClockEl.title = `Ngày UTC: ${utcDate}`;
}

function showAccountViewLoading() {
    accountViewVersion++;
    cachedRoles = [];
    setStatus(tr("loadingData"), null);
    setCharsLoading();
    tokenBox.value = "";
    totalDrawsEl.textContent = tr("drawsRemainingPlaceholder");
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
let cachedRoles = [];
let cachedMall = null;
let cachedAccountId = null;
// While a manual refresh runs, its own storage writes must not re-render (and cancel) the view.
let refreshInFlight = false;
const accountExpandedState = new Map();
const activeAccountSelect = document.getElementById("activeAccountSelect");

function getSelectedAccountId() {
    return activeAccountSelect?.value || "";
}

function isCurrentAccountView(mall, accountId, viewVersion) {
    return viewVersion === accountViewVersion &&
        mall === getSelectedMall() &&
        accountId === getSelectedAccountId();
}

function evaluateTokenStatus(token, isValidToken) {
    if (!token) {
        return { text: tr("noToken"), state: null };
    }
    if (isJwtExpired(token)) {
        return { text: tr("tokenExpired"), state: false };
    }
    if (isValidToken === false) {
        return { text: tr("tokenInvalid"), state: false };
    }
    if (isValidToken === true) {
        const exp = getJwtExp(token);
        if (exp === null) return { text: tr("tokenOk"), state: true };
        const hoursLeft = Math.floor((exp * 1000 - Date.now()) / 3600000);
        return {
            text: tr("tokenOkRemaining", { days: Math.floor(hoursLeft / 24), hours: hoursLeft % 24 }),
            state: true,
        };
    }
    return { text: tr("tokenSaved"), state: true };
}

function setStatus(text, state = null) {
    statusEl.textContent = text;
    if (statusDot) {
        if (state === true || state === "on") {
            statusDot.className = "status-dot on";
        } else if (state === false || state === "off") {
            statusDot.className = "status-dot off";
        } else {
            statusDot.className = "status-dot";
        }
    }
    if (heroTokenBadge) {
        heroTokenBadge.textContent = text;
        heroTokenBadge.classList.remove("is-valid", "is-invalid");
        if (state === true || state === "on") {
            heroTokenBadge.classList.add("is-valid");
        } else if (state === false || state === "off") {
            heroTokenBadge.classList.add("is-invalid");
        }
    }
}

function showLog() {
    if (logWrap) logWrap.style.display = "";
    logEl.classList.add("visible");
    if (toggleLogBtn) toggleLogBtn.setAttribute("aria-expanded", "true");
}

function hideLog() {
    if (logWrap) logWrap.style.display = "none";
    if (toggleLogBtn) toggleLogBtn.setAttribute("aria-expanded", "false");
}

if (toggleLogBtn) {
    toggleLogBtn.addEventListener("click", () => {
        const isHidden = !logWrap || logWrap.style.display === "none";
        if (isHidden) {
            if (!logEl.textContent.trim()) {
                logEl.textContent = tr("noSessionLogsYet");
            }
            showLog();
        } else {
            hideLog();
        }
    });
}

if (closeLogBtn) {
    closeLogBtn.addEventListener("click", () => {
        hideLog();
    });
}

function renderDrawLog(drawLog) {
    if (drawLog?.length) {
        showLog();
        logEl.textContent = drawLog.join("\n");
        logEl.scrollTop = logEl.scrollHeight;
    } else {
        hideLog();
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
    badge.textContent = tr("loading");
    row.appendChild(badge);
    charList.appendChild(row);
}

function setCharsEmpty(msg = tr("noToken")) {
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

function selectLoginTab(mall) {
    for (const button of document.querySelectorAll("[data-login-tab]")) {
        const selected = button.dataset.loginTab === mall;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
        const panel = document.getElementById(button.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
    }
}

function syncRadio(mall) {
    const radio = document.querySelector(`input[name="store"][value="${mall}"]`);
    if (radio) radio.checked = true;
    selectLoginTab(mall);
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

let searchDebounceTimer;
if (charSearchInput) {
    charSearchInput.addEventListener("input", () => {
        const hasText = Boolean(charSearchInput.value);
        if (clearCharSearchBtn) clearCharSearchBtn.hidden = !hasText;
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            if (cachedRoles?.length > 0) {
                renderChars(cachedRoles, cachedMall || getSelectedMall(), cachedAccountId || getSelectedAccountId());
            }
        }, 120);
    });
}

if (clearCharSearchBtn) {
    clearCharSearchBtn.addEventListener("click", () => {
        if (charSearchInput) {
            charSearchInput.value = "";
            charSearchInput.focus();
        }
        clearCharSearchBtn.hidden = true;
        if (cachedRoles?.length > 0) {
            renderChars(cachedRoles, cachedMall || getSelectedMall(), cachedAccountId || getSelectedAccountId());
        }
    });
}

async function renderChars(roles, mall, accountId = getSelectedAccountId(), viewVersion = accountViewVersion) {
    cachedRoles = Array.isArray(roles) ? roles : [];
    cachedMall = mall;
    cachedAccountId = accountId;
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
        setCharsError(tr("loadFavoritesError", { error: error.message }));
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

    const searchVal = charSearchInput?.value.trim() || "";
    const displayRoles = searchVal
        ? sortedRoles.filter(role => matchesSearch(role, searchVal))
        : sortedRoles;

    if (displayRoles.length === 0) {
        if (sortedRoles.length === 0) {
            setCharsEmpty(tr("noCharsFound"));
        } else {
            setCharsEmpty(tr("noMatchingChars"));
        }
        return;
    }

    for (const role of displayRoles) {
        const roleId = String(role.roleId ?? "");
        const roleName = String(role.name ?? tr("unknownName"));
        const div = document.createElement("div");
        div.className = "char-row";
        div.dataset.roleId = roleId;
        div.setAttribute("role", "button");
        div.setAttribute("tabindex", "0");
        const viewHistLabel = tr("viewCharHistoryAria", { name: roleName });
        div.setAttribute("aria-label", viewHistLabel);
        div.title = viewHistLabel;
        div.addEventListener("click", (e) => {
            if (e.target.closest("button") || e.target.closest(".char-favorite-btn") || e.target.closest(".char-copy-btn")) {
                return;
            }
            openCharacterHistory(roleId, roleName);
        });
        div.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                if (e.target.closest("button")) return;
                e.preventDefault();
                openCharacterHistory(roleId, roleName);
            }
        });

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
        name.dataset.roleId = roleId;
        name.textContent = roleName;
        nameWrap.appendChild(name);

        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.className = "char-favorite-btn";
        const isFavorite = favoritePositions.has(roleId);
        favoriteButton.innerHTML = isFavorite ? SVG_ICONS.starFilled : SVG_ICONS.starOutline;
        favoriteButton.title = isFavorite ? tr("removeFavorite") : tr("addFavorite");
        favoriteButton.setAttribute("aria-label", favoriteButton.title);
        favoriteButton.setAttribute("aria-pressed", String(isFavorite));
        if (isFavorite) favoriteButton.classList.add("is-favorite");
        favoriteButton.addEventListener("click", async (e) => {
            e.stopPropagation();
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
                setStatus(tr("updateFavoriteError", { error: error.message }));
            }
        });

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "char-copy-btn";
        copyButton.innerHTML = SVG_ICONS.copy;
        copyButton.title = tr("copyCharInfo");
        copyButton.setAttribute("aria-label", tr("copyCharInfo"));
        copyButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(`ID: ${roleId} - ${roleName}`);
                copyButton.innerHTML = SVG_ICONS.check;
                copyButton.title = tr("copied");
                copyButton.setAttribute("aria-label", tr("copiedCharInfoAria"));
            } catch (error) {
                console.error("Could not copy character info:", error);
                copyButton.textContent = "!";
                copyButton.title = tr("copyCharInfoError");
                copyButton.setAttribute("aria-label", tr("copyCharInfoError"));
            }
            window.setTimeout(() => {
                copyButton.innerHTML = SVG_ICONS.copy;
                copyButton.title = tr("copyCharInfo");
                copyButton.setAttribute("aria-label", tr("copyCharInfo"));
            }, 1500);
        });

        const server = document.createElement("span");
        server.textContent = `#${role.svrId ?? "?"}`;
        div.append(avatarWrap, nameWrap, favoriteButton, copyButton, server);
        charList.appendChild(div);
    }
}

function renderDrawsLeft(drawsLeft) {
    if (drawsLeft !== null && drawsLeft !== undefined) {
        totalDrawsEl.textContent = tr("drawsRemaining", { count: drawsLeft });
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
            setStatus(tr("noToken"), null);
            setCharsEmpty(tr("noDataCapturePrompt"));
            tokenBox.value = "";
            totalDrawsEl.textContent = tr("drawsRemainingPlaceholder");
            renderDrawLog(drawLog);
            return;
        }

        const tokenKey = accountStorageKey(mall, accountId, "token");
        const { [tokenKey]: token } = await chrome.storage.local.get(tokenKey);
        if (!isCurrentAccountView(mall, accountId, viewVersion)) return;

        const tokenEval = evaluateTokenStatus(token, res.isValidToken);
        setStatus(tokenEval.text, tokenEval.state);
        tokenBox.value = token || "";

        renderDrawsLeft(res.drawsLeft);

        renderDrawLog(drawLog);

        const isDrawingKey = accountStorageKey(mall, accountId, "isDrawing");
        const { [isDrawingKey]: isDrawing } = await chrome.storage.local.get(isDrawingKey);
        const drawBtn = document.getElementById("drawNowBtn");
        if (drawBtn) {
            drawBtn.disabled = !!isDrawing;
            drawBtn.textContent = isDrawing ? tr("drawingBtn") : tr("drawNowBtn");
        }

        if (res.roles?.length > 0) {
            await renderChars(res.roles, mall, accountId, viewVersion);
        } else {
            cachedRoles = [];
            setCharsEmpty(tr("clickRefreshToLoadChars"));
        }
    } catch (err) {
        if (!isCurrentAccountView(mall, accountId, viewVersion)) return;
        console.error("renderCache error:", err);
        setStatus(tr("readDataError", { error: err.message }));
        setCharsError(err.message);
    }
}

async function fetchAndRender(mall) {
    const m = mall ?? getSelectedMall();
    const accountId = getSelectedAccountId();
    const viewVersion = ++accountViewVersion;
    setStatus(tr("refreshing"), null);
    setCharsLoading();
    refreshInFlight = true;
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "refresh", mall: m, accountId }, async (res) => {
            refreshInFlight = false;
            if (!isCurrentAccountView(m, accountId, viewVersion)) {
                resolve(null);
                return;
            }
            if (chrome.runtime.lastError) {
                setStatus(tr("connectionError"), false);
                setCharsError(tr("extensionConnectionError"));
                return reject(new Error(chrome.runtime.lastError.message));
            }
            if (!res) {
                setStatus(tr("responseError"), false);
                setCharsError(tr("extensionEmptyResponse"));
                return reject(new Error(tr("extensionEmptyResponse")));
            }
            if (res?.error) {
                const isExp = res.isExpired || res.isValidToken === false || /hết hạn|expired|invalid|401|403/i.test(res.error);
                if (isExp) {
                    setStatus(tr("tokenExpired"), false);
                    setCharsError(tr("tokenExpiredReloginPrompt"));
                } else {
                    setStatus(res.error.length > 25 ? res.error.slice(0, 25) + "…" : res.error, false);
                    setCharsError(res.error);
                }
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
                setStatus(tr("errorPrefix", { error: error.message }), false);
                reject(error);
                return;
            }

            const status = evaluateTokenStatus(tokenBox.value, true);
            setStatus(status.text, status.state);
            renderDrawsLeft(res.totalDrawsLeft);

            const roles = Array.isArray(res.roles) ? res.roles : [];
            if (roles.length > 0) {
                await renderChars(roles, m, accountId, viewVersion);
            } else {
                cachedRoles = [];
                setCharsEmpty(tr("noCharsFound"));
            }

            resolve(res);
        });
    });
}

function openCharacterHistory(roleId, roleName) {
    const mall = getSelectedMall();
    showHistoryLoading(roleName);
    chrome.runtime.sendMessage(
        {
            action: "getDrawHistory",
            roleId,
            mall,
            accountId: getSelectedAccountId(),
        },
        (res) => {
            if (chrome.runtime.lastError) {
                showHistoryError(chrome.runtime.lastError.message);
                return;
            }
            if (res?.error || !res?.character || !res?.history) {
                showHistoryError(res?.error || tr("invalidHistoryResponse"));
                return;
            }
            showHistory(res.character, res.history);
        }
    );
}

function showHistory(character, history) {
    document.getElementById("main").style.display = "none";
    const existing = document.getElementById("detailView");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "detailView";
    div.innerHTML = `
    <nav class="detail-nav">
      <button id="backBtn" class="back-btn">${SVG_ICONS.arrowLeft}<span>${tr("backBtn")}</span></button>
      <span class="detail-nav-title">${tr("drawHistoryTitle")}</span>
      <button id="exportHistoryCsvBtn" class="detail-csv-btn" type="button" title="${tr("exportCsvTitle")}" aria-label="${tr("exportCsvTitle")}">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" />
        </svg>
        <span>${tr("exportCsvBtn")}</span>
      </button>
    </nav>
    <div class="content">
      <div class="char-hero-card">
        <div class="char-hero-inner">
          <span class="hero-avatar-wrap"><img class="hero-avatar" alt=""></span>
          <div>
            <div class="hero-name"></div>
            <div class="hero-svr"></div>
          </div>
        </div>
      </div>
      <div class="history-card">
        <div class="history-card-head">${tr("rewardsReceivedHead")}</div>
        <div class="history-list"></div>
      </div>
    </div>`;

    const avatarWrap = div.querySelector(".hero-avatar-wrap");
    const avatar = div.querySelector(".hero-avatar");
    const showFallback = () => showAvatarFallback(avatar, avatarWrap, character?.name);
    avatar.addEventListener("error", showFallback);
    if (!setImageSource(avatar, character?.avatar)) showFallback();
    div.querySelector(".hero-name").textContent = String(character?.name ?? tr("unknownName"));
    div.querySelector(".hero-svr").textContent = `Server #${character?.svrId ?? "?"}`;

    const exportHistBtn = div.querySelector("#exportHistoryCsvBtn");
    if (exportHistBtn) {
        exportHistBtn.addEventListener("click", () => {
            const histEntries = Array.isArray(history?.data?.list) ? history.data.list : [];
            if (histEntries.length === 0) {
                alert(tr("noHistoryToExport"));
                return;
            }
            const rows = [
                [
                    tr("csvHistoryNo"),
                    tr("csvHistoryTime"),
                    tr("csvHistoryCharacter"),
                    tr("csvHistoryServer"),
                    tr("csvHistoryReward"),
                    tr("csvHistoryQuantity"),
                    tr("csvHistoryRewardId"),
                ],
                ...histEntries.map((item, idx) => [
                    idx + 1,
                    item.timestamp ? new Date(item.timestamp * 1000).toLocaleString(getLocaleTag()) : "",
                    character?.name || "",
                    character?.svrId || "",
                    translateRewardName(item.rewardName || "-", currentLanguage),
                    item.num || 1,
                    item.rewardId || ""
                ])
            ];
            const charNameSafe = (character?.name || "character").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
            exportToCsv(`rok-history-${charNameSafe}-${character?.roleId || "unknown"}.csv`, rows);
        });
    }

    const historyList = div.querySelector(".history-list");
    const entries = Array.isArray(history?.data?.list) ? history.data.list : [];
    if (entries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "history-empty";
        empty.textContent = tr("noDrawHistory");
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
        const rewardLabel = translateRewardName(item.rewardName ?? "-", currentLanguage);
        reward.textContent = `${rewardLabel} x${item.num || 1}`;
        row.append(number, image, reward);

        const timestamp = Number(item.timestamp);
        if (Number.isFinite(timestamp) && timestamp > 0) {
            const date = document.createElement("span");
            date.className = "h-time";
            date.textContent = new Date(timestamp * 1000).toLocaleString(
                getLocaleTag(),
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
      <button id="backBtn" class="back-btn">${SVG_ICONS.arrowLeft}<span>${tr("backBtn")}</span></button>
      <span class="detail-nav-title">${tr("drawHistoryTitle")}</span>
    </nav>
    <div class="content">
      <div class="char-hero-card">
        <div class="char-hero-inner">
          <div class="hero-name"></div>
        </div>
      </div>
      <div class="history-card">
        <div class="history-card-head">${tr("rewardsReceivedHead")}</div>
        <div class="history-list">
          <div class="history-empty history-loading">${tr("loading")}</div>
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
    error.textContent = tr("errorPrefix", { error: message });
    list.appendChild(error);
}

for (const radio of document.querySelectorAll('input[name="store"]')) {
    radio.addEventListener("change", async () => {
        const mall = radio.value;
        selectLoginTab(mall);
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

const copyTokenButton = document.getElementById("copyTokenBtn");
copyTokenButton.addEventListener("click", async () => {
    const token = tokenBox.value.trim();
    if (!token) {
        tokenCopyStatus.textContent = tr("noTokenToCopy");
        return;
    }

    try {
        await navigator.clipboard.writeText(token);
        copyTokenButton.innerHTML = SVG_ICONS.check;
        copyTokenButton.title = tr("copied");
        copyTokenButton.setAttribute("aria-label", tr("copiedTokenAria"));
        tokenCopyStatus.textContent = tr("copiedTokenStatus");
    } catch (error) {
        console.error("Could not copy token:", error);
        copyTokenButton.textContent = "!";
        copyTokenButton.title = tr("copyTokenError");
        copyTokenButton.setAttribute("aria-label", tr("copyTokenError"));
        tokenCopyStatus.textContent = tr("copyTokenErrorStatus", { error: error.message });
    }
    window.setTimeout(() => {
        copyTokenButton.innerHTML = SVG_ICONS.copy;
        copyTokenButton.title = tr("copyTokenTitle");
        copyTokenButton.setAttribute("aria-label", tr("copyTokenTitle"));
    }, 1500);
});

autoCheckCheckbox.addEventListener("change", async () => {
    updateSwitchToggleLabels();
    try {
        await chrome.storage.local.set({ autoCheckEnabled: autoCheckCheckbox.checked });
        autoCheckSettingsStatus.textContent = autoCheckCheckbox.checked
            ? tr("autoCheckEnabledStatus")
            : tr("autoCheckDisabledStatus");
    } catch (error) {
        autoCheckCheckbox.checked = !autoCheckCheckbox.checked;
        updateSwitchToggleLabels();
        autoCheckSettingsStatus.textContent = tr("updateSettingError", { error: error.message });
    }
});

function updateIntervalPresetActive(minutes) {
    for (const btn of document.querySelectorAll(".preset-chip")) {
        const chipMinutes = Number(btn.dataset.minutes);
        btn.classList.toggle("active", chipMinutes === minutes);
    }
}

for (const btn of document.querySelectorAll(".preset-chip")) {
    btn.addEventListener("click", async () => {
        const minutes = Number(btn.dataset.minutes);
        autoCheckIntervalInput.value = String(minutes);
        updateIntervalPresetActive(minutes);
        try {
            await chrome.storage.local.set({ autoCheckIntervalMinutes: minutes });
            const hours = minutes / 60;
            const hourText = hours >= 1 ? tr("intervalHoursSuffix", { hours }) : "";
            autoCheckSettingsStatus.textContent = tr("intervalSavedStatus", { minutes, hourText });
        } catch (error) {
            autoCheckSettingsStatus.textContent = tr("intervalSaveError", { error: error.message });
        }
    });
}

autoCheckIntervalInput.addEventListener("input", () => {
    updateIntervalPresetActive(Number(autoCheckIntervalInput.value));
});

autoCheckIntervalInput.addEventListener("change", async () => {
    const intervalMinutes = Number(autoCheckIntervalInput.value);
    updateIntervalPresetActive(intervalMinutes);
    if (!Number.isSafeInteger(intervalMinutes) || intervalMinutes < 1) {
        autoCheckSettingsStatus.textContent = tr("intervalValidationError");
        return;
    }

    try {
        await chrome.storage.local.set({ autoCheckIntervalMinutes: intervalMinutes });
        const hourText = intervalMinutes % 60 === 0 ? tr("intervalHoursSuffix", { hours: intervalMinutes / 60 }) : "";
        autoCheckSettingsStatus.textContent = tr("intervalSavedStatus", { minutes: intervalMinutes, hourText });
    } catch (error) {
        autoCheckSettingsStatus.textContent = tr("intervalSaveError", { error: error.message });
    }
});

selectLoginTab(getSelectedMall());

function renderAccountRows(mall) {
    const container = document.getElementById(`${mall}Accounts`);
    container.replaceChildren();
    const storeName = mall === "plutomall" ? "Plutomall" : "Lilith Store";
    accountsByMall[mall].forEach((account, index) => {
        const row = document.createElement("div");
        row.className = "saved-account";
        row.dataset.accountId = account.id;
        const heading = document.createElement("div");
        heading.className = "saved-account-heading";
        const title = document.createElement("strong");
        title.textContent = account.username
            ? tr("accountItemTitleWithUser", { index: index + 1, username: account.username })
            : tr("accountItemTitle", { index: index + 1 });
        const actions = document.createElement("div");
        actions.className = "saved-account-actions";
        const body = document.createElement("div");
        body.className = "saved-account-body";
        body.id = `savedAccountBody-${mall}-${account.id}`;

        const isExpanded = accountExpandedState.has(account.id)
            ? accountExpandedState.get(account.id)
            : false;
        body.hidden = !isExpanded;

        const disclosure = document.createElement("button");
        disclosure.className = "btn-util account-disclosure-btn";
        disclosure.type = "button";
        disclosure.setAttribute("aria-expanded", String(isExpanded));
        disclosure.setAttribute("aria-controls", body.id);
        const disclosureLabel = tr(isExpanded ? "collapseAccount" : "expandAccount", { index: index + 1 });
        disclosure.setAttribute("aria-label", disclosureLabel);
        disclosure.title = disclosureLabel;
        disclosure.innerHTML = `<svg class="disclosure-chevron" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 6l4.5 4.5 4.5-4.5" /></svg>`;

        function toggleAccount() {
            const expanded = disclosure.getAttribute("aria-expanded") !== "true";
            disclosure.setAttribute("aria-expanded", String(expanded));
            const nextLabel = tr(expanded ? "collapseAccount" : "expandAccount", { index: index + 1 });
            disclosure.setAttribute("aria-label", nextLabel);
            disclosure.title = nextLabel;
            heading.title = nextLabel;
            body.hidden = !expanded;
            accountExpandedState.set(account.id, expanded);
        }

        heading.title = disclosureLabel;
        heading.addEventListener("click", (e) => {
            if (e.target.closest(".remove-account-btn")) return;
            toggleAccount();
        });

        row.addEventListener("click", (e) => {
            if (!body.hidden) return;
            if (e.target.closest(".remove-account-btn")) return;
            if (e.target.closest(".saved-account-heading")) return;
            toggleAccount();
        });

        const remove = document.createElement("button");
        remove.className = "btn-util remove-account-btn";
        remove.type = "button";
        remove.innerHTML = SVG_ICONS.close;
        remove.title = tr("removeAccountTitle");
        remove.setAttribute("aria-label", tr("removeAccountTitle"));
        remove.addEventListener("click", (e) => {
            e.stopPropagation();
            accountExpandedState.delete(account.id);
            accountsByMall[mall] = accountsByMall[mall].filter(item => item.id !== account.id);
            renderAccountRows(mall);
            void renderActiveAccountPicker(getSelectedMall());
        });
        actions.append(disclosure, remove);
        heading.append(title, actions);

        const username = document.createElement("label");
        username.className = "login-field";
        const usernameLabel = document.createElement("span");
        usernameLabel.textContent = tr("storeAccountLabel", { store: storeName });
        const usernameInput = document.createElement("input");
        usernameInput.type = "text";
        usernameInput.autocomplete = "username";
        usernameInput.spellcheck = false;
        usernameInput.className = "account-username";
        usernameInput.value = account.username;
        usernameInput.addEventListener("input", () => {
            account.username = usernameInput.value.trim();
            title.textContent = account.username
                ? tr("accountItemTitleWithUser", { index: index + 1, username: account.username })
                : tr("accountItemTitle", { index: index + 1 });
        });
        username.append(usernameLabel, usernameInput);

        const password = document.createElement("div");
        password.className = "login-field password-field-wrap";
        const passwordLabel = document.createElement("span");
        passwordLabel.className = "input-label";
        passwordLabel.textContent = tr("passwordLabel");

        const passwordInputGroup = document.createElement("div");
        passwordInputGroup.className = "password-input-group";

        const passwordInput = document.createElement("input");
        passwordInput.type = "password";
        passwordInput.autocomplete = "current-password";
        passwordInput.className = "account-password";
        passwordInput.value = account.password;
        passwordInput.spellcheck = false;
        passwordInput.addEventListener("input", () => {
            account.password = passwordInput.value;
        });

        const togglePasswordBtn = document.createElement("button");
        togglePasswordBtn.type = "button";
        togglePasswordBtn.className = "btn-toggle-password";
        togglePasswordBtn.title = tr("showPassword");
        togglePasswordBtn.setAttribute("aria-label", tr("showPassword"));
        togglePasswordBtn.setAttribute("aria-pressed", "false");

        const eyeOpenSvg = `<svg class="eye-icon" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 10s3.5-6 8.5-6 8.5 6 8.5 6-3.5 6-8.5 6-8.5-6-8.5-6z"/><circle cx="10" cy="10" r="2.5"/></svg>`;
        const eyeClosedSvg = `<svg class="eye-icon" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 2l16 16"/><path d="M8.5 4.3A9.2 9.2 0 0 1 10 4c5 0 8.5 6 8.5 6a14.2 14.2 0 0 1-3.3 4.2"/><path d="M14.1 14.1A8.9 8.9 0 0 1 10 16c-5 0-8.5-6-8.5-6a14.5 14.5 0 0 1 4.5-4.5"/><path d="M8.2 8.2a2.5 2.5 0 0 0 3.6 3.6"/></svg>`;

        togglePasswordBtn.innerHTML = eyeOpenSvg;

        togglePasswordBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            togglePasswordBtn.innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
            const newLabel = isPassword ? tr("hidePassword") : tr("showPassword");
            togglePasswordBtn.title = newLabel;
            togglePasswordBtn.setAttribute("aria-label", newLabel);
            togglePasswordBtn.setAttribute("aria-pressed", String(isPassword));
            passwordInput.focus();
        });

        passwordInputGroup.append(passwordInput, togglePasswordBtn);
        password.append(passwordLabel, passwordInputGroup);
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
        option.textContent = account.username || tr("unnamedAccount");
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

        const currentDomAccounts = [...document.querySelectorAll(`#${mall}Accounts .saved-account`)];
        currentDomAccounts.forEach(row => {
            const acc = accountsByMall[mall].find(a => a.id === row.dataset.accountId);
            if (acc) {
                const u = row.querySelector(".account-username");
                const p = row.querySelector(".account-password");
                if (u) acc.username = u.value.trim();
                if (p) acc.password = p.value;
            }
        });

        accountsByMall[mall].forEach(existingAcc => {
            accountExpandedState.set(existingAcc.id, false);
        });

        const account = {
            id: crypto.randomUUID(),
            username: "",
            password: "",
        };
        accountExpandedState.set(account.id, true);
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

        const newRowInput = document.querySelector(
            `#${mall}Accounts .saved-account[data-account-id="${account.id}"] .account-username`
        );
        if (newRowInput) newRowInput.focus();
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
                throw new Error(tr("accountIncompleteError", { store: mall === "plutomall" ? "Plutomall" : "Lilith Store" }));
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
            setLoginSettingsStatus(tr("saveAccountError", { error: error.message }));
        });
    });
}

for (const button of document.querySelectorAll("[data-login-tab]")) {
    button.addEventListener("click", () => {
        const mall = button.dataset.loginTab;
        selectLoginTab(mall);
        const radio = document.querySelector(`input[name="store"][value="${mall}"]`);
        if (radio && !radio.checked) {
            radio.checked = true;
            radio.dispatchEvent(new Event("change"));
        }
    });
}

autoReloginCheckbox.addEventListener("change", async () => {
    updateSwitchToggleLabels();
    try {
        await persistLoginAccounts({ validate: false, saveAutoRelogin: true });
        if (!autoReloginCheckbox.checked) {
            setLoginSettingsStatus(tr("autoReloginDisabledStatus"));
        } else {
            const mall = document.querySelector(".login-tab.active")?.dataset.loginTab || "lilithstore";
            const hasCredentials = accountsByMall[mall].some(account =>
                account.username && account.password
            );
            const storeName = mall === "lilithstore" ? "Lilith Store" : "Plutomall";
            setLoginSettingsStatus(
                hasCredentials
                    ? tr("autoReloginEnabledStatus", { store: storeName })
                    : tr("autoReloginNoCredsStatus", { store: storeName })
            );
        }
    } catch (error) {
        autoReloginCheckbox.checked = !autoReloginCheckbox.checked;
        updateSwitchToggleLabels();
        setLoginSettingsStatus(tr("updateSettingError", { error: error.message }));
    }
});

document.getElementById("saveLoginBtn").addEventListener("click", async () => {
    try {
        await persistLoginAccounts({ saveAutoRelogin: true });
        setLoginSettingsStatus(
            autoReloginCheckbox.checked
                ? tr("accountsSavedAutoStatus")
                : tr("credentialsSavedStatus")
        );
    } catch (error) {
        setLoginSettingsStatus(tr("saveGenericError", { error: error.message }));
    }
});

document.getElementById("clearLoginBtn").addEventListener("click", async () => {
    if (!confirm(tr("confirmClearAccounts"))) {
        return;
    }
    try {
        autoReloginCheckbox.checked = false;
        updateSwitchToggleLabels();
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
        setLoginSettingsStatus(tr("accountsClearedStatus"));
    } catch (error) {
        try {
            const { autoReloginEnabled } = await chrome.storage.local.get("autoReloginEnabled");
            autoReloginCheckbox.checked = autoReloginEnabled === true;
        } catch (stateError) {
            console.error("Could not restore auto-relogin setting:", stateError);
        }
        setLoginSettingsStatus(tr("clearAccountsError", { error: error.message }));
    }
});

async function testRelogin(mall, accountId) {
    const storeName = mall === "lilithstore" ? "Lilith Store" : "Plutomall";
    try {
        await persistLoginAccounts({ validate: false });
    } catch (error) {
        setLoginSettingsStatus(tr("testCannotStartError", { error: error.message }));
        return;
    }
    if (!accountId) {
        const { activeAccountIds = {} } = await chrome.storage.local.get("activeAccountIds");
        accountId = mall === getSelectedMall()
            ? getSelectedAccountId()
            : activeAccountIds[mall] || accountsByMall[mall][0]?.id;
    }
    if (!accountId) {
        setLoginSettingsStatus(tr("selectOrAddAccountPrompt", { store: storeName }));
        return;
    }
    const account = accountsByMall[mall].find(item => item.id === accountId);
    if (!account?.username || !account.password) {
        setLoginSettingsStatus(tr("enterFullCredentialsPrompt", { store: storeName }));
        return;
    }
    setLoginSettingsStatus(tr("testingAndOpeningTabStatus", { store: storeName }));
    chrome.runtime.sendMessage({ action: "testRelogin", mall, accountId }, response => {
        if (chrome.runtime.lastError) {
            setLoginSettingsStatus(tr("sendRequestError", { error: chrome.runtime.lastError.message }));
        } else if (response?.error) {
            setLoginSettingsStatus(tr("testFailedError", { error: response.error }));
        } else if (response?.ok) {
            setLoginSettingsStatus(tr("openedBgTabStatus", { store: storeName }));
        } else {
            chrome.storage.local.get("autoReloginStatus", state => {
                if (chrome.runtime.lastError) {
                    setLoginSettingsStatus(tr("cannotStartLoginError", { error: chrome.runtime.lastError.message }));
                } else {
                    setLoginSettingsStatus(
                        state.autoReloginStatus ||
                        tr("cannotStartLoginFallback")
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
document.getElementById("testPlutoReloginBtn").title = tr("testPlutoReloginTitle");
document.getElementById("testPlutoReloginBtn").setAttribute("aria-label", tr("testPlutoReloginTitle"));
document.getElementById("testLilithReloginBtn").title = tr("testLilithReloginTitle");
document.getElementById("testLilithReloginBtn").setAttribute("aria-label", tr("testLilithReloginTitle"));

for (const [buttonId, mall] of [
    ["testPlutoAccountsBtn", "plutomall"],
    ["testLilithAccountsBtn", "lilithstore"],
]) {
    document.getElementById(buttonId).addEventListener("click", async () => {
        try {
            await persistLoginAccounts({ validate: false });
        } catch (error) {
            setLoginSettingsStatus(tr("testCannotStartError", { error: error.message }));
            return;
        }
        const storeName = mall === "plutomall" ? "Plutomall" : "Lilith Store";
        const accounts = accountsByMall[mall].filter(account =>
            account.username && account.password
        );
        if (!accounts.length) {
            setLoginSettingsStatus(tr("noFullStoreAccountsPrompt", { store: storeName }));
            return;
        }
        chrome.runtime.sendMessage({
            action: "testReloginSequence",
            mall,
            accountIds: accounts.map(account => account.id),
        }, response => {
            if (chrome.runtime.lastError) {
                setLoginSettingsStatus(tr("sendRequestError", { error: chrome.runtime.lastError.message }));
            } else if (response?.error) {
                setLoginSettingsStatus(tr("testCannotStartError", { error: response.error }));
            } else {
                setLoginSettingsStatus(tr("testingSequentialAccountsStatus", { count: accounts.length, store: storeName }));
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
    toggleAllConfigLabel.textContent = allSelected ? tr("deselectAll") : tr("selectAll");
    configSelectionCount.textContent = tr("selectedCountLabel", {
        selected: selectedCount,
        total: configSelectionCheckboxes.length,
    });
    toggleAllConfigButton.setAttribute(
        "aria-label",
        allSelected ? tr("deselectAllSettingsAria") : tr("selectAllSettingsAria")
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

async function collectAccountScopedSetting(settingName) {
    const keysByMall = {};
    const allKeys = [];
    for (const mall of ["plutomall", "lilithstore"]) {
        const accountIds = ["", ...accountsByMall[mall].map(account => account.id)];
        keysByMall[mall] = accountIds;
        allKeys.push(...accountIds.map(accountId => accountStorageKey(mall, accountId, settingName)));
    }
    const stored = allKeys.length > 0 ? await chrome.storage.local.get(allKeys) : {};
    const byAccount = { plutomall: {}, lilithstore: {} };
    for (const mall of ["plutomall", "lilithstore"]) {
        for (const accountId of keysByMall[mall]) {
            const key = accountStorageKey(mall, accountId, settingName);
            if (Object.prototype.hasOwnProperty.call(stored, key)) {
                byAccount[mall][accountId] = stored[key];
            }
        }
    }
    return byAccount;
}

document.getElementById("exportConfigBtn").addEventListener("click", async () => {
    const selectedKeys = [...document.querySelectorAll(".config-options input:checked")]
        .map(input => input.value);
    if (selectedKeys.length === 0) {
        configSettingsStatus.textContent = tr("selectAtLeastOneExport");
        return;
    }

    try {
        await persistLoginAccounts({ validate: false });
        const accountDataKeys = new Set(["favoriteRoleIds", "tokens"]);
        const storageKeys = selectedKeys.filter(key => !accountDataKeys.has(key));
        if (selectedKeys.includes("webhookEnabled") && !storageKeys.includes("webhookUrl")) {
            storageKeys.push("webhookUrl");
        }
        if (selectedKeys.includes("autoCheckMode") && !storageKeys.includes("utcResetDay")) {
            storageKeys.push("utcResetDay");
        }
        if (selectedKeys.includes("rewardTotals") && !storageKeys.includes("weeklyStats")) {
            storageKeys.push("weeklyStats");
        }
        const storedSettings = storageKeys.length > 0
            ? await chrome.storage.local.get(storageKeys)
            : {};
        const currentSettings = {
            drawFavoritesOnly: Boolean(drawFavoritesOnlyCheckbox?.checked),
            autoReloginEnabled: autoReloginCheckbox.checked,
            autoCheckIntervalMinutes: Number(autoCheckIntervalInput.value),
            autoCheckEnabled: autoCheckCheckbox.checked,
            autoCheckMode: document.querySelector('input[name="autoCheckMode"]:checked')?.value || "utcReset",
            theme: currentThemeSetting,
            language: currentLanguage,
            utcResetDay: utcResetDaySelect?.value || "5",
            webhookEnabled: Boolean(document.getElementById("webhookEnabled")?.checked),
        };
        const settings = buildExportSettings(selectedKeys, storedSettings, currentSettings);
        if (settings.storeAccounts && typeof settings.storeAccounts === "object") {
            const passphrase = configPassphraseInput?.value || "";
            if (passphrase.length > 0) {
                settings.encryptedStoreAccounts = await encryptJsonWithPassphrase(settings.storeAccounts, passphrase);
                delete settings.storeAccounts;
            } else {
                settings.storeAccounts = stripStoreAccountsPasswords(settings.storeAccounts);
            }
        }
        if (selectedKeys.includes("favoriteRoleIds")) {
            settings.favoriteRoleIds = await collectAccountScopedSetting("favoriteRoleIds");
        }
        if (selectedKeys.includes("tokens")) {
            settings.tokens = await collectAccountScopedSetting("tokens");
        }
        if (Object.keys(settings).length === 0) {
            configSettingsStatus.textContent = tr("noSavedSettingsInSelection");
            return;
        }
        for (const [key, value] of Object.entries(settings)) {
            if (!CONFIG_SETTING_VALIDATORS[key](value)) {
                throw new Error(tr("invalidSettingValueError", { key }));
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
        configSettingsStatus.textContent = tr("exportedSettingsStatus", { count: Object.keys(settings).length });
    } catch (error) {
        configSettingsStatus.textContent = tr("exportConfigError", { error: error.message });
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
            throw new Error(tr("unsupportedConfigFormatError"));
        }

        const entries = Object.entries(config.settings);
        if (
            entries.length === 0 ||
            entries.some(([key, value]) =>
                !Object.prototype.hasOwnProperty.call(CONFIG_SETTING_VALIDATORS, key) ||
                !CONFIG_SETTING_VALIDATORS[key](value)
            )
        ) {
            throw new Error(tr("invalidConfigSettingsError"));
        }

        const importedSettings = Object.fromEntries(entries);
        const importedSettingCount = entries.length;
        if (importedSettings.encryptedStoreAccounts) {
            const passphrase = configPassphraseInput?.value ||
                window.prompt(tr("encryptedConfigPrompt")) || "";
            if (!passphrase) {
                throw new Error(tr("passphraseRequiredError"));
            }
            const decryptedAccounts = await decryptJsonWithPassphrase(importedSettings.encryptedStoreAccounts, passphrase, currentLanguage);
            if (!CONFIG_SETTING_VALIDATORS.storeAccounts(decryptedAccounts)) {
                throw new Error(tr("invalidDecryptedAccountsError"));
            }
            importedSettings.storeAccounts = decryptedAccounts;
            delete importedSettings.encryptedStoreAccounts;
        }
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
                        throw new Error(tr("legacyAccountMissingPairError", { store: mall === "plutomall" ? "Plutomall" : "Lilith Store" }));
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
        if (Object.prototype.hasOwnProperty.call(importedSettings, "language")) {
            applyLanguage(importedSettings.language, false);
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "drawFavoritesOnly") && drawFavoritesOnlyCheckbox) {
            drawFavoritesOnlyCheckbox.checked = importedSettings.drawFavoritesOnly;
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "autoCheckEnabled")) {
            autoCheckCheckbox.checked = importedSettings.autoCheckEnabled;
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "autoCheckMode")) {
            applyAutoCheckMode(importedSettings.autoCheckMode);
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "utcResetDay") && utcResetDaySelect) {
            utcResetDaySelect.value = String(importedSettings.utcResetDay);
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "autoCheckIntervalMinutes")) {
            autoCheckIntervalInput.value = String(importedSettings.autoCheckIntervalMinutes);
            updateIntervalPresetActive(Number(importedSettings.autoCheckIntervalMinutes));
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "autoReloginEnabled")) {
            autoReloginCheckbox.checked = importedSettings.autoReloginEnabled;
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "theme")) {
            applyTheme(importedSettings.theme);
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "webhookEnabled") && webhookEnabledCheckbox) {
            webhookEnabledCheckbox.checked = importedSettings.webhookEnabled;
            if (webhookToggleLabel) {
                webhookToggleLabel.textContent = importedSettings.webhookEnabled ? tr("toggleOn") : tr("toggleOff");
            }
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "webhookUrl") && webhookUrlInput) {
            webhookUrlInput.value = importedSettings.webhookUrl;
        }
        if (
            Object.prototype.hasOwnProperty.call(importedSettings, "rewardTotals") ||
            Object.prototype.hasOwnProperty.call(importedSettings, "weeklyStats") ||
            Object.prototype.hasOwnProperty.call(importedSettings, "language")
        ) {
            await renderRewardTotals();
        }
        updateSwitchToggleLabels();
        if (Object.prototype.hasOwnProperty.call(importedSettings, "storeAccounts")) {
            accountsByMall = importedSettings.storeAccounts;
            renderAccountRows("plutomall");
            renderAccountRows("lilithstore");
            await renderActiveAccountPicker(getSelectedMall());
        } else if (Object.prototype.hasOwnProperty.call(importedSettings, "language")) {
            renderAccountRows("plutomall");
            renderAccountRows("lilithstore");
            await renderActiveAccountPicker(getSelectedMall());
        }
        if (importedFavorites || importedTokens || Object.prototype.hasOwnProperty.call(importedSettings, "language")) {
            await renderCache(getSelectedMall());
        }
        configSettingsStatus.textContent = tr("importedSettingsStatus", { count: importedSettingCount, file: file.name });
    } catch (error) {
        configSettingsStatus.textContent = tr("importConfigError", { error: error.message });
    } finally {
        importConfigFile.value = "";
    }
});


// --- Auto Check Mode & UTC Reset Setting ---
for (const radio of autoCheckModeRadios) {
    radio.addEventListener("change", async () => {
        if (!radio.checked) return;
        const mode = radio.value;
        applyAutoCheckMode(mode);
        try {
            await chrome.storage.local.set({ autoCheckMode: mode });
        } catch (error) {
            console.error("Could not save autoCheckMode:", error);
        }
    });
}

if (utcResetDaySelect) {
    utcResetDaySelect.addEventListener("change", async () => {
        try {
            await chrome.storage.local.set({ utcResetDay: utcResetDaySelect.value });
        } catch (error) {
            console.error("Could not save utcResetDay:", error);
        }
    });
}

// --- Webhook Settings ---
const webhookEnabledCheckbox = document.getElementById("webhookEnabled");
const webhookToggleLabel = document.getElementById("webhookToggleLabel");
const webhookUrlInput = document.getElementById("webhookUrl");
const saveWebhookBtn = document.getElementById("saveWebhookBtn");
const testWebhookBtn = document.getElementById("testWebhookBtn");
const webhookSettingsStatus = document.getElementById("webhookSettingsStatus");

function setWebhookStatus(msg) {
    if (webhookSettingsStatus) {
        webhookSettingsStatus.textContent = msg;
        setTimeout(() => {
            if (webhookSettingsStatus.textContent === msg) {
                webhookSettingsStatus.textContent = "";
            }
        }, 4000);
    }
}

if (webhookEnabledCheckbox && webhookUrlInput) {
    chrome.storage.local.get(["webhookEnabled", "webhookUrl"], data => {
        webhookEnabledCheckbox.checked = Boolean(data.webhookEnabled);
        if (webhookToggleLabel) {
            webhookToggleLabel.textContent = data.webhookEnabled ? tr("toggleOn") : tr("toggleOff");
        }
        webhookUrlInput.value = data.webhookUrl || "";
    });

    webhookEnabledCheckbox.addEventListener("change", async () => {
        const enabled = webhookEnabledCheckbox.checked;
        if (webhookToggleLabel) {
            webhookToggleLabel.textContent = enabled ? tr("toggleOn") : tr("toggleOff");
        }
        await chrome.storage.local.set({ webhookEnabled: enabled });
        setWebhookStatus(enabled ? tr("webhookEnabledStatus") : tr("webhookDisabledStatus"));
    });

    if (saveWebhookBtn) {
        saveWebhookBtn.addEventListener("click", async () => {
            const urlText = webhookUrlInput.value.trim();
            await chrome.storage.local.set({ webhookUrl: urlText });
            const count = parseWebhookUrls(urlText).length;
            setWebhookStatus(count > 0 ? tr("webhookSavedCountStatus", { count }) : tr("webhookSavedEmptyStatus"));
        });
    }

    function handleTestWebhook(btn) {
        btn.disabled = true;
        setWebhookStatus(tr("webhookSendingTest"));
        const currentVal = webhookUrlInput.value.trim();
        chrome.runtime.sendMessage({ action: "testWebhook", url: currentVal }, res => {
            btn.disabled = false;
            if (chrome.runtime.lastError) {
                setWebhookStatus(tr("webhookExtError", { error: chrome.runtime.lastError.message }));
                return;
            }
            if (res?.ok) {
                const success = res.successCount ?? 1;
                const total = res.totalCount ?? success;
                setWebhookStatus(tr("webhookTestSuccess", { success, total }));
            } else {
                setWebhookStatus(tr("webhookTestFailed", { error: res?.error || tr("webhookCheckUrlFallback") }));
            }
        });
    }

    if (testWebhookBtn) {
        testWebhookBtn.addEventListener("click", () => handleTestWebhook(testWebhookBtn));
    }
}

// --- Reward Totals Summary & Weekly Leaderboard ---
const rewardStatsModeRadios = [...document.querySelectorAll('input[name="rewardStatsMode"]')];

function getRewardStatsMode() {
    return document.querySelector('input[name="rewardStatsMode"]:checked')?.value || "weekly";
}

for (const radio of rewardStatsModeRadios) {
    radio.addEventListener("change", () => {
        if (radio.checked) void renderRewardTotals();
    });
}

async function renderRewardTotals() {
    const container = document.getElementById("rewardTotalsList");
    if (!container) return;
    const leaderboardWrap = document.getElementById("weeklyLeaderboardWrap");
    const leaderboardList = document.getElementById("weeklyLeaderboardList");
    const mode = getRewardStatsMode();
    const data = await chrome.storage.local.get(["rewardTotals", "weeklyStats"]);
    const currentWeek = getCurrentWeekKey();
    const isCurrentWeekStats = data.weeklyStats?.weekKey === currentWeek;

    const rawTotals = mode === "weekly"
        ? (isCurrentWeekStats ? (data.weeklyStats?.rewardTotals || {}) : {})
        : (data.rewardTotals || {});
    const activeTotals = normalizeTranslatedRewards(rawTotals, currentLanguage);

    if (leaderboardWrap) {
        leaderboardWrap.hidden = mode !== "weekly";
    }

    const entries = Object.entries(activeTotals).sort((a, b) => b[1] - a[1]);
    container.replaceChildren();
    if (entries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "login-note";
        empty.textContent = mode === "weekly"
            ? tr("noRewardsWeekly")
            : tr("noRewardsAllTime");
        container.appendChild(empty);
    } else {
        for (const [name, count] of entries) {
            const row = document.createElement("div");
            row.className = "reward-total-item";
            const countEl = document.createElement("span");
            countEl.className = "reward-total-count";
            countEl.textContent = String(count);
            const nameEl = document.createElement("span");
            nameEl.className = "reward-total-name";
            nameEl.textContent = name;
            row.append(countEl, nameEl);
            container.appendChild(row);
        }
    }

    if (mode === "weekly" && leaderboardList) {
        leaderboardList.replaceChildren();
        const scoresObj = isCurrentWeekStats ? (data.weeklyStats?.characterScores || {}) : {};
        const ranked = Object.values(scoresObj)
            .filter(item => item && item.score > 0)
            .sort((a, b) => (b.score - a.score) || ((b.draws || 0) - (a.draws || 0)));

        if (ranked.length === 0) {
            const empty = document.createElement("div");
            empty.className = "login-note";
            empty.textContent = tr("noLeaderboardData");
            leaderboardList.appendChild(empty);
        } else {
            ranked.forEach((charEntry, index) => {
                const row = document.createElement("div");
                row.className = "leaderboard-item";

                const rankEl = document.createElement("span");
                rankEl.className = "leaderboard-rank";
                rankEl.textContent = `#${index + 1}`;

                const infoEl = document.createElement("div");
                infoEl.className = "leaderboard-info";

                const nameEl = document.createElement("div");
                nameEl.className = "leaderboard-name";
                const svrLabel = charEntry.svrId ? ` (#${charEntry.svrId})` : "";
                nameEl.textContent = `${charEntry.name || charEntry.roleId}${svrLabel}`;

                const subEl = document.createElement("div");
                subEl.className = "leaderboard-sub";
                const normalizedRewards = normalizeTranslatedRewards(charEntry.rewards || {}, currentLanguage);
                const rewardSummary = Object.entries(normalizedRewards)
                    .map(([rName, rCount]) => `x${rCount} ${rName}`)
                    .join(", ");
                subEl.textContent = rewardSummary;
                subEl.title = rewardSummary;

                infoEl.append(nameEl, subEl);

                const scoreEl = document.createElement("span");
                scoreEl.className = "leaderboard-score";
                scoreEl.textContent = tr("pointsSuffix", { score: Number(charEntry.score).toLocaleString(getLocaleTag()) });

                row.append(rankEl, infoEl, scoreEl);
                leaderboardList.appendChild(row);
            });
        }
    }
}

const exportRewardsCsvBtn = document.getElementById("exportRewardsCsvBtn");
if (exportRewardsCsvBtn) {
    exportRewardsCsvBtn.addEventListener("click", async () => {
        const mode = getRewardStatsMode();
        const data = await chrome.storage.local.get(["rewardTotals", "weeklyStats"]);
        const currentWeek = getCurrentWeekKey();
        const isCurrentWeekStats = data.weeklyStats?.weekKey === currentWeek;
        const rawTotals = mode === "weekly"
            ? (isCurrentWeekStats ? (data.weeklyStats?.rewardTotals || {}) : {})
            : (data.rewardTotals || {});
        const activeTotals = normalizeTranslatedRewards(rawTotals, currentLanguage);
        const entries = Object.entries(activeTotals).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
            alert(tr("noRewardsToExport"));
            return;
        }
        const rows = [
            [tr("csvScope"), tr("csvReward"), tr("csvQuantity")],
            ...entries.map(([name, count]) => [
                mode === "weekly" ? tr("csvWeekPrefix", { week: currentWeek }) : tr("csvAllTime"),
                name,
                count,
            ]),
        ];
        if (mode === "weekly" && isCurrentWeekStats && data.weeklyStats?.characterScores) {
            const ranked = Object.values(data.weeklyStats.characterScores)
                .filter(item => item && item.score > 0)
                .sort((a, b) => (b.score - a.score) || ((b.draws || 0) - (a.draws || 0)));
            if (ranked.length > 0) {
                rows.push(
                    [],
                    [
                        tr("csvRank"),
                        tr("csvCharacter"),
                        tr("csvServer"),
                        tr("csvLuckScore"),
                        tr("csvRewardDetails"),
                    ]
                );
                ranked.forEach((c, idx) => {
                    const normalizedRewards = normalizeTranslatedRewards(c.rewards || {}, currentLanguage);
                    const detail = Object.entries(normalizedRewards).map(([n, cnt]) => `x${cnt} ${n}`).join("; ");
                    rows.push([idx + 1, c.name || c.roleId, c.svrId || "", c.score, detail]);
                });
            }
        }
        exportToCsv(`rok-reward-summary-${mode}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    });
}

const clearRewardsBtn = document.getElementById("clearRewardsBtn");
if (clearRewardsBtn) {
    clearRewardsBtn.addEventListener("click", async () => {
        if (!confirm(tr("confirmClearRewards"))) return;
        await chrome.storage.local.remove(["rewardTotals", "weeklyStats"]);
        await renderRewardTotals();
    });
}
renderRewardTotals();

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.language) {
        applyLanguage(changes.language.newValue || DEFAULT_LANGUAGE);
    }
    if (changes.drawFavoritesOnly && drawFavoritesOnlyCheckbox) {
        drawFavoritesOnlyCheckbox.checked = changes.drawFavoritesOnly.newValue === true;
        updateSwitchToggleLabels();
    }
    if (changes.autoCheckEnabled) {
        autoCheckCheckbox.checked = changes.autoCheckEnabled.newValue !== false;
        updateSwitchToggleLabels();
    }
    if (changes.autoCheckMode) {
        applyAutoCheckMode(changes.autoCheckMode.newValue || "utcReset");
    }
    if (changes.utcResetDay && utcResetDaySelect) {
        utcResetDaySelect.value = String(changes.utcResetDay.newValue);
    }
    if (changes.autoCheckIntervalMinutes) {
        const val = changes.autoCheckIntervalMinutes.newValue;
        if (Number.isSafeInteger(val)) {
            autoCheckIntervalInput.value = String(val);
            updateIntervalPresetActive(val);
        }
    }
    if (changes.theme) {
        applyTheme(changes.theme.newValue || "system");
    }
    if (changes.autoReloginEnabled) {
        autoReloginCheckbox.checked = changes.autoReloginEnabled.newValue === true;
        updateSwitchToggleLabels();
    }
    if (changes.autoReloginStatus?.newValue) {
        setLoginSettingsStatus(changes.autoReloginStatus.newValue);
    }
    if (changes.currentMall?.newValue) {
        const newMall = changes.currentMall.newValue;
        if (newMall !== getSelectedMall()) {
            syncRadio(newMall);
            void renderActiveAccountPicker(newMall);
            void renderCache(newMall);
        }
    }
    const mall = getSelectedMall();
    const accountId = getSelectedAccountId();
    const drawLogKey = accountStorageKey(mall, accountId, "drawLog");
    if (changes[drawLogKey]) {
        renderDrawLog(changes[drawLogKey].newValue);
    }
    const isDrawingKey = accountStorageKey(mall, accountId, "isDrawing");
    if (changes[isDrawingKey]) {
        const isDrawing = changes[isDrawingKey].newValue === true;
        const btn = document.getElementById("drawNowBtn");
        if (btn) {
            btn.disabled = isDrawing;
            btn.textContent = isDrawing ? tr("drawingBtn") : tr("drawNowBtn");
        }
    }
    const drawsLeftKey = accountStorageKey(mall, accountId, "drawsLeft");
    if (changes.rewardTotals || changes.weeklyStats) {
        renderRewardTotals();
    }
    if (changes[drawsLeftKey]) {
        renderDrawsLeft(changes[drawsLeftKey].newValue);
    }
    if (
        !refreshInFlight && (
            changes[accountStorageKey(mall, accountId, "token")] ||
            changes[accountStorageKey(mall, accountId, "isValidToken")] ||
            changes[accountStorageKey(mall, accountId, "roles")]
        )
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
        setStatus(tr("openStoreSuccess"), null);
    } catch (error) {
        setStatus(tr("openStoreError", { error: error.message }));
    }
});

document.getElementById("refreshCharsBtn").addEventListener("click", async () => {
    try {
        await persistLoginAccounts({ validate: false });
        await fetchAndRender(getSelectedMall());
    } catch (error) {
        setStatus(tr("refreshError", { error: error.message }));
    }
});

document.getElementById("drawNowBtn").addEventListener("click", async () => {
    try {
        await persistLoginAccounts({ validate: false });
    } catch (error) {
        setStatus(tr("drawError", { error: error.message }));
        return;
    }
    const mall = getSelectedMall();
    const accountId = getSelectedAccountId();
    const btn = document.getElementById("drawNowBtn");
    btn.disabled = true;
    btn.textContent = tr("drawingBtn");
    showLog();
    logEl.textContent = tr("startingDraw");

    chrome.runtime.sendMessage({ action: "drawNow", mall, accountId }, (res) => {
        btn.disabled = false;
        btn.textContent = tr("drawNowBtn");
        if (chrome.runtime.lastError) {
            setStatus(chrome.runtime.lastError.message);
            return;
        }
        if (res?.error) {
            const isExp = /hết hạn|expired|invalid|401|403/i.test(res.error);
            setStatus(isExp ? tr("tokenExpired") : (res.error.length > 25 ? res.error.slice(0, 25) + "…" : res.error), false);
            return;
        }
        if (res?.drawsLeft === 0) {
            logEl.textContent = tr("checkCompleteNoDraws");
            return;
        }
        void renderCache(mall);
    });
});

(async () => {
    try {
        const settings = await chrome.storage.local.get([
            "language",
            "drawFavoritesOnly",
            "autoCheckEnabled",
            "autoCheckMode",
            "autoCheckIntervalMinutes",
            "utcResetDay",
            "autoReloginEnabled",
            "lilithstoreUsername",
            "lilithstorePassword",
            "plutomallUsername",
            "plutomallPassword",
            "autoReloginStatus",
            "theme",
        ]);
        applyLanguage(settings.language || DEFAULT_LANGUAGE, false);
        applyTheme(settings.theme || "system");
        if (drawFavoritesOnlyCheckbox) {
            drawFavoritesOnlyCheckbox.checked = settings.drawFavoritesOnly === true;
        }
        autoCheckCheckbox.checked = settings.autoCheckEnabled !== false;
        applyAutoCheckMode(settings.autoCheckMode || "utcReset");
        if (utcResetDaySelect && settings.utcResetDay !== undefined) {
            utcResetDaySelect.value = String(settings.utcResetDay);
        }
        autoCheckIntervalInput.value = Number.isSafeInteger(settings.autoCheckIntervalMinutes) &&
            settings.autoCheckIntervalMinutes >= 1
            ? String(settings.autoCheckIntervalMinutes)
            : "60";
        updateIntervalPresetActive(Number(autoCheckIntervalInput.value));
        autoReloginCheckbox.checked = settings.autoReloginEnabled === true;
        updateSwitchToggleLabels();
        if (settings.autoReloginStatus) setLoginSettingsStatus(settings.autoReloginStatus);
        await loadSavedLoginCredentials();

        const mall = await detectMall();
        await renderActiveAccountPicker(mall);
        await renderCache(mall);
    } catch (error) {
        setStatus(tr("popupInitError", { error: error.message }));
        setCharsError(error.message);
    }
})();

const drawAllBtn = document.getElementById("drawAllBtn");
if (drawAllBtn) {
    drawAllBtn.addEventListener("click", async () => {
        drawAllBtn.disabled = true;
        drawAllBtn.textContent = tr("drawingAllBtn");
        showLog();
        logEl.textContent = tr("startingDrawAll");
        chrome.runtime.sendMessage({ action: "drawAll" }, res => {
            drawAllBtn.disabled = false;
            drawAllBtn.textContent = tr("drawAllBtn");
            if (chrome.runtime.lastError) {
                setStatus(chrome.runtime.lastError.message);
                return;
            }
            if (res?.error) {
                setStatus(res.error, false);
                return;
            }
            void renderCache(getSelectedMall());
        });
    });
}
