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
    crown: `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M2.5 12h11v1.5h-11zM14 4l-3 3-3-4.5L5 7 2 4l1 7h10z"/></svg>`,
    medal: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="10" r="4.5"/><path d="M5.5 2l2.5 4 2.5-4M4 2h8"/></svg>`,
    gem: `<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="8 1.5 14.5 5.5 8 14.5 1.5 5.5 8 1.5"/><line x1="1.5" y1="5.5" x2="14.5" y2="5.5"/></svg>`,
    clock: `<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><polyline points="8 4.5 8 8 10.5 9.5"/></svg>`,
    chest: `<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="12" height="8" rx="1.5"/><line x1="2" y1="8" x2="14" y2="8"/></svg>`,
    star: `<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="8 1.5 10.2 5.8 15 6.5 11.5 9.9 12.3 14.5 8 12.2 3.7 14.5 4.5 9.9 1 6.5 5.8 5.8 8 1.5" /></svg>`,
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
    const activeCaptureBtn = document.getElementById("captureBtn");
    if (activeCaptureBtn && activeCaptureBtn.classList.contains("is-loading")) {
        const span = activeCaptureBtn.querySelector("span");
        if (span) span.textContent = tr("gettingToken");
    }
    applyTheme(currentThemeSetting);
    updateSwitchToggleLabels();
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
    if (typeof discordWebhookToggleLabel !== "undefined" && discordWebhookToggleLabel && typeof discordWebhookEnabledCheckbox !== "undefined" && discordWebhookEnabledCheckbox) {
        discordWebhookToggleLabel.textContent = discordWebhookEnabledCheckbox.checked ? tr("toggleOn") : tr("toggleOff");
    }
    if (typeof telegramWebhookToggleLabel !== "undefined" && telegramWebhookToggleLabel && typeof telegramWebhookEnabledCheckbox !== "undefined" && telegramWebhookEnabledCheckbox) {
        telegramWebhookToggleLabel.textContent = telegramWebhookEnabledCheckbox.checked ? tr("toggleOn") : tr("toggleOff");
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
const captureBtn = document.getElementById("captureBtn");
let captureLoadingTimer = null;

function setCaptureBtnLoading(isLoading) {
    if (!captureBtn) return;
    if (captureLoadingTimer) {
        clearTimeout(captureLoadingTimer);
        captureLoadingTimer = null;
    }
    const span = captureBtn.querySelector("span");
    if (isLoading) {
        captureBtn.disabled = true;
        captureBtn.classList.add("is-loading");
        if (span) span.textContent = tr("gettingToken");
        captureLoadingTimer = setTimeout(() => {
            setCaptureBtnLoading(false);
        }, 90000);
    } else {
        captureBtn.disabled = false;
        captureBtn.classList.remove("is-loading");
        if (span) span.textContent = tr("captureBtn");
    }
}

async function syncCaptureBtnLoadingState(mall = getSelectedMall(), accountId = getSelectedAccountId()) {
    try {
        const session = await chrome.storage.session.get([
            "autoReloginStartedAt",
            "autoReloginMall",
            "autoReloginAccountId",
        ]);
        const isRunning = Number.isFinite(session.autoReloginStartedAt) &&
            Date.now() - session.autoReloginStartedAt < 3 * 60 * 1000 &&
            session.autoReloginMall === mall &&
            session.autoReloginAccountId === accountId;
        setCaptureBtnLoading(isRunning);
    } catch {
        setCaptureBtnLoading(false);
    }
}
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

let toastTimer = null;

function showToast({ type = "info", title = "", message = "", duration = 4000 } = {}) {
    const card = document.getElementById("toastCard");
    const titleEl = document.getElementById("toastTitle");
    const msgEl = document.getElementById("toastMessage");
    if (!card || !msgEl) return;

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }

    card.classList.remove("is-success", "is-error", "is-info");
    const normalizedType = type === "success" ? "is-success" : (type === "error" || type === "failed" ? "is-error" : "is-info");
    card.classList.add(normalizedType);

    titleEl.textContent = title || "";
    msgEl.textContent = message || "";
    card.hidden = false;

    if (duration > 0) {
        toastTimer = setTimeout(() => {
            hideToast();
        }, duration);
    }
}

function hideToast() {
    const card = document.getElementById("toastCard");
    if (!card) return;
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    card.hidden = true;
}

document.getElementById("toastCloseBtn")?.addEventListener("click", hideToast);

let confirmModalResolver = null;

function showConfirmModal({ title = "", message = "", confirmText = "", cancelText = "" } = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById("confirmModal");
        const titleEl = document.getElementById("confirmModalTitle");
        const msgEl = document.getElementById("confirmModalMessage");
        const confirmBtn = document.getElementById("confirmModalConfirmBtn");
        const cancelBtn = document.getElementById("confirmModalCancelBtn");

        if (!modal || !confirmBtn || !cancelBtn) {
            resolve(false);
            return;
        }

        // Clean up previous resolver if modal was reopened before resolving
        if (confirmModalResolver) {
            confirmModalResolver(false);
            confirmModalResolver = null;
        }

        confirmModalResolver = resolve;

        if (titleEl) titleEl.textContent = title || tr("confirmDeleteTitle");
        if (msgEl) msgEl.textContent = message || "";
        confirmBtn.textContent = confirmText || tr("modalDeleteBtn");
        cancelBtn.textContent = cancelText || tr("modalCancelBtn");

        modal.hidden = false;
        cancelBtn.focus();
    });
}

function closeConfirmModal(result = false) {
    const modal = document.getElementById("confirmModal");
    if (modal) {
        modal.hidden = true;
    }
    if (confirmModalResolver) {
        const resolve = confirmModalResolver;
        confirmModalResolver = null;
        resolve(Boolean(result));
    }
}

document.getElementById("confirmModalConfirmBtn")?.addEventListener("click", () => {
    closeConfirmModal(true);
});

document.getElementById("confirmModalCancelBtn")?.addEventListener("click", () => {
    closeConfirmModal(false);
});

document.getElementById("confirmModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("confirmModal")) {
        closeConfirmModal(false);
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const shareModal = document.getElementById("shareModal");
        if (shareModal && !shareModal.hidden) {
            e.preventDefault();
            closeShareModal();
            return;
        }
        const modal = document.getElementById("confirmModal");
        if (modal && !modal.hidden) {
            e.preventDefault();
            closeConfirmModal(false);
        }
    }
});

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

function renderDrawLog(drawLog, shouldShow = false) {
    if (drawLog?.length) {
        if (shouldShow) showLog();
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

async function renderChars(roles, mall, accountId = getSelectedAccountId(), viewVersion = accountViewVersion, preloadedFavorites = null) {
    cachedRoles = Array.isArray(roles) ? roles : [];
    cachedMall = mall;
    cachedAccountId = accountId;
    const renderVersion = ++charRenderVersion;
    const favoritesKey = accountStorageKey(mall, accountId, "favoriteRoleIds");
    let favoriteOrder;
    try {
        let rawFavorites = preloadedFavorites;
        if (rawFavorites === null) {
            const savedFavorites = await chrome.storage.local.get(favoritesKey);
            if (
                renderVersion !== charRenderVersion ||
                !isCurrentAccountView(mall, accountId, viewVersion)
            ) return;
            rawFavorites = savedFavorites[favoritesKey];
        }
        favoriteOrder = Array.isArray(rawFavorites) ? rawFavorites.map(String) : [];
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

    const parsedQuery = parseSearchQuery(charSearchInput?.value);
    const displayRoles = parsedQuery
        ? sortedRoles.filter(role => matchesSearch(role, null, parsedQuery))
        : sortedRoles;

    if (displayRoles.length === 0) {
        if (sortedRoles.length === 0) {
            setCharsEmpty(tr("noCharsFound"));
        } else {
            setCharsEmpty(tr("noMatchingChars"));
        }
        return;
    }

    const fragment = document.createDocumentFragment();
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
        fragment.appendChild(div);
    }
    charList.appendChild(fragment);
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
        const res = await chrome.runtime.sendMessage({ action: "getCache", mall, accountId });

        if (!isCurrentAccountView(mall, accountId, viewVersion)) return;
        if (res?.error) throw new Error(res.error);
        const drawLogKey = accountStorageKey(mall, accountId, "drawLog");
        const tokenKey = accountStorageKey(mall, accountId, "token");
        const isDrawingKey = accountStorageKey(mall, accountId, "isDrawing");
        const favoritesKey = accountStorageKey(mall, accountId, "favoriteRoleIds");
        const storeData = await chrome.storage.local.get([drawLogKey, tokenKey, isDrawingKey, favoritesKey]);
        if (!isCurrentAccountView(mall, accountId, viewVersion)) return;

        const drawLog = storeData[drawLogKey];
        renderDrawLog(drawLog);
        if (!res?.hasToken) {
            setStatus(tr("noToken"), null);
            setCharsEmpty(tr("noDataCapturePrompt"));
            tokenBox.value = "";
            totalDrawsEl.textContent = tr("drawsRemainingPlaceholder");
            return;
        }

        const token = storeData[tokenKey];
        const tokenEval = evaluateTokenStatus(token, res.isValidToken);
        setStatus(tokenEval.text, tokenEval.state);
        tokenBox.value = token || "";

        renderDrawsLeft(res.drawsLeft);

        const isDrawing = storeData[isDrawingKey];
        const drawBtn = document.getElementById("drawNowBtn");
        if (drawBtn) {
            drawBtn.disabled = !!isDrawing;
            drawBtn.textContent = isDrawing ? tr("drawingBtn") : tr("drawNowBtn");
        }

        if (res.roles?.length > 0) {
            await renderChars(res.roles, mall, accountId, viewVersion, storeData[favoritesKey] ?? []);
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
    try {
        const res = await chrome.runtime.sendMessage({ action: "refresh", mall: m, accountId });
        refreshInFlight = false;
        if (!isCurrentAccountView(m, accountId, viewVersion)) {
            return null;
        }
        if (!res) {
            setStatus(tr("responseError"), false);
            setCharsError(tr("extensionEmptyResponse"));
            throw new Error(tr("extensionEmptyResponse"));
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
            throw new Error(res.error);
        }

        const tokenKey = accountStorageKey(m, accountId, "token");
        const favoritesKey = accountStorageKey(m, accountId, "favoriteRoleIds");
        let favoritesData = null;
        try {
            const data = await chrome.storage.local.get([tokenKey, favoritesKey]);
            if (!isCurrentAccountView(m, accountId, viewVersion)) {
                return null;
            }
            tokenBox.value = data[tokenKey] || "";
            favoritesData = data[favoritesKey] ?? [];
        } catch (error) {
            if (!isCurrentAccountView(m, accountId, viewVersion)) {
                return null;
            }
            setStatus(tr("errorPrefix", { error: error.message }), false);
            throw error;
        }

        const status = evaluateTokenStatus(tokenBox.value, true);
        setStatus(status.text, status.state);
        renderDrawsLeft(res.totalDrawsLeft);

        const roles = Array.isArray(res.roles) ? res.roles : [];
        if (roles.length > 0) {
            await renderChars(roles, m, accountId, viewVersion, favoritesData);
        } else {
            cachedRoles = [];
            setCharsEmpty(tr("noCharsFound"));
        }

        return res;
    } catch (err) {
        refreshInFlight = false;
        if (!isCurrentAccountView(m, accountId, viewVersion)) return null;
        setStatus(tr("connectionError"), false);
        setCharsError(err.message || tr("extensionConnectionError"));
        throw err;
    }
}

async function openCharacterHistory(roleId, roleName) {
    const mall = getSelectedMall();
    showHistoryLoading(roleName);
    try {
        const res = await chrome.runtime.sendMessage({
            action: "getDrawHistory",
            roleId,
            mall,
            accountId: getSelectedAccountId(),
        });
        if (res?.error || !res?.character || !res?.history) {
            showHistoryError(res?.error || tr("invalidHistoryResponse"));
            return;
        }
        showHistory(res.character, res.history);
    } catch (err) {
        showHistoryError(err.message);
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
        void syncCaptureBtnLoadingState(mall);
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
        remove.addEventListener("click", async (e) => {
            e.stopPropagation();
            const displayName = account.username ? `"${account.username}"` : tr("unnamedAccount");
            const confirmed = await showConfirmModal({
                title: tr("confirmDeleteTitle"),
                message: tr("confirmDeleteAccount", { name: displayName }),
                confirmText: tr("modalDeleteBtn"),
                cancelText: tr("modalCancelBtn"),
            });
            if (!confirmed) return;
            accountExpandedState.delete(account.id);
            accountsByMall[mall] = accountsByMall[mall].filter(item => item.id !== account.id);
            renderAccountRows(mall);
            void renderActiveAccountPicker(getSelectedMall());
            showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyDataCleared") });
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
    void syncCaptureBtnLoadingState(mall, activeAccountSelect.value);
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
    void syncCaptureBtnLoadingState(mall, accountId);
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
        const statusMsg = autoReloginCheckbox.checked
            ? tr("accountsSavedAutoStatus")
            : tr("credentialsSavedStatus");
        setLoginSettingsStatus(statusMsg);
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyAccountsSaved") });
    } catch (error) {
        setLoginSettingsStatus(tr("saveGenericError", { error: error.message }));
        showToast({ type: "error", title: tr("notifyFailed"), message: tr("notifyAccountsSaveFailed", { error: error.message }) });
    }
});

document.getElementById("clearLoginBtn").addEventListener("click", async () => {
    const confirmed = await showConfirmModal({
        title: tr("confirmClearAccountsTitle"),
        message: tr("confirmClearAccounts"),
        confirmText: tr("modalDeleteBtn"),
        cancelText: tr("modalCancelBtn"),
    });
    if (!confirmed) {
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
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyDataCleared") });
    } catch (error) {
        try {
            const { autoReloginEnabled } = await chrome.storage.local.get("autoReloginEnabled");
            autoReloginCheckbox.checked = autoReloginEnabled === true;
        } catch (stateError) {
            console.error("Could not restore auto-relogin setting:", stateError);
        }
        setLoginSettingsStatus(tr("clearAccountsError", { error: error.message }));
        showToast({ type: "error", title: tr("notifyFailed"), message: tr("clearAccountsError", { error: error.message }) });
    }
});

async function testRelogin(mall, accountId, { fromHeader = false } = {}) {
    const storeName = mall === "lilithstore" ? "Lilith Store" : "Plutomall";
    try {
        await persistLoginAccounts({ validate: false });
    } catch (error) {
        setLoginSettingsStatus(tr("testCannotStartError", { error: error.message }));
        if (fromHeader) setStatus(tr("testCannotStartError", { error: error.message }));
        return;
    }
    if (!accountId) {
        const { activeAccountIds = {} } = await chrome.storage.local.get("activeAccountIds");
        accountId = mall === getSelectedMall()
            ? getSelectedAccountId()
            : activeAccountIds[mall] || accountsByMall[mall][0]?.id;
    }
    if (!accountId) {
        const promptMsg = tr("selectOrAddAccountPrompt", { store: storeName });
        setLoginSettingsStatus(promptMsg);
        if (fromHeader) {
            setStatus(promptMsg);
            showToast({ type: "error", title: tr("notifyFailed"), message: promptMsg });
            selectPopupTab("automation");
            selectLoginTab(mall);
        }
        return;
    }
    const account = accountsByMall[mall].find(item => item.id === accountId);
    if (!account?.username || !account.password) {
        const credsMsg = tr("enterFullCredentialsPrompt", { store: storeName });
        setLoginSettingsStatus(credsMsg);
        if (fromHeader) {
            setStatus(credsMsg);
            showToast({ type: "error", title: tr("notifyFailed"), message: credsMsg });
            selectPopupTab("automation");
            selectLoginTab(mall);
        }
        return;
    }

    if (fromHeader) {
        const stored = await chrome.storage.local.get("activeAccountIds");
        const activeAccountIds = stored.activeAccountIds &&
            typeof stored.activeAccountIds === "object" &&
            !Array.isArray(stored.activeAccountIds)
            ? stored.activeAccountIds
            : {};
        activeAccountIds[mall] = accountId;
        await chrome.storage.local.set({ activeAccountIds, currentMall: mall });
    }

    const isCurrentSelection = mall === getSelectedMall() && accountId === getSelectedAccountId();
    if (isCurrentSelection) {
        setCaptureBtnLoading(true);
    }
    setLoginSettingsStatus(tr("testingAndOpeningTabStatus", { store: storeName }));
    if (fromHeader) setStatus(tr("testingAndOpeningTabStatus", { store: storeName }));
    showToast({ type: "info", title: tr("notifyInfo"), message: tr("notifyLoginCheckStarted", { store: storeName }) });
    try {
        const response = await chrome.runtime.sendMessage({ action: "testRelogin", mall, accountId, isManual: true });
        if (response?.error) {
            if (isCurrentSelection) setCaptureBtnLoading(false);
            setLoginSettingsStatus(tr("testFailedError", { error: response.error }));
            if (fromHeader) setStatus(tr("testFailedError", { error: response.error }));
            showToast({ type: "error", title: tr("notifyFailed"), message: response.error });
        } else if (response?.ok) {
            setLoginSettingsStatus(tr("openedBgTabStatus", { store: storeName }));
            if (fromHeader) setStatus(tr("openedBgTabStatus", { store: storeName }));
        } else {
            if (isCurrentSelection) setCaptureBtnLoading(false);
            const state = await chrome.storage.local.get("autoReloginStatus");
            const fallbackMsg = state.autoReloginStatus || tr("cannotStartLoginFallback");
            setLoginSettingsStatus(fallbackMsg);
            if (fromHeader) setStatus(fallbackMsg);
        }
    } catch (err) {
        if (isCurrentSelection) setCaptureBtnLoading(false);
        const errMsg = err.message;
        setLoginSettingsStatus(tr("sendRequestError", { error: errMsg }));
        if (fromHeader) setStatus(tr("sendRequestError", { error: errMsg }));
        showToast({ type: "error", title: tr("notifyFailed"), message: errMsg });
    }
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
        showToast({ type: "info", title: tr("notifyInfo"), message: tr("notifyLoginCheckAllStarted", { count: accounts.length, store: storeName }) });
        try {
            const response = await chrome.runtime.sendMessage({
                action: "testReloginSequence",
                mall,
                accountIds: accounts.map(account => account.id),
            });
            if (response?.error) {
                setLoginSettingsStatus(tr("testCannotStartError", { error: response.error }));
                showToast({ type: "error", title: tr("notifyFailed"), message: response.error });
            } else {
                setLoginSettingsStatus(tr("testingSequentialAccountsStatus", { count: accounts.length, store: storeName }));
            }
        } catch (err) {
            setLoginSettingsStatus(tr("sendRequestError", { error: err.message }));
            showToast({ type: "error", title: tr("notifyFailed"), message: err.message });
        }
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
        if (selectedKeys.includes("discordWebhookEnabled") && !storageKeys.includes("discordWebhookUrl")) {
            storageKeys.push("discordWebhookUrl");
        }
        if (selectedKeys.includes("telegramWebhookEnabled") && !storageKeys.includes("telegramWebhookUrl")) {
            storageKeys.push("telegramWebhookUrl");
        }
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
            discordWebhookEnabled: Boolean(document.getElementById("discordWebhookEnabled")?.checked),
            telegramWebhookEnabled: Boolean(document.getElementById("telegramWebhookEnabled")?.checked),
            webhookEnabled: Boolean(document.getElementById("discordWebhookEnabled")?.checked || document.getElementById("telegramWebhookEnabled")?.checked),
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
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyConfigExported") });
    } catch (error) {
        configSettingsStatus.textContent = tr("exportConfigError", { error: error.message });
        showToast({ type: "error", title: tr("notifyFailed"), message: error.message });
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
        if (Object.prototype.hasOwnProperty.call(importedSettings, "discordWebhookEnabled") && discordWebhookEnabledCheckbox) {
            discordWebhookEnabledCheckbox.checked = importedSettings.discordWebhookEnabled;
            if (discordWebhookToggleLabel) {
                discordWebhookToggleLabel.textContent = importedSettings.discordWebhookEnabled ? tr("toggleOn") : tr("toggleOff");
            }
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "discordWebhookUrl") && discordWebhookUrlInput) {
            discordWebhookUrlInput.value = importedSettings.discordWebhookUrl;
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "telegramWebhookEnabled") && telegramWebhookEnabledCheckbox) {
            telegramWebhookEnabledCheckbox.checked = importedSettings.telegramWebhookEnabled;
            if (telegramWebhookToggleLabel) {
                telegramWebhookToggleLabel.textContent = importedSettings.telegramWebhookEnabled ? tr("toggleOn") : tr("toggleOff");
            }
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "telegramWebhookUrl") && telegramWebhookUrlInput) {
            telegramWebhookUrlInput.value = importedSettings.telegramWebhookUrl;
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "webhookEnabled") && !Object.prototype.hasOwnProperty.call(importedSettings, "discordWebhookEnabled") && discordWebhookEnabledCheckbox) {
            discordWebhookEnabledCheckbox.checked = importedSettings.webhookEnabled;
        }
        if (Object.prototype.hasOwnProperty.call(importedSettings, "webhookUrl") && !Object.prototype.hasOwnProperty.call(importedSettings, "discordWebhookUrl") && discordWebhookUrlInput) {
            discordWebhookUrlInput.value = importedSettings.webhookUrl;
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
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyConfigImported") });
    } catch (error) {
        configSettingsStatus.textContent = tr("importConfigError", { error: error.message });
        showToast({ type: "error", title: tr("notifyFailed"), message: tr("notifyConfigImportFailed", { error: error.message }) });
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

// --- Discord & Telegram Webhook Settings ---
const discordWebhookEnabledCheckbox = document.getElementById("discordWebhookEnabled");
const discordWebhookToggleLabel = document.getElementById("discordWebhookToggleLabel");
const discordWebhookUrlInput = document.getElementById("discordWebhookUrl");
const saveDiscordWebhookBtn = document.getElementById("saveDiscordWebhookBtn");
const testDiscordWebhookBtn = document.getElementById("testDiscordWebhookBtn");
const discordWebhookSettingsStatus = document.getElementById("discordWebhookSettingsStatus");

const telegramWebhookEnabledCheckbox = document.getElementById("telegramWebhookEnabled");
const telegramWebhookToggleLabel = document.getElementById("telegramWebhookToggleLabel");
const telegramWebhookUrlInput = document.getElementById("telegramWebhookUrl");
const saveTelegramWebhookBtn = document.getElementById("saveTelegramWebhookBtn");
const testTelegramWebhookBtn = document.getElementById("testTelegramWebhookBtn");
const telegramWebhookSettingsStatus = document.getElementById("telegramWebhookSettingsStatus");

function setDiscordWebhookStatus(msg) {
    if (discordWebhookSettingsStatus) {
        discordWebhookSettingsStatus.textContent = msg;
        setTimeout(() => {
            if (discordWebhookSettingsStatus.textContent === msg) {
                discordWebhookSettingsStatus.textContent = "";
            }
        }, 4000);
    }
}

function setTelegramWebhookStatus(msg) {
    if (telegramWebhookSettingsStatus) {
        telegramWebhookSettingsStatus.textContent = msg;
        setTimeout(() => {
            if (telegramWebhookSettingsStatus.textContent === msg) {
                telegramWebhookSettingsStatus.textContent = "";
            }
        }, 4000);
    }
}

chrome.storage.local.get([
    "discordWebhookEnabled",
    "discordWebhookUrl",
    "telegramWebhookEnabled",
    "telegramWebhookUrl",
    "webhookEnabled",
    "webhookUrl",
], data => {
    let discordUrl = data.discordWebhookUrl;
    let telegramUrl = data.telegramWebhookUrl;
    let discordEnabled = data.discordWebhookEnabled;
    let telegramEnabled = data.telegramWebhookEnabled;

    if (discordUrl === undefined && telegramUrl === undefined && typeof data.webhookUrl === "string") {
        const legacyUrls = parseWebhookUrls(data.webhookUrl);
        const discordLines = legacyUrls.filter(u => u.includes("discord.com") || u.includes("discordapp.com"));
        const telegramLines = legacyUrls.filter(u => u.includes("api.telegram.org"));
        if (discordLines.length > 0) discordUrl = discordLines.join("\n");
        if (telegramLines.length > 0) telegramUrl = telegramLines.join("\n");
        if (data.webhookEnabled !== undefined) {
            if (discordLines.length > 0) discordEnabled = Boolean(data.webhookEnabled);
            if (telegramLines.length > 0) telegramEnabled = Boolean(data.webhookEnabled);
        }
    }

    if (discordWebhookEnabledCheckbox) {
        discordWebhookEnabledCheckbox.checked = Boolean(discordEnabled);
        if (discordWebhookToggleLabel) {
            discordWebhookToggleLabel.textContent = discordEnabled ? tr("toggleOn") : tr("toggleOff");
        }
    }
    if (discordWebhookUrlInput) {
        discordWebhookUrlInput.value = discordUrl || "";
    }

    if (telegramWebhookEnabledCheckbox) {
        telegramWebhookEnabledCheckbox.checked = Boolean(telegramEnabled);
        if (telegramWebhookToggleLabel) {
            telegramWebhookToggleLabel.textContent = telegramEnabled ? tr("toggleOn") : tr("toggleOff");
        }
    }
    if (telegramWebhookUrlInput) {
        telegramWebhookUrlInput.value = telegramUrl || "";
    }
});

if (discordWebhookEnabledCheckbox) {
    discordWebhookEnabledCheckbox.addEventListener("change", async () => {
        const enabled = discordWebhookEnabledCheckbox.checked;
        if (discordWebhookToggleLabel) {
            discordWebhookToggleLabel.textContent = enabled ? tr("toggleOn") : tr("toggleOff");
        }
        await chrome.storage.local.set({ discordWebhookEnabled: enabled });
        setDiscordWebhookStatus(enabled ? tr("discordWebhookEnabledStatus") : tr("discordWebhookDisabledStatus"));
    });
}

if (saveDiscordWebhookBtn && discordWebhookUrlInput) {
    saveDiscordWebhookBtn.addEventListener("click", async () => {
        const urlText = discordWebhookUrlInput.value.trim();
        await chrome.storage.local.set({ discordWebhookUrl: urlText });
        const count = parseWebhookUrls(urlText).length;
        setDiscordWebhookStatus(count > 0 ? tr("discordWebhookSavedStatus", { count }) : tr("discordWebhookSavedEmptyStatus"));
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyWebhookSaved") });
    });
}

async function handleWebhookTest(btn, type, urlInput, setStatusFn) {
    btn.disabled = true;
    setStatusFn(tr("webhookSendingTest"));
    const currentVal = urlInput.value.trim();
    try {
        const res = await chrome.runtime.sendMessage({ action: "testWebhook", type, url: currentVal });
        btn.disabled = false;
        if (res?.ok) {
            const success = res.successCount ?? 1;
            const total = res.totalCount ?? success;
            setStatusFn(tr("webhookTestSuccess", { success, total }));
            showToast({ type: "success", title: tr("notifySuccess"), message: tr("webhookTestSuccess", { success, total }) });
        } else {
            const err = res?.error || tr("webhookCheckUrlFallback");
            setStatusFn(tr("webhookTestFailed", { error: err }));
            showToast({ type: "error", title: tr("notifyFailed"), message: err });
        }
    } catch (err) {
        btn.disabled = false;
        setStatusFn(tr("webhookExtError", { error: err.message }));
        showToast({ type: "error", title: tr("notifyFailed"), message: err.message });
    }
}

if (testDiscordWebhookBtn && discordWebhookUrlInput) {
    testDiscordWebhookBtn.addEventListener("click", () =>
        handleWebhookTest(testDiscordWebhookBtn, "discord", discordWebhookUrlInput, setDiscordWebhookStatus)
    );
}

if (telegramWebhookEnabledCheckbox) {
    telegramWebhookEnabledCheckbox.addEventListener("change", async () => {
        const enabled = telegramWebhookEnabledCheckbox.checked;
        if (telegramWebhookToggleLabel) {
            telegramWebhookToggleLabel.textContent = enabled ? tr("toggleOn") : tr("toggleOff");
        }
        await chrome.storage.local.set({ telegramWebhookEnabled: enabled });
        setTelegramWebhookStatus(enabled ? tr("telegramWebhookEnabledStatus") : tr("telegramWebhookDisabledStatus"));
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifySettingsSaved") });
    });
}

if (saveTelegramWebhookBtn && telegramWebhookUrlInput) {
    saveTelegramWebhookBtn.addEventListener("click", async () => {
        const urlText = telegramWebhookUrlInput.value.trim();
        await chrome.storage.local.set({ telegramWebhookUrl: urlText });
        const count = parseWebhookUrls(urlText).length;
        setTelegramWebhookStatus(count > 0 ? tr("telegramWebhookSavedStatus", { count }) : tr("telegramWebhookSavedEmptyStatus"));
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyWebhookSaved") });
    });
}

if (testTelegramWebhookBtn && telegramWebhookUrlInput) {
    testTelegramWebhookBtn.addEventListener("click", () =>
        handleWebhookTest(testTelegramWebhookBtn, "telegram", telegramWebhookUrlInput, setTelegramWebhookStatus)
    );
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

function createFallbackSvgIcon(rewardName) {
    const wrap = document.createElement("span");
    wrap.className = "reward-badge-icon-svg";
    const nameLower = String(rewardName ?? "").toLowerCase();
    if (/đá quý|gem/i.test(nameLower)) {
        wrap.innerHTML = SVG_ICONS.gem;
    } else if (/tăng tốc|speedup/i.test(nameLower)) {
        wrap.innerHTML = SVG_ICONS.clock;
    } else if (/rương|chest|vật liệu|material/i.test(nameLower)) {
        wrap.innerHTML = SVG_ICONS.chest;
    } else {
        wrap.innerHTML = SVG_ICONS.star;
    }
    return wrap;
}

function getRewardImageSrc(rewardName, rewardIcons = {}) {
    const id = getRewardIdByName(rewardName);
    if (id) {
        return `images/rewards/${id}.png`;
    }
    const iconUrl = rewardIcons[rewardName] || (id ? rewardIcons[id] : null);
    if (iconUrl && typeof iconUrl === "string" && (iconUrl.startsWith("http") || iconUrl.startsWith("images/") || iconUrl.startsWith("chrome-extension://"))) {
        return iconUrl;
    }
    return null;
}

function getRewardBadgeElement(rewardName, count, rewardIcons = {}) {
    const badge = document.createElement("span");
    badge.className = "reward-badge-mini";
    badge.title = `${rewardName} x${count}`;

    const iconSrc = getRewardImageSrc(rewardName, rewardIcons);
    if (iconSrc) {
        const img = document.createElement("img");
        img.className = "reward-badge-icon";
        img.src = iconSrc;
        img.alt = "";
        img.onerror = () => {
            img.replaceWith(createFallbackSvgIcon(rewardName));
        };
        badge.appendChild(img);
    } else {
        badge.appendChild(createFallbackSvgIcon(rewardName));
    }

    const countSpan = document.createElement("span");
    countSpan.textContent = `x${count}`;
    badge.appendChild(countSpan);
    return badge;
}

async function loadAvatarImage(url) {
    if (!url || typeof url !== "string" || !url.trim()) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith("data:") || cleanUrl.startsWith("blob:") || cleanUrl.startsWith("chrome-extension://") || cleanUrl.startsWith("images/")) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = cleanUrl;
        });
    }

    try {
        const res = await fetch(cleanUrl);
        if (res.ok) {
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve(null);
                };
                img.src = objectUrl;
            });
        }
    } catch {
        // Fall back to direct Image load with crossOrigin
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = cleanUrl;
    });
}

function loadRewardImage(rewardName, rewardIcons = {}) {
    const src = getRewardImageSrc(rewardName, rewardIcons);
    if (!src) return Promise.resolve(null);
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function createPodiumFallbackAvatar(name) {
    const fallback = document.createElement("span");
    fallback.className = "podium-avatar-fallback";
    fallback.textContent = getInitials(name);
    return fallback;
}

function createPodiumColumn(rank, charEntry, rewardIcons = {}, roleAvatarMap = {}) {
    const col = document.createElement("div");
    col.className = `podium-col rank-${rank}`;

    const crown = document.createElement("div");
    crown.className = "podium-crown";
    crown.innerHTML = rank === 1 ? SVG_ICONS.crown : SVG_ICONS.medal;
    col.appendChild(crown);

    const avatarWrap = document.createElement("div");
    avatarWrap.className = "podium-avatar-wrap";

    const charAvatarUrl = charEntry.avatar || roleAvatarMap[String(charEntry.roleId)] || cachedRoles.find(r => String(r.roleId) === String(charEntry.roleId))?.avatar || "";
    if (charAvatarUrl) {
        const img = document.createElement("img");
        img.className = "podium-avatar-img";
        img.src = charAvatarUrl;
        img.alt = "";
        img.onerror = () => {
            img.replaceWith(createPodiumFallbackAvatar(charEntry.name));
        };
        avatarWrap.appendChild(img);
    } else {
        avatarWrap.appendChild(createPodiumFallbackAvatar(charEntry.name));
    }

    const rankBadge = document.createElement("span");
    rankBadge.className = "podium-rank-badge";
    rankBadge.textContent = `#${rank}`;
    avatarWrap.appendChild(rankBadge);
    col.appendChild(avatarWrap);

    const info = document.createElement("div");
    info.className = "podium-char-info";

    const name = document.createElement("div");
    name.className = "podium-char-name";
    name.textContent = charEntry.name || charEntry.roleId;
    name.title = charEntry.name || charEntry.roleId;

    const server = document.createElement("div");
    server.className = "podium-char-server";
    server.textContent = charEntry.svrId ? `#${charEntry.svrId}` : "";

    info.append(name, server);
    col.appendChild(info);

    const pedestal = document.createElement("div");
    pedestal.className = "podium-pedestal";

    const rewardsWrap = document.createElement("div");
    rewardsWrap.className = "podium-rewards";

    const topRewards = getTopCharacterRewards(charEntry.rewards || {}, 3);
    for (const rew of topRewards) {
        const translatedName = translateRewardName(rew.name, currentLanguage);
        rewardsWrap.appendChild(getRewardBadgeElement(translatedName, rew.count, rewardIcons));
    }
    pedestal.appendChild(rewardsWrap);

    const score = document.createElement("div");
    score.className = "podium-char-score";
    score.textContent = tr("pointsSuffix", { score: Number(charEntry.score).toLocaleString(getLocaleTag()) });
    pedestal.appendChild(score);

    col.appendChild(pedestal);

    return col;
}

function renderPodium(container, top3, rewardIcons = {}, roleAvatarMap = {}) {
    container.replaceChildren();
    const podiumSlots = [];
    if (top3.length >= 2) podiumSlots.push({ rank: 2, char: top3[1] });
    if (top3.length >= 1) podiumSlots.push({ rank: 1, char: top3[0] });
    if (top3.length >= 3) podiumSlots.push({ rank: 3, char: top3[2] });

    for (const slot of podiumSlots) {
        const col = createPodiumColumn(slot.rank, slot.char, rewardIcons, roleAvatarMap);
        container.appendChild(col);
    }
}

function drawRoundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y + w, y, r);
    ctx.closePath();
}

async function drawShareCard(canvas, ranked, weekKey, lang, rewardIcons = {}, roleAvatarMap = {}) {
    const top3 = ranked.slice(0, 3);
    const runnersUp = ranked.slice(3, 8);

    const dpr = 2;
    const baseW = 680;
    const headerH = 104;
    const podiumH = top3.length > 0 ? 275 : 80;
    const runnersH = runnersUp.length > 0 ? 46 + (runnersUp.length * 44) : 0;
    const footerH = 50;
    const baseH = headerH + podiumH + runnersH + footerH;

    canvas.width = baseW * dpr;
    canvas.height = baseH * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    canvas.style.maxWidth = "100%";
    canvas.style.display = "block";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // 1. Background
    ctx.fillStyle = "#181715";
    ctx.fillRect(0, 0, baseW, baseH);

    // Ambient glow
    const glow = ctx.createRadialGradient(baseW / 2, 40, 20, baseW / 2, 40, 340);
    glow.addColorStop(0, "rgba(204, 120, 92, 0.14)");
    glow.addColorStop(1, "rgba(24, 23, 21, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, baseW, baseH);

    // Outer border
    ctx.strokeStyle = "#2d2a26";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, 1, 1, baseW - 2, baseH - 2, 12);
    ctx.stroke();

    // 2. Header
    ctx.fillStyle = "#252320";
    drawRoundRect(ctx, 28, 22, 120, 22, 11);
    ctx.fill();
    ctx.strokeStyle = "#3d3a35";
    drawRoundRect(ctx, 28, 22, 120, 22, 11);
    ctx.stroke();

    ctx.fillStyle = "#cc785c";
    ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ROK WEEKLY AUTO", 88, 33);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#faf9f5";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const titleText = t("shareModalTitle", {}, lang) || "Weekly Luck Leaderboard";
    ctx.fillText(titleText, 28, 70);

    ctx.fillStyle = "#a09d96";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const metaText = `Week: ${weekKey} • ${t("leaderboardMeta", {}, lang) || "Resets Friday 00:05 UTC"}`;
    ctx.fillText(metaText, 28, 88);

    ctx.strokeStyle = "#282623";
    ctx.beginPath();
    ctx.moveTo(28, 102);
    ctx.lineTo(baseW - 28, 102);
    ctx.stroke();

    let curY = 115;

    // 3. Podium Top 3
    if (top3.length > 0) {
        const slots = [];
        if (top3.length >= 2) slots.push({ rank: 2, char: top3[1] });
        if (top3.length >= 1) slots.push({ rank: 1, char: top3[0] });
        if (top3.length >= 3) slots.push({ rank: 3, char: top3[2] });

        // Preload avatar images for top 3
        const avatarImgs = await Promise.all(
            slots.map(s => {
                const url = s.char.avatar || roleAvatarMap[String(s.char.roleId)] || cachedRoles.find(r => String(r.roleId) === String(s.char.roleId))?.avatar || "";
                return loadAvatarImage(url);
            })
        );

        // Preload reward images for top 3
        const slotRewardImgs = await Promise.all(
            slots.map(s => {
                const topRewards = getTopCharacterRewards(s.char.rewards, 3);
                return Promise.all(topRewards.map(r => loadRewardImage(r.name, rewardIcons)));
            })
        );

        const colW = 180;
        const gap = 20;
        const totalPodiumW = (slots.length * colW) + ((slots.length - 1) * gap);
        const startX = (baseW - totalPodiumW) / 2;

        const rankColors = {
            1: { main: "#d97706", grad1: "rgba(217, 119, 6, 0.28)", grad2: "rgba(37, 35, 32, 0.95)", border: "#d97706", height: 86 },
            2: { main: "#94a3b8", grad1: "rgba(148, 163, 184, 0.22)", grad2: "rgba(37, 35, 32, 0.95)", border: "#64748b", height: 68 },
            3: { main: "#cc785c", grad1: "rgba(204, 120, 92, 0.22)", grad2: "rgba(37, 35, 32, 0.95)", border: "#a9583e", height: 54 }
        };

        const podiumBaseline = curY + 248;

        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const cfg = rankColors[slot.rank];
            const x = startX + (i * (colW + gap));
            const pTop = podiumBaseline - cfg.height;

            const pedGrad = ctx.createLinearGradient(x, pTop, x, podiumBaseline);
            pedGrad.addColorStop(0, cfg.grad1);
            pedGrad.addColorStop(1, cfg.grad2);
            ctx.fillStyle = pedGrad;
            drawRoundRect(ctx, x, pTop, colW, cfg.height, 8);
            ctx.fill();
            ctx.strokeStyle = cfg.border;
            ctx.lineWidth = 1.2;
            drawRoundRect(ctx, x, pTop, colW, cfg.height, 8);
            ctx.stroke();

            // 1. Inside pedestal box (TOP): Reward Badges with 20px icons
            const topRewards = getTopCharacterRewards(slot.char.rewards, 3);
            const rewImgs = slotRewardImgs[i] || [];
            if (topRewards.length > 0) {
                const hasImgs = rewImgs.some(Boolean);
                if (hasImgs) {
                    const badgeW = 50;
                    const badgeH = 24;
                    const totalBadgesW = (topRewards.length * badgeW) + ((topRewards.length - 1) * 6);
                    let rx = x + ((colW - totalBadgesW) / 2);
                    const ry = pTop + 10;
                    for (let rIdx = 0; rIdx < topRewards.length; rIdx++) {
                        const r = topRewards[rIdx];
                        const rImg = rewImgs[rIdx];
                        ctx.fillStyle = "#181715";
                        drawRoundRect(ctx, rx, ry, badgeW, badgeH, 12);
                        ctx.fill();
                        ctx.strokeStyle = "#383530";
                        ctx.lineWidth = 1;
                        drawRoundRect(ctx, rx, ry, badgeW, badgeH, 12);
                        ctx.stroke();

                        if (rImg) {
                            ctx.drawImage(rImg, rx + 3, ry + 2, 20, 20);
                        }
                        ctx.fillStyle = "#faf9f5";
                        ctx.font = "bold 10px monospace";
                        ctx.textAlign = "left";
                        ctx.textBaseline = "middle";
                        ctx.fillText(`x${r.count}`, rx + 26, ry + 12);
                        rx += badgeW + 6;
                    }
                } else {
                    const rewStr = topRewards.map(r => `x${r.count} ${translateRewardName(r.name, lang)}`).join(" • ");
                    ctx.fillStyle = "#e8e0d2";
                    ctx.font = "9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "alphabetic";
                    ctx.fillText(rewStr.length > 28 ? rewStr.slice(0, 26) + "…" : rewStr, x + (colW / 2), pTop + 22);
                }
            }

            // 2. Inside pedestal box (BOTTOM): Reward points!
            const pillW = 82;
            const pillH = 19;
            const pillX = x + ((colW - pillW) / 2);
            const pillY = podiumBaseline - 25;
            ctx.fillStyle = "#181715";
            drawRoundRect(ctx, pillX, pillY, pillW, pillH, 9.5);
            ctx.fill();
            ctx.strokeStyle = cfg.border;
            ctx.lineWidth = 1;
            drawRoundRect(ctx, pillX, pillY, pillW, pillH, 9.5);
            ctx.stroke();

            ctx.fillStyle = cfg.main;
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${Number(slot.char.score).toLocaleString()} pts`, x + (colW / 2), pillY + 9.5);

            // 3. Above pedestal box: Avatar, Rank, Char Name, Server
            const avatarR = slot.rank === 1 ? 26 : 22;
            const avatarX = x + (colW / 2);
            const avatarY = pTop - 44 - avatarR;

            // Crown or Medal indicator above avatar
            ctx.fillStyle = cfg.main;
            ctx.font = `bold ${slot.rank === 1 ? 16 : 14}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(slot.rank === 1 ? "👑" : (slot.rank === 2 ? "🥈" : "🥉"), avatarX, avatarY - avatarR - 11);

            // Ring around avatar
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarR + 2.5, 0, Math.PI * 2);
            ctx.fillStyle = cfg.main;
            ctx.fill();

            // Avatar background
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
            ctx.fillStyle = "#252320";
            ctx.fill();

            // Avatar image or fallback monogram
            const avatarImg = avatarImgs[i];
            if (avatarImg) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(avatarImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
                ctx.restore();
            } else {
                const initials = getInitials(slot.char.name);
                ctx.fillStyle = "#faf9f5";
                ctx.font = `bold ${slot.rank === 1 ? 16 : 13}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(initials, avatarX, avatarY);
            }

            // Rank pill badge (anchored right at the bottom edge of avatar)
            ctx.fillStyle = cfg.main;
            drawRoundRect(ctx, avatarX - 14, avatarY + avatarR - 7, 28, 15, 7.5);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9.5px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`#${slot.rank}`, avatarX, avatarY + avatarR + 0.5);

            // Character name (with clear spacing below rank badge)
            ctx.fillStyle = "#faf9f5";
            ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const cName = slot.char.name || slot.char.roleId;
            const cNameTrunc = cName.length > 18 ? cName.slice(0, 16) + "…" : cName;
            ctx.fillText(cNameTrunc, avatarX, pTop - 22);

            // Server ID (below character name, just above pedestal top)
            ctx.fillStyle = "#a09d96";
            ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const svrStr = slot.char.svrId ? `#${slot.char.svrId}` : "";
            if (svrStr) {
                ctx.fillText(svrStr, avatarX, pTop - 9);
            }
        }

        curY = podiumBaseline + 16;
    }

    // 4. Runners-up list (Ranks 4 to 8)
    if (runnersUp.length > 0) {
        ctx.textAlign = "left";
        ctx.fillStyle = "#a09d96";
        ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const runnersTitle = t("runnersUp", {}, lang) || "RUNNERS-UP";
        ctx.fillText(runnersTitle.toUpperCase(), 32, curY + 14);
        curY += 24;

        runnersUp.forEach((runner, idx) => {
            const rankNum = idx + 4;
            const rowX = 28;
            const rowW = baseW - 56;
            const rowH = 36;

            ctx.fillStyle = "#1f1e1b";
            drawRoundRect(ctx, rowX, curY, rowW, rowH, 6);
            ctx.fill();
            ctx.strokeStyle = "#2d2a26";
            ctx.lineWidth = 1;
            drawRoundRect(ctx, rowX, curY, rowW, rowH, 6);
            ctx.stroke();

            ctx.fillStyle = "#cc785c";
            ctx.font = "bold 11px monospace";
            ctx.textAlign = "left";
            ctx.fillText(`#${rankNum}`, rowX + 12, curY + 22);

            ctx.fillStyle = "#faf9f5";
            ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            const svrText = runner.svrId ? ` (#${runner.svrId})` : "";
            const fullName = `${runner.name || runner.roleId}${svrText}`;
            ctx.fillText(fullName.length > 25 ? fullName.slice(0, 23) + "…" : fullName, rowX + 44, curY + 22);

            const topRew = getTopCharacterRewards(runner.rewards, 2);
            if (topRew.length > 0) {
                const rewStr = topRew.map(r => `x${r.count} ${translateRewardName(r.name, lang)}`).join(", ");
                ctx.fillStyle = "#8e8b82";
                ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                ctx.fillText(rewStr.length > 30 ? rewStr.slice(0, 28) + "…" : rewStr, rowX + 240, curY + 22);
            }

            ctx.fillStyle = "#252320";
            drawRoundRect(ctx, rowX + rowW - 84, curY + 7, 72, 22, 11);
            ctx.fill();
            ctx.fillStyle = "#cc785c";
            ctx.font = "bold 10.5px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`${Number(runner.score).toLocaleString()} pts`, rowX + rowW - 48, curY + 22);

            curY += rowH + 6;
        });
    }

    // 5. Footer
    ctx.strokeStyle = "#282623";
    ctx.beginPath();
    ctx.moveTo(28, baseH - 36);
    ctx.lineTo(baseW - 28, baseH - 36);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#6c6a64";
    ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Rise of Kingdoms Weekly Auto • https://github.com/Iwant2dye8976/rokautodraw", 28, baseH - 18);

    ctx.textAlign = "right";
    const dateStr = new Date().toISOString().slice(0, 10);
    ctx.fillText(dateStr, baseW - 28, baseH - 18);
}

async function openShareModal() {
    const modal = document.getElementById("shareModal");
    const canvas = document.getElementById("shareCanvas");
    if (!modal || !canvas) return;

    modal.hidden = false;
    const allStorage = await chrome.storage.local.get(null);
    const data = allStorage;
    const currentWeek = getCurrentWeekKey();
    const isCurrentWeek = data.weeklyStats?.weekKey === currentWeek;
    const scoresObj = isCurrentWeek ? (data.weeklyStats?.characterScores || {}) : {};
    const ranked = Object.values(scoresObj)
        .filter(item => item && item.score > 0)
        .sort((a, b) => (b.score - a.score) || ((b.draws || 0) - (a.draws || 0)));

    const roleAvatarMap = {};
    for (const [key, val] of Object.entries(allStorage)) {
        if (key.endsWith("_roles") && Array.isArray(val)) {
            for (const r of val) {
                if (r?.roleId && r?.avatar) {
                    roleAvatarMap[String(r.roleId)] = r.avatar;
                }
            }
        }
    }

    const autoWebhookEnabled = data.autoLeaderboardWebhookEnabled === true;
    const autoDiscord = data.autoLeaderboardDiscord !== false;
    const autoTelegram = data.autoLeaderboardTelegram !== false;

    if (autoLeaderboardWebhookEnabledCheckbox) {
        autoLeaderboardWebhookEnabledCheckbox.checked = autoWebhookEnabled;
    }
    if (autoLeaderboardChannels) {
        autoLeaderboardChannels.hidden = !autoWebhookEnabled;
    }
    if (autoLeaderboardDiscordCheckbox) {
        autoLeaderboardDiscordCheckbox.checked = autoDiscord;
    }
    if (autoLeaderboardTelegramCheckbox) {
        autoLeaderboardTelegramCheckbox.checked = autoTelegram;
    }

    await drawShareCard(canvas, ranked, currentWeek, currentLanguage, data.rewardIcons || {}, roleAvatarMap);
}

function closeShareModal() {
    const modal = document.getElementById("shareModal");
    if (modal) modal.hidden = true;
}

const autoLeaderboardWebhookEnabledCheckbox = document.getElementById("autoLeaderboardWebhookEnabled");
const autoLeaderboardChannels = document.getElementById("autoLeaderboardChannels");
const autoLeaderboardDiscordCheckbox = document.getElementById("autoLeaderboardDiscord");
const autoLeaderboardTelegramCheckbox = document.getElementById("autoLeaderboardTelegram");

if (autoLeaderboardWebhookEnabledCheckbox) {
    autoLeaderboardWebhookEnabledCheckbox.addEventListener("change", async () => {
        const enabled = autoLeaderboardWebhookEnabledCheckbox.checked;
        if (autoLeaderboardChannels) {
            autoLeaderboardChannels.hidden = !enabled;
        }
        await chrome.storage.local.set({ autoLeaderboardWebhookEnabled: enabled });
    });
}

if (autoLeaderboardDiscordCheckbox) {
    autoLeaderboardDiscordCheckbox.addEventListener("change", async () => {
        await chrome.storage.local.set({ autoLeaderboardDiscord: autoLeaderboardDiscordCheckbox.checked });
    });
}

if (autoLeaderboardTelegramCheckbox) {
    autoLeaderboardTelegramCheckbox.addEventListener("change", async () => {
        await chrome.storage.local.set({ autoLeaderboardTelegram: autoLeaderboardTelegramCheckbox.checked });
    });
}

const shareLeaderboardBtn = document.getElementById("shareLeaderboardBtn");
if (shareLeaderboardBtn) {
    shareLeaderboardBtn.addEventListener("click", () => {
        void openShareModal();
    });
}

const closeShareModalBtn = document.getElementById("closeShareModalBtn");
if (closeShareModalBtn) {
    closeShareModalBtn.addEventListener("click", () => {
        closeShareModal();
    });
}

document.getElementById("shareModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("shareModal")) {
        closeShareModal();
    }
});

const copyShareImageBtn = document.getElementById("copyShareImageBtn");
if (copyShareImageBtn) {
    copyShareImageBtn.addEventListener("click", async () => {
        const canvas = document.getElementById("shareCanvas");
        if (!canvas) return;
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            if (!blob) throw new Error("Could not generate image");
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
            ]);
            showToast({ type: "success", title: tr("notifySuccess"), message: tr("imageCopied") });
        } catch (err) {
            console.error("Copy share image error:", err);
            showToast({ type: "error", title: tr("notifyFailed"), message: tr("imageCopyFailed", { error: err.message }) });
        }
    });
}

const downloadShareImageBtn = document.getElementById("downloadShareImageBtn");
if (downloadShareImageBtn) {
    downloadShareImageBtn.addEventListener("click", () => {
        const canvas = document.getElementById("shareCanvas");
        if (!canvas) return;
        try {
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            const currentWeek = getCurrentWeekKey();
            link.download = `rok-weekly-luck-leaderboard-${currentWeek}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast({ type: "success", title: tr("notifySuccess"), message: tr("exportSuccess") });
        } catch (err) {
            console.error("Download share image error:", err);
            showToast({ type: "error", title: tr("notifyFailed"), message: err.message });
        }
    });
}

const sendWebhookShareImageBtn = document.getElementById("sendWebhookShareImageBtn");
if (sendWebhookShareImageBtn) {
    sendWebhookShareImageBtn.addEventListener("click", async () => {
        const canvas = document.getElementById("shareCanvas");
        if (!canvas) return;

        const allStorage = await chrome.storage.local.get(null);
        const accountDraws = extractAllAccountsDraws(allStorage, allStorage.storeAccounts, STORE_CONFIG);
        if (hasAccountsWithDrawsLeft(accountDraws)) {
            showToast({ type: "info", title: tr("notifyInfo"), message: tr("podiumDrawsRemainingError") });
            return;
        }

        const {
            discordWebhookEnabled,
            discordWebhookUrl,
            telegramWebhookEnabled,
            telegramWebhookUrl,
            webhookEnabled,
            webhookUrl,
        } = allStorage;

        const sendDiscord = autoLeaderboardDiscordCheckbox ? autoLeaderboardDiscordCheckbox.checked : true;
        const sendTelegram = autoLeaderboardTelegramCheckbox ? autoLeaderboardTelegramCheckbox.checked : true;

        const discordUrls = [
            ...parseWebhookUrls(discordWebhookUrl),
            ...parseWebhookUrls(webhookUrl).filter(u => u.includes("discord.com") || u.includes("discordapp.com")),
        ];
        const uniqueDiscordUrls = [...new Set(discordUrls)];

        const telegramUrls = [
            ...parseWebhookUrls(telegramWebhookUrl),
            ...parseWebhookUrls(webhookUrl).filter(u => u.includes("api.telegram.org")),
        ];
        const uniqueTelegramUrls = [...new Set(telegramUrls)];

        const targets = [];
        if (sendDiscord && (discordWebhookEnabled || uniqueDiscordUrls.length > 0)) {
            for (const url of uniqueDiscordUrls) {
                targets.push({ type: "discord", url });
            }
        }
        if (sendTelegram && (telegramWebhookEnabled || uniqueTelegramUrls.length > 0)) {
            for (const url of uniqueTelegramUrls) {
                targets.push({ type: "telegram", url });
            }
        }

        if (targets.length === 0) {
            showToast({ type: "info", title: tr("notifyFailed"), message: tr("noWebhooksConfigured") });
            return;
        }

        sendWebhookShareImageBtn.disabled = true;
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            if (!blob) throw new Error("Could not generate image");

            const currentWeek = getCurrentWeekKey();
            const title = `${tr("shareModalTitle")} (${currentWeek})`;
            const caption = tr("leaderboardMeta");

            let successCount = 0;
            const errors = [];

            for (const target of targets) {
                try {
                    if (target.type === "discord") {
                        const formData = new FormData();
                        formData.append("files[0]", blob, "leaderboard.png");
                        formData.append("payload_json", JSON.stringify(buildDiscordImagePayload(title, caption)));
                        const res = await fetch(target.url, { method: "POST", body: formData });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        successCount++;
                    } else if (target.type === "telegram") {
                        const photoUrl = getWebhookPhotoEndpoint(target.url);
                        const urlObj = new URL(photoUrl);
                        const chatId = urlObj.searchParams.get("chat_id");
                        const formData = new FormData();
                        if (chatId) formData.append("chat_id", chatId);
                        formData.append("photo", blob, `rok-leaderboard-${currentWeek}.png`);
                        formData.append("caption", `${title}\n${caption}`);
                        const res = await fetch(photoUrl, { method: "POST", body: formData });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        successCount++;
                    }
                } catch (err) {
                    console.error("Send webhook error:", err);
                    errors.push(err.message);
                }
            }

            if (successCount > 0) {
                showToast({ type: "success", title: tr("notifySuccess"), message: tr("webhookImageSent", { count: successCount }) });
            } else {
                showToast({ type: "error", title: tr("notifyFailed"), message: tr("webhookImageFailed", { error: errors.join(", ") }) });
            }
        } catch (err) {
            console.error("Webhook image error:", err);
            showToast({ type: "error", title: tr("notifyFailed"), message: tr("webhookImageFailed", { error: err.message }) });
        } finally {
            sendWebhookShareImageBtn.disabled = false;
        }
    });
}

async function renderRewardTotals() {
    const container = document.getElementById("rewardTotalsList");
    if (!container) return;
    const leaderboardWrap = document.getElementById("weeklyLeaderboardWrap");
    const leaderboardList = document.getElementById("weeklyLeaderboardList");
    const weeklyPodium = document.getElementById("weeklyPodium");
    const shareBtn = document.getElementById("shareLeaderboardBtn");
    const mode = getRewardStatsMode();
    const allStorage = await chrome.storage.local.get(null);
    const data = allStorage;
    const currentWeek = getCurrentWeekKey();
    const isCurrentWeekStats = data.weeklyStats?.weekKey === currentWeek;

    const roleAvatarMap = {};
    for (const [key, val] of Object.entries(allStorage)) {
        if (key.endsWith("_roles") && Array.isArray(val)) {
            for (const r of val) {
                if (r?.roleId && r?.avatar) {
                    roleAvatarMap[String(r.roleId)] = r.avatar;
                }
            }
        }
    }

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
        const fragment = document.createDocumentFragment();
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
            fragment.appendChild(row);
        }
        container.appendChild(fragment);
    }

    if (mode === "weekly" && leaderboardList) {
        leaderboardList.replaceChildren();
        if (weeklyPodium) weeklyPodium.replaceChildren();

        const scoresObj = isCurrentWeekStats ? (data.weeklyStats?.characterScores || {}) : {};
        const ranked = Object.values(scoresObj)
            .filter(item => item && item.score > 0)
            .sort((a, b) => (b.score - a.score) || ((b.draws || 0) - (a.draws || 0)));

        if (shareBtn) shareBtn.hidden = ranked.length === 0;

        if (ranked.length === 0) {
            if (weeklyPodium) weeklyPodium.hidden = true;
            const empty = document.createElement("div");
            empty.className = "login-note";
            empty.textContent = tr("noLeaderboardData");
            leaderboardList.appendChild(empty);
        } else {
            const rewardIcons = data.rewardIcons || {};
            const top3 = ranked.slice(0, 3);
            if (weeklyPodium && top3.length > 0) {
                weeklyPodium.hidden = false;
                renderPodium(weeklyPodium, top3, rewardIcons, roleAvatarMap);
            } else if (weeklyPodium) {
                weeklyPodium.hidden = true;
            }

            const runnersUp = ranked.slice(3);
            if (runnersUp.length > 0) {
                const fragment = document.createDocumentFragment();
                runnersUp.forEach((charEntry, idx) => {
                    const row = document.createElement("div");
                    row.className = "leaderboard-item";

                    const rankEl = document.createElement("span");
                    rankEl.className = "leaderboard-rank";
                    rankEl.textContent = `#${idx + 4}`;

                    const infoEl = document.createElement("div");
                    infoEl.className = "leaderboard-info";

                    const nameEl = document.createElement("div");
                    nameEl.className = "leaderboard-name";
                    const svrLabel = charEntry.svrId ? ` (#${charEntry.svrId})` : "";
                    nameEl.textContent = `${charEntry.name || charEntry.roleId}${svrLabel}`;

                    const topRewards = getTopCharacterRewards(charEntry.rewards || {}, 3);
                    const rewardsRow = document.createElement("div");
                    rewardsRow.className = "leaderboard-reward-row";
                    for (const rew of topRewards) {
                        const translatedName = translateRewardName(rew.name, currentLanguage);
                        rewardsRow.appendChild(getRewardBadgeElement(translatedName, rew.count, rewardIcons));
                    }

                    infoEl.append(nameEl, rewardsRow);

                    const scoreEl = document.createElement("span");
                    scoreEl.className = "leaderboard-score";
                    scoreEl.textContent = tr("pointsSuffix", { score: Number(charEntry.score).toLocaleString(getLocaleTag()) });

                    row.append(rankEl, infoEl, scoreEl);
                    fragment.appendChild(row);
                });
                leaderboardList.appendChild(fragment);
            }
        }
    } else {
        if (weeklyPodium) weeklyPodium.hidden = true;
        if (shareBtn) shareBtn.hidden = true;
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
        const confirmed = await showConfirmModal({
            title: tr("confirmClearRewardsTitle"),
            message: tr("confirmClearRewards"),
            confirmText: tr("modalDeleteBtn"),
            cancelText: tr("modalCancelBtn"),
        });
        if (!confirmed) return;
        await chrome.storage.local.remove(["rewardTotals", "weeklyStats", "lastLeaderboardSentWeekKey"]);
        await renderRewardTotals();
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyDataCleared") });
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
    if (changes.discordWebhookEnabled && discordWebhookEnabledCheckbox) {
        discordWebhookEnabledCheckbox.checked = changes.discordWebhookEnabled.newValue === true;
        updateSwitchToggleLabels();
    }
    if (changes.discordWebhookUrl && discordWebhookUrlInput && document.activeElement !== discordWebhookUrlInput) {
        discordWebhookUrlInput.value = changes.discordWebhookUrl.newValue || "";
    }
    if (changes.telegramWebhookEnabled && telegramWebhookEnabledCheckbox) {
        telegramWebhookEnabledCheckbox.checked = changes.telegramWebhookEnabled.newValue === true;
        updateSwitchToggleLabels();
    }
    if (changes.telegramWebhookUrl && telegramWebhookUrlInput && document.activeElement !== telegramWebhookUrlInput) {
        telegramWebhookUrlInput.value = changes.telegramWebhookUrl.newValue || "";
    }
    if (changes.autoReloginStatus?.newValue) {
        const statusMsg = changes.autoReloginStatus.newValue;
        setLoginSettingsStatus(statusMsg);
        const lower = statusMsg.toLowerCase();
        if (lower.includes("thành công") || lower.includes("successfully") || lower.includes("success")) {
            setCaptureBtnLoading(false);
            showToast({ type: "success", title: tr("notifySuccess"), message: statusMsg });
        } else if (lower.includes("thất bại") || lower.includes("failed") || lower.includes("error") || lower.includes("lỗi")) {
            setCaptureBtnLoading(false);
            showToast({ type: "error", title: tr("notifyFailed"), message: statusMsg, duration: 6000 });
        } else {
            showToast({ type: "info", title: tr("notifyInfo"), message: statusMsg });
        }
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
        setCaptureBtnLoading(false);
        renderCache(mall);
    }
});

document.getElementById("captureBtn").addEventListener("click", async () => {
    const mall = getSelectedMall();
    const accountId = getSelectedAccountId();
    await testRelogin(mall, accountId, { fromHeader: true });
});

document.getElementById("refreshCharsBtn").addEventListener("click", async () => {
    try {
        showToast({ type: "info", message: tr("refreshing") });
        await persistLoginAccounts({ validate: false });
        await fetchAndRender(getSelectedMall());
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyCharsRefreshed") });
    } catch (error) {
        setStatus(tr("refreshError", { error: error.message }));
        showToast({ type: "error", title: tr("notifyFailed"), message: tr("notifyCharsRefreshFailed", { error: error.message }) });
    }
});

document.getElementById("drawNowBtn").addEventListener("click", async () => {
    try {
        await persistLoginAccounts({ validate: false });
    } catch (error) {
        setStatus(tr("drawError", { error: error.message }));
        showToast({ type: "error", title: tr("notifyFailed"), message: tr("drawError", { error: error.message }) });
        return;
    }
    const mall = getSelectedMall();
    const accountId = getSelectedAccountId();
    const btn = document.getElementById("drawNowBtn");
    btn.disabled = true;
    btn.textContent = tr("drawingBtn");
    showLog();
    logEl.textContent = tr("startingDraw");
    showToast({ type: "info", message: tr("notifyDrawStarted") });

    try {
        const res = await chrome.runtime.sendMessage({ action: "drawNow", mall, accountId });
        btn.disabled = false;
        btn.textContent = tr("drawNowBtn");
        if (res?.error) {
            const isExp = /hết hạn|expired|invalid|401|403/i.test(res.error);
            setStatus(isExp ? tr("tokenExpired") : (res.error.length > 25 ? res.error.slice(0, 25) + "…" : res.error), false);
            showToast({ type: "error", title: tr("notifyFailed"), message: res.error });
            return;
        }
        if (res?.drawsLeft === 0) {
            logEl.textContent = tr("checkCompleteNoDraws");
            showToast({ type: "info", title: tr("notifyInfo"), message: tr("checkCompleteNoDraws") });
            return;
        }
        showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyDrawCompleted") });
        void renderCache(mall);
    } catch (err) {
        btn.disabled = false;
        btn.textContent = tr("drawNowBtn");
        setStatus(err.message);
        showToast({ type: "error", title: tr("notifyFailed"), message: err.message });
    }
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
        void syncCaptureBtnLoadingState(mall);
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
        showToast({ type: "info", message: tr("startingDrawAll") });
        try {
            const res = await chrome.runtime.sendMessage({ action: "drawAll" });
            drawAllBtn.disabled = false;
            drawAllBtn.textContent = tr("drawAllBtn");
            if (res?.error) {
                setStatus(res.error, false);
                showToast({ type: "error", title: tr("notifyFailed"), message: res.error });
                return;
            }
            showToast({ type: "success", title: tr("notifySuccess"), message: tr("notifyDrawCompleted") });
            void renderCache(getSelectedMall());
        } catch (err) {
            drawAllBtn.disabled = false;
            drawAllBtn.textContent = tr("drawAllBtn");
            setStatus(err.message);
            showToast({ type: "error", title: tr("notifyFailed"), message: err.message });
        }
    });
}

// ============================================================================
// Updater UI
// ============================================================================
(function initUpdaterUi() {
    function getLang() {
        return typeof currentLanguage !== "undefined" ? currentLanguage : DEFAULT_LANGUAGE;
    }

    function renderUpdateBanner(updateCache, dismissedVersion) {
        const banner = document.getElementById("updateBanner");
        if (!banner) return;
        const currentVersion = chrome.runtime.getManifest().version;
        const hasUpdate = Boolean(
            updateCache?.version &&
            compareVersions(updateCache.version, currentVersion) > 0 &&
            updateCache.version !== dismissedVersion
        );
        if (!hasUpdate) {
            banner.style.display = "none";
            return;
        }
        const titleEl = document.getElementById("updateBannerTitle");
        const bodyEl = document.getElementById("updateBannerBody");
        if (titleEl) {
            titleEl.textContent = t("updateAvailableTitle", { version: updateCache.version }, getLang());
        }
        if (bodyEl) {
            const notes = (updateCache.body || "").trim();
            bodyEl.textContent = notes.length > 220 ? `${notes.slice(0, 220)}…` : notes;
            bodyEl.style.display = notes ? "block" : "none";
        }
        banner.dataset.htmlUrl = updateCache.htmlUrl || "";
        banner.dataset.version = updateCache.version;
        banner.style.display = "block";
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const currentVersion = chrome.runtime.getManifest().version;
        const versionLabel = document.getElementById("currentVersionLabel");
        if (versionLabel) {
            versionLabel.textContent = `v${currentVersion}`;
        }
        const footerVersion = document.getElementById("footerVersion");
        if (footerVersion) {
            footerVersion.textContent = `v${currentVersion}`;
        }

        const intervalInput = document.getElementById("updateCheckIntervalHours");
        const checkBtn = document.getElementById("checkUpdatesBtn");
        const statusEl = document.getElementById("updateCheckStatus");
        const downloadBtn = document.getElementById("updateDownloadBtn");
        const dismissBtn = document.getElementById("updateDismissBtn");
        const banner = document.getElementById("updateBanner");

        const stored = await chrome.storage.local.get([
            "updateCache",
            "dismissedUpdateVersion",
            "updateCheckIntervalHours",
        ]);

        if (intervalInput) {
            const hours = Number(stored.updateCheckIntervalHours);
            intervalInput.value = Number.isFinite(hours) && hours >= 1 ? hours : DEFAULT_UPDATE_CHECK_INTERVAL_HOURS;
            intervalInput.addEventListener("change", async () => {
                const val = Number.parseInt(intervalInput.value, 10);
                const normalized = Number.isFinite(val) && val >= 1 ? val : DEFAULT_UPDATE_CHECK_INTERVAL_HOURS;
                intervalInput.value = normalized;
                await chrome.storage.local.set({ updateCheckIntervalHours: normalized });
            });
        }

        renderUpdateBanner(stored.updateCache, stored.dismissedUpdateVersion);

        if (downloadBtn) {
            downloadBtn.addEventListener("click", () => {
                const url = banner?.dataset.htmlUrl || "https://github.com/Iwant2dye8976/rokautodraw/releases/latest";
                chrome.tabs.create({ url });
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener("click", async () => {
                const version = banner?.dataset.version;
                if (version) {
                    await chrome.storage.local.set({ dismissedUpdateVersion: version });
                }
                if (banner) banner.style.display = "none";
            });
        }

        if (checkBtn) {
            checkBtn.addEventListener("click", async () => {
                checkBtn.disabled = true;
                if (statusEl) statusEl.textContent = t("updateChecking", {}, getLang());
                try {
                    const res = await chrome.runtime.sendMessage({ action: "checkForUpdates", force: true });
                    if (!res?.ok) {
                        throw new Error(res?.error || "Unknown error");
                    }
                    const latest = await chrome.storage.local.get(["updateCache", "dismissedUpdateVersion"]);
                    // Manual check clears dismissal if user explicitly checks
                    if (res.hasUpdate && latest.dismissedUpdateVersion === res.release?.version) {
                        await chrome.storage.local.remove("dismissedUpdateVersion");
                        renderUpdateBanner(res.release, null);
                    } else {
                        renderUpdateBanner(res.release, latest.dismissedUpdateVersion);
                    }
                    if (statusEl) {
                        statusEl.textContent = res.hasUpdate
                            ? t("updateAvailableStatus", { version: res.release.version }, getLang())
                            : t("updateUpToDate", { version: res.currentVersion }, getLang());
                    }
                } catch (err) {
                    if (statusEl) {
                        statusEl.textContent = t("updateCheckFailed", { error: err?.message || String(err) }, getLang());
                    }
                } finally {
                    checkBtn.disabled = false;
                }
            });
        }
    });
})();
