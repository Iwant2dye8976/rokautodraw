importScripts("utils.js");
const ask = accountStorageKey;
const DRAW_API = "https://plat-campaign-api.lilithgame.com";
const activeDraws = new Set();
const activeRelogins = new Set();
const activeReloginRefreshes = new Set();
const activeReloginAccountChecks = new Set();

async function getLanguage() {
    try {
        const { language } = await chrome.storage.local.get("language");
        return normalizeLanguage(language);
    } catch {
        return DEFAULT_LANGUAGE;
    }
}

async function isSessionLocked(key, maxAgeMs = 5 * 60 * 1000) {
    try {
        const session = await chrome.storage.session.get(key);
        const ts = session[key];
        return Number.isFinite(ts) && (Date.now() - ts < maxAgeMs);
    } catch {
        return false;
    }
}

async function setSessionLock(key, locked) {
    try {
        if (locked) {
            await chrome.storage.session.set({ [key]: Date.now() });
        } else {
            await chrome.storage.session.remove(key);
        }
    } catch (e) {
        console.warn(`[LilithDraw] Could not update session lock ${key}:`, e);
    }
}

async function cleanupStaleDrawStates() {
    try {
        const localData = await chrome.storage.local.get(null);
        const updates = {};
        for (const [key, value] of Object.entries(localData)) {
            if (key.endsWith("_isDrawing") && value === true) {
                const lockKey = `lock_draw_${key.replace(/_isDrawing$/, "_draw")}`;
                const locked = await isSessionLocked(lockKey);
                if (!locked) {
                    updates[key] = false;
                }
            }
        }
        if (Object.keys(updates).length > 0) {
            await chrome.storage.local.set(updates);
            console.log("[LilithDraw] Reset stale drawing locks:", Object.keys(updates));
        }
    } catch (e) {
        console.warn("[LilithDraw] Could not cleanup stale locks:", e);
    }
}
void cleanupStaleDrawStates();
void updateBadge().catch(() => {});
const LILITH_STORE_URL = "https://passport-global.lilith.com/login?client_id=gamepay_lglo&game_id=10043&is_feature=allow_post_events&fallback_referer=https%3A%2F%2Fstore.lilith.com&app_id=2104267&client_icon=https%3A%2F%2Fstatic.farlicdn.com%2Fp%2Fgamepay%2F2.0.0%2Flilith.png&client_name=LiLith+Store&redirect_to=https://store.lilith.com/rok?tab=perks&login_way=S-A&locale=vi";
const PLUTOMALL_RELOGIN_URL = "https://passport.pup.vn/login?client_id=gamepay_lglo&game_id=10043&subject=vn_gamota&is_feature=allow_post_events&fallback_referer=https%3A%2F%2Fwww.plutomall.com.vn&app_id=6626468&client_icon=https%3A%2F%2Fstatic.farlicdn.com%2Fp%2Fgamepay%2F2.0.0%2Fexternal_app.png&client_name=%E1%BB%A8ng+d%E1%BB%A5ng+kh%C3%A1c&redirect_to=https%3A%2F%2Fwww.plutomall.com.vn%2Frok%2Fvn%3Ftab%3Dperks&login_way=S-A&locale=vi";
const RELOGIN_ORIGINS = {
    lilithstore: "https://passport-global.lilith.com",
    plutomall: "https://passport.pup.vn",
};
async function postSingleWebhook(webhookUrl, text, discordPayload = null) {
    const bodyStr = JSON.stringify(buildWebhookBody(webhookUrl, text, discordPayload));
    let resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr,
    });
    if (!resp.ok) {
        if (resp.status === 429) {
            const retryAfterSec = Number(resp.headers?.get("Retry-After")) || 2;
            await new Promise(r => setTimeout(r, Math.min(Math.max(retryAfterSec, 1) * 1000, 5000)));
            resp = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: bodyStr,
            });
            if (resp.ok) return true;
        }
        let detail = "";
        try {
            const errData = await resp.json();
            detail = errData?.message || errData?.description || "";
        } catch {}
        throw new Error(`HTTP ${resp.status}${detail ? `: ${detail}` : ""}`);
    }
    return true;
}

async function sendWebhookMessage(text, discordPayload = null) {
    try {
        const {
            discordWebhookEnabled,
            discordWebhookUrl,
            telegramWebhookEnabled,
            telegramWebhookUrl,
            webhookEnabled,
            webhookUrl,
        } = await chrome.storage.local.get([
            "discordWebhookEnabled",
            "discordWebhookUrl",
            "telegramWebhookEnabled",
            "telegramWebhookUrl",
            "webhookEnabled",
            "webhookUrl",
        ]);

        const targets = [];
        if (discordWebhookEnabled) {
            const urls = parseWebhookUrls(discordWebhookUrl);
            for (const url of urls) targets.push({ url, payload: discordPayload });
        }
        if (telegramWebhookEnabled) {
            const urls = parseWebhookUrls(telegramWebhookUrl);
            for (const url of urls) targets.push({ url, payload: null });
        }
        // Legacy fallback if neither new toggle has been explicitly configured
        if (discordWebhookEnabled === undefined && telegramWebhookEnabled === undefined && webhookEnabled) {
            const urls = parseWebhookUrls(webhookUrl);
            for (const url of urls) targets.push({ url, payload: discordPayload });
        }

        if (targets.length === 0) return false;

        const results = await Promise.allSettled(
            targets.map(({ url, payload }) => postSingleWebhook(url, text, payload))
        );
        return results.some(r => r.status === "fulfilled" && r.value === true);
    } catch (e) {
        console.warn("[LilithDraw] Webhook send failed:", e);
        return false;
    }
}


function sk(mall, name) {
    return `${mall}_${name}`;
}

async function getStoreAccounts(mall) {
    const { storeAccounts } = await chrome.storage.local.get("storeAccounts");
    const accounts = storeAccounts && typeof storeAccounts === "object"
        ? storeAccounts[mall]
        : undefined;
    if (Array.isArray(accounts)) return accounts.filter(account =>
        account && typeof account.id === "string" &&
        /^[A-Za-z0-9-]+$/.test(account.id) &&
        typeof account.username === "string" && typeof account.password === "string"
    );
    return [];
}

async function getStoreAccount(mall, accountId) {
    const accounts = await getStoreAccounts(mall);
    const account = accounts.find(item => item.id === accountId);
    if (account) return account;
    if (accountId === "legacy") {
        const values = await chrome.storage.local.get([
            `${mall}Username`,
            `${mall}Password`,
        ]);
        if (values[`${mall}Username`] || values[`${mall}Password`]) {
            return {
                id: "legacy",
                username: values[`${mall}Username`] || "",
                password: values[`${mall}Password`] || "",
            };
        }
    }
    return null;
}

const RELOGIN_SEQUENCE_KEYS = [
    "autoReloginQueue",
    "autoReloginQueueIndex",
    "autoReloginQueueFailures",
];

const RELOGIN_SESSION_KEYS = [
    "autoReloginWindowId",
    "autoReloginTabId",
    "autoReloginStartedAt",
    "autoReloginMall",
    "autoReloginAccountId",
    "autoReloginReturnedAt",
    "autoReloginReadyAt",
    "autoReloginAccountSwitch",
];

async function clearReloginSession(tabId, includeSequence = false) {
    if (Number.isInteger(tabId)) {
        try {
            await chrome.tabs.remove(tabId);
        } catch {}
    }
    await chrome.storage.session.remove(
        includeSequence ? [...RELOGIN_SESSION_KEYS, ...RELOGIN_SEQUENCE_KEYS] : RELOGIN_SESSION_KEYS
    );
}

async function enqueueOrOpenRelogin(mall, accountId) {
    const session = await chrome.storage.session.get([
        "autoReloginStartedAt",
        "autoReloginMall",
        "autoReloginAccountId",
        "autoReloginQueue",
        "autoReloginQueueIndex",
    ]);
    const isRunning = Number.isFinite(session.autoReloginStartedAt) &&
        Date.now() - session.autoReloginStartedAt < 5 * 60 * 1000;
    if (isRunning && (session.autoReloginMall !== mall || session.autoReloginAccountId !== accountId)) {
        const queue = Array.isArray(session.autoReloginQueue) && session.autoReloginQueue.length > 0
            ? [...session.autoReloginQueue]
            : [{ mall: session.autoReloginMall, accountId: session.autoReloginAccountId }];
        if (!queue.some(item => item.mall === mall && item.accountId === accountId)) {
            queue.push({ mall, accountId });
            await chrome.storage.session.set({
                autoReloginQueue: queue,
                autoReloginQueueIndex: session.autoReloginQueueIndex ?? 0,
            });
        }
        return true;
    }
    return openReloginWindow(mall, accountId);
}

async function continueReloginSequence(expectedMall, expectedAccountId, failure) {
    const session = await chrome.storage.session.get(RELOGIN_SEQUENCE_KEYS);
    const queue = session.autoReloginQueue;
    const index = session.autoReloginQueueIndex ?? 0;
    const progress = progressReloginQueue(queue, index, expectedMall, expectedAccountId, failure);
    if (!progress) return;

    const failures = [...(session.autoReloginQueueFailures || []), ...progress.failures];
    if (progress.failures.length > 0) {
        await chrome.storage.session.set({ autoReloginQueueFailures: failures });
    }

    let nextIndex = progress.nextIndex;
    while (nextIndex < queue.length) {
        const next = queue[nextIndex];
        await chrome.storage.session.set({
            autoReloginQueueIndex: nextIndex,
            autoReloginQueueFailures: failures,
        });
        if (await openReloginWindow(next.mall, next.accountId)) return;
        const lang = await getLanguage();
        failures.push({ mall: next.mall, accountId: next.accountId, error: t("cannotOpenLoginTabError", {}, lang) });
        nextIndex++;
    }
    await chrome.storage.session.remove(RELOGIN_SEQUENCE_KEYS);
    const lang = await getLanguage();
    await chrome.storage.local.set({
        autoReloginStatus: failures.length
            ? t("reloginSeqCompleteWithFailures", { count: failures.length }, lang)
            : t("reloginSeqCompleteSuccess", {}, lang),
    });
    if (failures.length > 0) {
        const errorDetails = failures.map(f => `- ${f.mall} (${f.accountId}): ${f.error}`).join("\n");
        void sendWebhookMessage(t("webhookReloginFailed", { count: failures.length, details: errorDetails }, lang));
    } else {
        void chrome.notifications.create({
            type: "basic",
            iconUrl: "images/icons/icon48.png",
            title: t("reloginSuccessNotificationTitle", { store: STORE_NAMES[expectedMall] || expectedMall }, lang),
            message: t("reloginSeqCompleteSuccess", {}, lang),
        }).catch(() => {});
    }
}

async function getCurrentMall() {
    const { currentMall } = await chrome.storage.local.get("currentMall");
    return currentMall || "plutomall";
}

async function getStoreData(mall, accountId) {
    const keys = [
        ask(mall, accountId, "token"),
        ask(mall, accountId, "roles"),
        ask(mall, accountId, "drawsLeft"),
        ask(mall, accountId, "lastCheck"),
        ask(mall, accountId, "appUid"),
        ask(mall, accountId, "appId"),
        ask(mall, accountId, "isValidToken"),
    ];
    const data = await chrome.storage.local.get(keys);
    return {
        token: data[ask(mall, accountId, "token")] ?? null,
        roles: data[ask(mall, accountId, "roles")] ?? [],
        drawsLeft: data[ask(mall, accountId, "drawsLeft")] ?? null,
        lastCheck: data[ask(mall, accountId, "lastCheck")] ?? null,
        appUid: data[ask(mall, accountId, "appUid")] ?? null,
        appId: data[ask(mall, accountId, "appId")] ?? null,
        isValidToken: data[ask(mall, accountId, "isValidToken")] ?? null,
    };
}

// Badge always reflects the account selected in the popup, not whichever account ran last.
async function updateBadge() {
    const { currentMall = "plutomall", activeAccountIds = {} } =
        await chrome.storage.local.get(["currentMall", "activeAccountIds"]);
    const { drawsLeft } = await getStoreData(currentMall, activeAccountIds[currentMall] || undefined);
    const count = Number(drawsLeft);
    const text = Number.isFinite(count) && count > 0 ? String(count) : "";
    await chrome.action.setBadgeText({ text });
    if (text) await chrome.action.setBadgeBackgroundColor({ color: "#cc785c" });
}

async function setStoreData(mall, partial, accountId) {
    const mapped = {};
    for (const [k, v] of Object.entries(partial)) {
        mapped[ask(mall, accountId, k)] = v;
    }
    await chrome.storage.local.set(mapped);
    if (partial.drawsLeft !== undefined) {
        void updateBadge().catch(() => {});
    }
}


async function getToken(mall, accountId) {
    const m = mall ?? await getCurrentMall();
    const data = await getStoreData(m, accountId);
    return data.token ?? null;
}

async function fetchJson(url, options = {}, accountId, retries = 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
        let response;
        try {
            response = await fetch(url, { ...options, signal: controller.signal });
        } catch (error) {
            const lang = await getLanguage();
            if (error.name === "AbortError") {
                throw new Error(t("requestTimeoutError", {}, lang));
            }
            if (retries > 0) {
                await new Promise(r => setTimeout(r, 1000));
                return fetchJson(url, options, accountId, retries - 1);
            }
            throw new Error(t("networkError", { error: error.message }, lang));
        }

        if (response.status === 429 && retries > 0) {
            await new Promise(r => setTimeout(r, 2000));
            return fetchJson(url, options, accountId, retries - 1);
        }

        if (response.status === 401 || response.status === 403) {
            const mall = detectMallFromUrl(url);
            if (mall) {
                void setStoreData(mall, { isValidToken: false }, accountId);
                void enqueueOrOpenRelogin(mall, accountId);
            }
        }

        let json;
        try {
            json = await response.json();
        } catch {
            const lang = await getLanguage();
            const error = new Error(t("nonJsonResponseError", { status: response.status }, lang));
            error.status = response.status;
            throw error;
        }
        if (response.ok && isExpiredTokenResponse(json)) {
            const mall = detectMallFromUrl(url);
            if (mall) {
                void setStoreData(mall, { isValidToken: false }, accountId);
                void enqueueOrOpenRelogin(mall, accountId);
            }
            const lang = await getLanguage();
            const error = new Error(
                json?.msg || json?.message || t("tokenExpired", {}, lang)
            );
            error.status = 401;
            throw error;
        }
        if (!response.ok) {
            const lang = await getLanguage();
            const error = new Error(json?.msg || json?.message || t("apiHttpError", { status: response.status }, lang));
            error.status = response.status;
            throw error;
        }

        return json;
    } finally {
        clearTimeout(timeout);
    }
}

async function openReloginWindow(mall, accountId) {
    if (!STORE_CONFIG[mall]) return false;
    const reloginKey = `${mall}:${accountId || "default"}`;
    const lockKey = `lock_relogin_${reloginKey}`;
    if (activeRelogins.has(reloginKey) || (await isSessionLocked(lockKey, 3 * 60 * 1000))) return true;
    activeRelogins.add(reloginKey);
    await setSessionLock(lockKey, true);
    try {
        const [settings, accounts] = await Promise.all([
            chrome.storage.local.get("autoReloginEnabled"),
            getStoreAccounts(mall),
        ]);
        const selectedId = accountId || accounts[0]?.id || "legacy";
        const account = await getStoreAccount(mall, selectedId);
        const session = await chrome.storage.session.get([
            "autoReloginWindowId",
            "autoReloginTabId",
            "autoReloginStartedAt",
            "autoReloginMall",
            "autoReloginAccountId",
        ]);
        const lang = await getLanguage();
        if (settings.autoReloginEnabled !== true) {
            await chrome.storage.local.set({
                autoReloginStatus: t("enableAutoReloginFirst", {}, lang),
            });
            return false;
        }
        if (!account?.username || !account.password) {
            await chrome.storage.local.set({
                autoReloginStatus: t("missingStoreCredentials", { store: STORE_NAMES[mall] }, lang),
            });
            return false;
        }

        if (session.autoReloginMall && session.autoReloginStartedAt &&
            Date.now() - session.autoReloginStartedAt < 5 * 60 * 1000) {
            try {
                await chrome.tabs.get(session.autoReloginTabId);
                await chrome.storage.local.set({
                    autoReloginStatus: session.autoReloginMall === mall &&
                        session.autoReloginAccountId === selectedId
                        ? t("storeLoginTabAlreadyOpen", { store: STORE_NAMES[mall] }, lang)
                        : t("otherLoginTabRunning", {}, lang),
                });
                return true;
            } catch {
                await clearReloginSession(session.autoReloginTabId, true);
            }
        } else if (Number.isInteger(session.autoReloginTabId)) {
            try { await chrome.tabs.remove(session.autoReloginTabId); } catch {}
        }

        let targetWindowId;
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            if (activeTab?.windowId !== undefined) {
                targetWindowId = activeTab.windowId;
            }
        } catch {}

        if (targetWindowId === undefined) {
            try {
                const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
                if (windows.length > 0) {
                    targetWindowId = windows[0].id;
                }
            } catch {}
        }

        const createProps = {
            url: "about:blank",
            active: false,
        };
        if (targetWindowId !== undefined) {
            createProps.windowId = targetWindowId;
        }
        const reloginTab = await chrome.tabs.create(createProps);
        if (reloginTab.id === undefined) throw new Error(t("cannotCreateLoginTabError", {}, lang));

        await chrome.storage.session.set({
            autoReloginWindowId: reloginTab.windowId ?? targetWindowId,
            autoReloginTabId: reloginTab.id,
            autoReloginStartedAt: Date.now(),
            autoReloginMall: mall,
            autoReloginAccountId: selectedId,
        });
        const currentSettings = await chrome.storage.local.get("autoReloginEnabled");
        if (currentSettings.autoReloginEnabled !== true) {
            await clearReloginSession(reloginTab.id);
            return false;
        }
        await chrome.storage.local.set({
            currentMall: mall,
            autoReloginStatus: t("loggingInBackgroundTab", { store: STORE_NAMES[mall] }, lang),
        });
        const reloginUrl = mall === "lilithstore" ? LILITH_STORE_URL : PLUTOMALL_RELOGIN_URL;
        await chrome.tabs.update(reloginTab.id, { url: reloginUrl, active: false });
        return true;
    } catch (error) {
        console.error(`[LilithDraw] Could not open ${STORE_NAMES[mall]} relogin tab:`, error);
        try {
            const lang = await getLanguage();
            await chrome.storage.local.set({
                autoReloginStatus: t("cannotOpenLoginWindowError", { error: error.message }, lang),
            });
        } catch (storageError) {
            console.error("[LilithDraw] Could not save relogin error status:", storageError);
        }
        return false;
    } finally {
        activeRelogins.delete(reloginKey);
        await setSessionLock(lockKey, false);
    }
}

function getAppIdentifiers(data, lang = DEFAULT_LANGUAGE) {
    const appUid = Number(data.appUid);
    const appId = Number(data.appId);
    if (!Number.isFinite(appUid) || appUid <= 0 || !Number.isFinite(appId) || appId <= 0) {
        throw new Error(t("missingAppIdentifiersError", {}, lang));
    }
    return { appUid, appId };
}

function detectMallFromUrl(url) {
    for (const [mall, config] of Object.entries(STORE_CONFIG)) {
        if (url.includes(config.pageId)) return mall;
    }
    return null;
}

chrome.webRequest.onSendHeaders.addListener(
    async (details) => {
        if (details.tabId < 0) return;

        const authHeader = details.requestHeaders?.find(
            h => h.name?.toLowerCase() === "authorization"
        );
        if (!authHeader?.value) return;

        const session = await chrome.storage.session.get([
            "autoReloginTabId",
            "autoReloginMall",
            "autoReloginAccountId",
        ]);
        let mall = details.tabId === session.autoReloginTabId &&
            STORE_CONFIG[session.autoReloginMall]
            ? session.autoReloginMall
            : detectMallFromUrl(details.url);
        let tab;
        if (details.tabId >= 0) {
            try {
                tab = await chrome.tabs.get(details.tabId);
            } catch {
                tab = undefined;
            }
        }
        if (!mall) {
            if (tab?.url?.includes("plutomall.com")) {
                mall = "plutomall";
            } else if (tab?.url?.includes("store.lilith.com")) {
                mall = "lilithstore";
            }
            if (mall) await chrome.storage.local.set({ currentMall: mall });
        }

        if (!mall) mall = await getCurrentMall();

        if (!tab?.url || !mall || !isReloginStoreUrl(new URL(tab.url), mall)) return;

        if (mall && authHeader?.value) {
            const token = authHeader.value;
            try {
                const urlObj = new URL(details.url);
                const appUid = urlObj.searchParams.get("appUid");
                const appId = urlObj.searchParams.get("appId");

                let accountId = (details.tabId === session.autoReloginTabId && session.autoReloginMall === mall)
                    ? session.autoReloginAccountId
                    : undefined;

                if (!accountId) {
                    const { activeAccountIds = {}, storeAccounts = {} } = await chrome.storage.local.get(["activeAccountIds", "storeAccounts"]);
                    const accounts = Array.isArray(storeAccounts[mall]) ? storeAccounts[mall] : [];
                    if (appUid && accounts.length > 0) {
                        const keys = accounts.map(a => ask(mall, a.id, "appUid"));
                        const stored = await chrome.storage.local.get(keys);
                        const matchingAcc = accounts.find(a => String(stored[ask(mall, a.id, "appUid")] ?? "") === String(appUid));
                        if (matchingAcc) {
                            accountId = matchingAcc.id;
                            if (activeAccountIds[mall] !== accountId) {
                                await chrome.storage.local.set({
                                    activeAccountIds: { ...activeAccountIds, [mall]: accountId },
                                });
                            }
                        }
                    }
                    if (!accountId) {
                        accountId = activeAccountIds[mall] || undefined;
                    }
                }

                const storeUpdate = {};
                const payload = parseJwtPayload(token);
                if (payload?.client_id === "event_lglo") {
                    storeUpdate.token = token;
                    storeUpdate.tokenTimestamp = Date.now();
                    storeUpdate.isValidToken = true;
                }

                if (appUid && appId) {
                    storeUpdate.appUid = appUid;
                    storeUpdate.appId = appId;
                }

                if (Object.keys(storeUpdate).length > 0) {
                    await setStoreData(mall, storeUpdate, accountId);
                    console.log(`[LilithDraw][${mall}] Data captured${accountId ? ` for account ${accountId}` : ""}`);
                }
            } catch (e) {
                console.error("[LilithDraw] webRequest error:", e);
            }
        }
    },
    { urls: ["https://plat-campaign-api.lilithgame.com/*"] },
    ["requestHeaders", "extraHeaders"]
);



const UTC_RESET_ALARM = "utcResetCheck";
const UTC_PRE_RESET_ALARM = "utcPreResetRelogin";

async function checkAndCatchUpUtcReset() {
    try {
        const { autoCheckEnabled, autoCheckMode, utcResetDay = "5", lastUtcResetDate } = await chrome.storage.local.get([
            "autoCheckEnabled",
            "autoCheckMode",
            "utcResetDay",
            "lastUtcResetDate",
        ]);
        const enabled = autoCheckEnabled !== false;
        const mode = autoCheckMode || "utcReset";
        if (!enabled || mode !== "utcReset") return;

        const now = new Date();
        if (isUtcResetMissed(now, utcResetDay, lastUtcResetDate)) {
            const todayStr = getTodayUtcDateString(now);
            await chrome.storage.local.set({ lastUtcResetDate: todayStr });
            console.log(`[LilithDraw] Catching up missed UTC reset for ${todayStr}`);
            await autoDrawAllMalls("triggerCatchUpUtc");
        }
    } catch (e) {
        console.error("[LilithDraw] Could not catch up missed UTC reset:", e);
    }
}

const AUTO_CHECK_ALARM = "dailyResetCheck";
const DEFAULT_AUTO_CHECK_INTERVAL_MINUTES = 60;

async function syncAutoCheckAlarms() {
    try {
        const data = await chrome.storage.local.get([
            "autoCheckEnabled",
            "autoCheckMode",
            "autoCheckIntervalMinutes",
            "utcResetDay",
        ]);

        const enabled = data.autoCheckEnabled !== false;
        const mode = data.autoCheckMode || "utcReset";
        const utcResetDay = data.utcResetDay || "5";
        const intervalMinutes = Number.isSafeInteger(data.autoCheckIntervalMinutes) &&
            data.autoCheckIntervalMinutes >= 1
            ? data.autoCheckIntervalMinutes
            : DEFAULT_AUTO_CHECK_INTERVAL_MINUTES;

        let intervalAlarm = await chrome.alarms.get(AUTO_CHECK_ALARM);
        let utcAlarm = await chrome.alarms.get(UTC_RESET_ALARM);
        let preResetAlarm = await chrome.alarms.get(UTC_PRE_RESET_ALARM);

        const plan = getAlarmSyncPlan({ enabled, mode, intervalMinutes, utcResetDay });
        if (plan.activeMode === "none") {
            if (intervalAlarm) await chrome.alarms.clear(AUTO_CHECK_ALARM);
            if (utcAlarm) await chrome.alarms.clear(UTC_RESET_ALARM);
            if (preResetAlarm) await chrome.alarms.clear(UTC_PRE_RESET_ALARM);
            console.log("[LilithDraw] Automatic check is disabled");
            return;
        }

        if (plan.activeMode === "utcReset") {
            if (intervalAlarm) await chrome.alarms.clear(AUTO_CHECK_ALARM);
            const periodInMinutes = plan.toCreate.periodInMinutes;
            const nextTime = getNextUtcResetTime(utcResetDay);
            if (!utcAlarm || utcAlarm.periodInMinutes !== periodInMinutes || Math.abs(utcAlarm.scheduledTime - nextTime) > 1000) {
                if (utcAlarm) await chrome.alarms.clear(UTC_RESET_ALARM);
                await chrome.alarms.create(UTC_RESET_ALARM, { when: nextTime, periodInMinutes });
                utcAlarm = await chrome.alarms.get(UTC_RESET_ALARM);
                if (utcAlarm) {
                    console.log(`[LilithDraw] UTC reset alarm active (${utcResetDay}); next at ${new Date(utcAlarm.scheduledTime).toUTCString()}`);
                }
            }
            const nextPreResetTime = getPreResetReloginTime(utcResetDay);
            if (!preResetAlarm || preResetAlarm.periodInMinutes !== periodInMinutes || Math.abs(preResetAlarm.scheduledTime - nextPreResetTime) > 1000) {
                if (preResetAlarm) await chrome.alarms.clear(UTC_PRE_RESET_ALARM);
                await chrome.alarms.create(UTC_PRE_RESET_ALARM, { when: nextPreResetTime, periodInMinutes });
            }
        } else {
            // "interval" mode (custom interval)
            if (utcAlarm) await chrome.alarms.clear(UTC_RESET_ALARM);
            if (preResetAlarm) await chrome.alarms.clear(UTC_PRE_RESET_ALARM);
            const periodInMinutes = plan.toCreate.periodInMinutes;
            if (!intervalAlarm || intervalAlarm.periodInMinutes !== periodInMinutes) {
                if (intervalAlarm) await chrome.alarms.clear(AUTO_CHECK_ALARM);
                await chrome.alarms.create(AUTO_CHECK_ALARM, { periodInMinutes });
                intervalAlarm = await chrome.alarms.get(AUTO_CHECK_ALARM);
                if (intervalAlarm) {
                    console.log(`[LilithDraw] Interval check active: every ${intervalAlarm.periodInMinutes}m; next at ${new Date(intervalAlarm.scheduledTime).toLocaleString()}`);
                }
            }
        }
    } catch (e) {
        console.error("[LilithDraw] Could not sync auto check alarms:", e);
    }
}

chrome.runtime.onStartup.addListener(() => {
    void syncAutoCheckAlarms().then(async () => {
        const data = await chrome.storage.local.get(["autoCheckEnabled", "autoCheckMode"]);
        const enabled = data.autoCheckEnabled !== false;
        const mode = data.autoCheckMode || "utcReset";
        if (enabled) {
            if (mode === "interval") {
                await autoDrawAllMalls("triggerChromeStartup");
            } else {
                await checkAndCatchUpUtcReset();
            }
        }
    }).catch(error => {
        console.error("[LilithDraw] Startup auto check failed:", error);
    });
});

chrome.runtime.onInstalled.addListener(() => {
    void syncAutoCheckAlarms();
    void checkAndCatchUpUtcReset();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === AUTO_CHECK_ALARM) {
        console.log("[LilithDraw] Automatic interval check alarm fired");
        void (async () => {
            const data = await chrome.storage.local.get(["autoCheckEnabled", "autoCheckMode"]);
            const enabled = data.autoCheckEnabled !== false;
            const mode = data.autoCheckMode || "utcReset";
            if (enabled && mode === "interval") {
                await autoDrawAllMalls("triggerIntervalAlarm");
            }
        })().catch(error => console.error("[LilithDraw] Scheduled interval check failed:", error));
    } else if (alarm.name === UTC_RESET_ALARM) {
        console.log("[LilithDraw] UTC Reset check alarm fired");
        void (async () => {
            const data = await chrome.storage.local.get(["autoCheckEnabled", "autoCheckMode"]);
            const enabled = data.autoCheckEnabled !== false;
            const mode = data.autoCheckMode || "utcReset";
            if (!enabled || mode !== "utcReset") return;
            const todayStr = getTodayUtcDateString();
            await chrome.storage.local.set({ lastUtcResetDate: todayStr });
            await autoDrawAllMalls("triggerUtcReset");
        })().catch(error => console.error("[LilithDraw] Scheduled UTC reset check failed:", error));
    } else if (alarm.name === UTC_PRE_RESET_ALARM) {
        console.log("[LilithDraw] Pre-reset proactive relogin alarm fired");
        void proactiveReloginExpiringAccounts().catch(error =>
            console.error("[LilithDraw] Pre-reset proactive relogin failed:", error)
        );
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.currentMall || changes.activeAccountIds) {
        void updateBadge().catch(() => {});
    }
    if (
        changes.autoCheckEnabled ||
        changes.autoCheckMode ||
        changes.autoCheckIntervalMinutes ||
        changes.utcResetDay
    ) {
        void syncAutoCheckAlarms();
        void checkAndCatchUpUtcReset();
    }
    for (const mall of Object.keys(STORE_CONFIG)) {
        const accountChanges = Object.keys(changes)
            .map(key => {
                const match = key.match(new RegExp(`^${mall}_account_(.+)_(?:tokenTimestamp|appUid|appId)$`));
                return match?.[1];
            })
            .filter(Boolean);
        if (changes[sk(mall, "tokenTimestamp")] || changes[sk(mall, "appUid")] || changes[sk(mall, "appId")]) {
            accountChanges.push(undefined);
        }
        for (const accountId of new Set(accountChanges)) {
            void refreshStoreAfterRelogin(mall, accountId).catch(error => {
                console.error(`[LilithDraw] Could not refresh after ${mall} token capture:`, error);
            });
        }
    }
    if (changes.autoReloginEnabled?.newValue === false) {
        void (async () => {
            const { autoReloginTabId } = await chrome.storage.session.get("autoReloginTabId");
            await clearReloginSession(autoReloginTabId, true);
            await chrome.storage.local.remove("autoReloginStatus");
        })().catch(error => console.error("[LilithDraw] Could not clear relogin data:", error));
    }
});

void syncAutoCheckAlarms();
void checkAndCatchUpUtcReset();

async function refreshStoreAfterRelogin(mall, accountId) {
    const {
        autoReloginTabId,
        autoReloginStartedAt,
        autoReloginReturnedAt,
        autoReloginReadyAt,
        autoReloginMall,
        autoReloginAccountId,
    } = await chrome.storage.session.get([
        "autoReloginTabId",
        "autoReloginStartedAt",
        "autoReloginReturnedAt",
        "autoReloginReadyAt",
        "autoReloginMall",
        "autoReloginAccountId",
    ]);
    if (
        autoReloginMall !== mall ||
        autoReloginAccountId !== accountId ||
        !autoReloginReturnedAt ||
        !Number.isFinite(autoReloginReadyAt) ||
        !Number.isInteger(autoReloginTabId) ||
        activeReloginRefreshes.has(autoReloginTabId)
    ) return;

    const data = await chrome.storage.local.get([
        ask(mall, accountId, "token"),
        ask(mall, accountId, "tokenTimestamp"),
        ask(mall, accountId, "appUid"),
        ask(mall, accountId, "appId"),
    ]);
    const token = data[ask(mall, accountId, "token")];
    if (
        !token ||
        !Number.isFinite(data[ask(mall, accountId, "tokenTimestamp")]) ||
        data[ask(mall, accountId, "tokenTimestamp")] < autoReloginStartedAt ||
        !data[ask(mall, accountId, "appUid")] ||
        !data[ask(mall, accountId, "appId")]
    ) return;

    activeReloginRefreshes.add(autoReloginTabId);
    let refreshError;
    try {
        const roles = await getRoles(token, mall, true, accountId);
        const totalDrawsLeft = await getTotalDrawsLeft(token, roles, mall, accountId);
        const lang = await getLanguage();
        await chrome.storage.local.set({
            autoReloginStatus: t("reloginSuccessRefreshed", { store: STORE_NAMES[mall], roles: roles.length, draws: totalDrawsLeft }, lang),
        });
        if (totalDrawsLeft > 0) {
            void autoDrawMall(mall, "triggerPostRelogin", accountId);
        }
    } catch (error) {
        refreshError = error.message;
        const lang = await getLanguage();
        await chrome.storage.local.set({
            autoReloginStatus: t("reloginRefreshFailed", { store: STORE_NAMES[mall], error: error.message }, lang),
        });
        console.error(`[LilithDraw] Refresh after ${STORE_NAMES[mall]} relogin failed:`, error);
    } finally {
        await clearReloginSession(autoReloginTabId);
        activeReloginRefreshes.delete(autoReloginTabId);
        await continueReloginSequence(mall, accountId, refreshError);
    }
}

async function markReloginReadyWithoutAccountSwitch(mall, startedAt) {
    const session = await chrome.storage.session.get([
        "autoReloginMall",
        "autoReloginReadyAt",
    ]);
    if (session.autoReloginMall !== mall || session.autoReloginReadyAt) return;
    const lang = await getLanguage();
    if (!Number.isFinite(startedAt)) {
        throw new Error(t("missingReloginStartTimeError", {}, lang));
    }

    await chrome.storage.session.set({ autoReloginReadyAt: startedAt });
    await chrome.storage.local.set({
        autoReloginStatus: t("noAccountSwitchPromptStatus", { store: STORE_NAMES[mall] }, lang),
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;
    void (async () => {
        if (activeReloginRefreshes.has(tabId)) return;
        const {
            autoReloginTabId,
            autoReloginMall,
            autoReloginAccountId,
            autoReloginStartedAt,
            autoReloginReadyAt,
        } = await chrome.storage.session.get([
            "autoReloginTabId",
            "autoReloginMall",
            "autoReloginAccountId",
            "autoReloginStartedAt",
            "autoReloginReadyAt",
        ]);
        if (tabId !== autoReloginTabId) return;
        const url = new URL(tab.url);
        if (!isReloginStoreUrl(url, autoReloginMall)) return;
        if (autoReloginReadyAt) {
            await refreshStoreAfterRelogin(autoReloginMall, autoReloginAccountId);
            return;
        }

        await chrome.storage.session.set({ autoReloginReturnedAt: Date.now() });
        const lang = await getLanguage();
        await chrome.storage.local.set({
            autoReloginStatus: t("returnedToStoreCheckingSwitch", { store: STORE_NAMES[autoReloginMall] }, lang),
        });

        if (activeReloginAccountChecks.has(tabId)) return;
        activeReloginAccountChecks.add(tabId);
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId, frameIds: [0] },
                args: [autoReloginMall],
                func: async mall => {
                    const findVisibleChoice = () => {
                        const candidates = [
                            ...document.querySelectorAll(".adm-center-popup-wrap footer div, .adm-center-popup-wrap footer button, .adm-modal-footer button"),
                        ];
                        for (const el of candidates) {
                            const popup = el.closest(".adm-center-popup-wrap, .adm-modal");
                            if (
                                popup &&
                                el.getClientRects().length > 0 &&
                                popup.getClientRects().length > 0 &&
                                !el.matches(":disabled")
                            ) {
                                return el;
                            }
                        }
                        const fallback = document.querySelector("#renderJsxToDomDiv > div > div.adm-center-popup-wrap > div > div > section > div > footer > div:nth-child(1)");
                        return fallback && fallback.getClientRects().length > 0 ? fallback : null;
                    };
                    const choice = await new Promise(resolve => {
                        let settled = false;
                        const observer = new MutationObserver(check);
                        const timeout = setTimeout(() => finish(null), 10000);

                        function finish(element) {
                            if (settled) return;
                            settled = true;
                            clearTimeout(timeout);
                            observer.disconnect();
                            resolve(element);
                        }

                        function check() {
                            const element = findVisibleChoice();
                            if (element) finish(element);
                        }

                        check();
                        if (!settled) {
                            observer.observe(document.documentElement, {
                                childList: true,
                                subtree: true,
                                attributes: true,
                            });
                        }
                    });
                    if (!choice) return { found: false };

                    const ready = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage(
                            { action: "accountSwitchReady", mall },
                            response => {
                                if (chrome.runtime.lastError) {
                                    reject(new Error(chrome.runtime.lastError.message));
                                } else if (!response?.ok) {
                                    reject(new Error(response?.error || "cannotConfirmAccountSwitchError"));
                                } else {
                                    resolve(response);
                                }
                            }
                        );
                    });
                    if (!ready?.ok) return { found: true, clicked: false };
                    choice.click();
                    return { found: true, clicked: true };
                },
            });
            const result = results[0]?.result;
            if (result?.clicked) {
                console.log(`[LilithDraw][${autoReloginMall}] Switched to the newly logged-in account`);
            } else if (result?.found) {
                const lang = await getLanguage();
                throw new Error(t("accountSwitchClickFailedError", {}, lang));
            } else {
                await markReloginReadyWithoutAccountSwitch(autoReloginMall, autoReloginStartedAt);
            }
        } finally {
            activeReloginAccountChecks.delete(tabId);
        }
        await refreshStoreAfterRelogin(autoReloginMall, autoReloginAccountId);
    })().catch(error => {
        console.error("[LilithDraw] Could not verify relogin redirect:", error);
        void (async () => {
            const lang = await getLanguage();
            await chrome.storage.local.set({
                autoReloginStatus: t("accountSwitchDialogError", { error: error.message }, lang),
            });
        })().catch(storageError => {
            console.error("[LilithDraw] Could not save account-switch error status:", storageError);
        });
    });
});

async function enqueueExpiredAccounts(expiredQueue) {
    if (expiredQueue.length === 0) return;
    const { autoReloginEnabled } = await chrome.storage.local.get("autoReloginEnabled");
    if (autoReloginEnabled !== true) return;
    const session = await chrome.storage.session.get(["autoReloginStartedAt", "autoReloginQueue"]);
    const isRunning = Number.isFinite(session.autoReloginStartedAt) &&
        Date.now() - session.autoReloginStartedAt < 5 * 60 * 1000;
    if (isRunning) {
        const merged = Array.isArray(session.autoReloginQueue) ? [...session.autoReloginQueue] : [];
        for (const item of expiredQueue) {
            if (!merged.some(q => q.mall === item.mall && q.accountId === item.accountId)) {
                merged.push(item);
            }
        }
        await chrome.storage.session.set({ autoReloginQueue: merged });
    } else {
        await chrome.storage.session.set({
            autoReloginQueue: expiredQueue,
            autoReloginQueueIndex: 0,
            autoReloginQueueFailures: [],
        });
        await openReloginWindow(expiredQueue[0].mall, expiredQueue[0].accountId);
    }
}

async function proactiveReloginExpiringAccounts() {
    const data = await chrome.storage.local.get(["autoCheckEnabled", "autoCheckMode", "autoReloginEnabled"]);
    if (data.autoCheckEnabled === false || (data.autoCheckMode || "utcReset") !== "utcReset" || data.autoReloginEnabled !== true) {
        return;
    }
    const expiringQueue = [];
    for (const mall of Object.keys(STORE_CONFIG)) {
        const accounts = await getStoreAccounts(mall);
        const profiles = accounts.length > 0 ? accounts : [{ id: undefined }];
        for (const account of profiles) {
            const accountId = account.id;
            const { token, isValidToken } = await getStoreData(mall, accountId);
            if (!token || isValidToken === false || isJwtExpiringSoon(token, 30 * 60 * 1000)) {
                expiringQueue.push({ mall, accountId });
            }
        }
    }
    await enqueueExpiredAccounts(expiringQueue);
}

async function autoDrawAllMalls(trigger = "triggerAutoCheck") {
    const expiredQueue = [];
    for (const mall of Object.keys(STORE_CONFIG)) {
        const accounts = await getStoreAccounts(mall);
        // No saved accounts: popup and token capture use the unprefixed keys, so must we.
        const profiles = accounts.length > 0 ? accounts : [{ id: undefined }];
        for (const account of profiles) {
            const accountId = account.id;
            try {
                const token = await getToken(mall, accountId);
                if (token && isJwtExpired(token)) {
                    expiredQueue.push({ mall, accountId });
                    continue;
                }
                await autoDrawMall(mall, trigger, accountId);
                const { isValidToken } = await getStoreData(mall, accountId);
                if (token && isValidToken === false && !expiredQueue.some(item => item.mall === mall && item.accountId === accountId)) {
                    expiredQueue.push({ mall, accountId });
                }
            } catch (e) {
                console.error(
                    `[LilithDraw][${mall}][${accountId}] Scheduled draw failed:`,
                    e
                );
            }
        }
    }
    await enqueueExpiredAccounts(expiredQueue);
}

async function autoDrawMall(mall, trigger, accountId) {
    const profileKey = ask(mall, accountId, "draw");
    const lockKey = `lock_draw_${profileKey}`;
    if (activeDraws.has(profileKey) || (await isSessionLocked(lockKey, 5 * 60 * 1000))) return;
    activeDraws.add(profileKey);
    await setSessionLock(lockKey, true);
    await chrome.storage.local.set({ [ask(mall, accountId, "isDrawing")]: true });
    const lang = await getLanguage();
    const triggerText = t(trigger, {}, lang) || trigger;
    const localeTag = lang === "vi" ? "vi-VN" : "en-US";
    const checkedAt = new Date().toLocaleString(localeTag);
    const header = t("logHeaderAt", { trigger: triggerText, time: checkedAt }, lang);
    try {
        await chrome.storage.local.set({
            [ask(mall, accountId, "drawLog")]: [header, t("logCheckingDraws", {}, lang)],
        });
        const token = await getToken(mall, accountId);
        if (!token) {
            await chrome.storage.local.set({
                [ask(mall, accountId, "drawLog")]: [header, t("logSkippedNoToken", {}, lang)],
            });
            return;
        }
        if (isJwtExpired(token)) {
            await setStoreData(mall, { isValidToken: false }, accountId);
            await chrome.storage.local.set({
                [ask(mall, accountId, "drawLog")]: [header, t("logSkippedExpiredToken", {}, lang)],
            });
            void enqueueOrOpenRelogin(mall, accountId);
            return;
        }
        const roles = await getRoles(token, mall, true, accountId);
        const totalDrawsLeft = await getTotalDrawsLeft(token, roles, mall, accountId);
        if (totalDrawsLeft === 0) {
            await chrome.storage.local.set({
                [ask(mall, accountId, "drawLog")]: [
                    header,
                    t("logCheckCompleteNoDrawsSkip", {}, lang),
                ],
            });
            return;
        }
        const log = await runDraws(token, mall, false, accountId, async currentLog => {
            await chrome.storage.local.set({
                [ask(mall, accountId, "drawLog")]: [header, ...currentLog],
            });
        });
        await chrome.storage.local.set({
            [ask(mall, accountId, "drawLog")]: [header, ...log],
        });
    } catch (e) {
        console.error(`[LilithDraw][${mall}][${accountId || "legacy"}] autoDrawMall error:`, e);
        await chrome.storage.local.set({
            [ask(mall, accountId, "drawLog")]: [
                header,
                t("logCheckError", { error: e.message }, lang),
            ],
        });
    } finally {
        activeDraws.delete(profileKey);
        await setSessionLock(lockKey, false);
        await chrome.storage.local.set({ [ask(mall, accountId, "isDrawing")]: false });
    }
}


async function getRoles(token, mall, forceRefresh = false, accountId) {
    if (!forceRefresh) {
        const cached = (await getStoreData(mall, accountId)).roles;
        if (cached?.length > 0) {
            console.log(`[LilithDraw][${mall}] Serving roles from cache (${cached.length})`);
            return cached;
        }
    }

    const config = STORE_CONFIG[mall];
    let json;
    try {
        json = await fetchJson(
            `https://plat-campaign-api.lilithgame.com/page/${config.pageId}/user-roles`,
            {
                method: "GET",
                headers: { authorization: token, "Content-Type": "application/json" }
            },
            accountId
        );
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            await setStoreData(mall, { roles: [], isValidToken: false }, accountId);
        }
        throw error;
    }
    const roles = json?.data?.list;
    if (!Array.isArray(roles)) {
        const lang = await getLanguage();
        throw new Error(t("invalidRoleListError", {}, lang));
    }
    await setStoreData(mall, { roles, isValidToken: true }, accountId);
    return roles;
}

async function getCharacterById(token, roleId, mall, accountId) {
    const cached = (await getStoreData(mall, accountId)).roles;
    if (cached?.length > 0) {
        const hit = cached.find(r => String(r.roleId) === String(roleId));
        if (hit) return hit;
    }
    const roles = await getRoles(token, mall, true, accountId);
    return roles.find(c => String(c.roleId) === String(roleId));
}

async function getManifest(token, role, mall, accountId, cachedIdentifiers = null) {
    const lang = await getLanguage();
    const identifiers = cachedIdentifiers || getAppIdentifiers(await getStoreData(mall, accountId), lang);
    const config = STORE_CONFIG[mall];
    const params = new URLSearchParams({
        language: lang === "vi" ? "vi" : "en", osType: "pc",
        name: role.name, avatar: role.avatar,
        svrId: role.svrId, svrName: "", roleId: role.roleId,
        gmEnvId: "", bbxRegion: "global",
        appId: identifiers.appId, appUid: identifiers.appUid,
        region: "VNM", currency: "VND",
        _t: String(Date.now())
    });
    return fetchJson(
        `https://plat-campaign-api.lilithgame.com/page/${config.pageId}/manifest?${params}`,
        {
            headers: {
                accept: "application/json",
                authorization: token,
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache"
            },
            cache: "no-store"
        },
        accountId
    );
}

async function getTotalDrawsLeft(token, roles, mall, accountId) {
    if (!Array.isArray(roles) || roles.length === 0) {
        const lastCheck = new Date().toLocaleString();
        await setStoreData(mall, { drawsLeft: 0, lastCheck }, accountId);
        return 0;
    }
    let total = 0;
    // shortcut: 3 parallel manifest requests, lower it if the API starts returning HTTP 429.
    for (let i = 0; i < roles.length; i += 3) {
        await Promise.all(roles.slice(i, i + 3).map(async role => {
            try {
                const manifest = await getManifest(token, role, mall, accountId);
                total += getRoleDrawCount(manifest, mall);
            } catch (e) {
                console.warn(`[LilithDraw][${mall}] Error getting draw count for role ${role.roleId}:`, e);
            }
        }));
    }
    const lastCheck = new Date().toLocaleString();
    await setStoreData(mall, { drawsLeft: total, lastCheck }, accountId);
    return total;
}

async function drawOnce(token, role, mall, accountId, cachedIdentifiers) {
    const identifiers = cachedIdentifiers || getAppIdentifiers(await getStoreData(mall, accountId));
    const config = STORE_CONFIG[mall];
    const rolePayload = {
        name: role.name, avatar: role.avatar,
        svrId: role.svrId, svrName: "", roleId: role.roleId,
        gmEnvId: "", bbxRegion: "global",
        appId: identifiers.appId, appUid: identifiers.appUid
    };
    return fetchJson(
        `${DRAW_API}/page/${config.pageId}/trigger`,
        {
            method: "POST",
            headers: {
                authorization: token,
                accept: "application/json",
                "content-type": "application/json;charset=UTF-8"
            },
            body: JSON.stringify({
                language: "en",
                role: rolePayload,
                componentId: config.componentId,
                action: "drawing",
                params: {}
            })
        },
        accountId
    );
}

async function runDraws(token, mall, forceRefreshRoles = false, accountId, onProgress = null) {
    const lang = await getLanguage();
    const startedAt = Date.now();
    const maxRuntimeMs = 4 * 60 * 1000;
    const log = [];
    const sessionRewards = {};
    const sessionRewardIcons = {};
    const roleRewards = new Map();
    let flushedRewards = false;
    const flushSessionRewards = async () => {
        if (flushedRewards || Object.keys(sessionRewards).length === 0) return;
        flushedRewards = true;
        try {
            const data = await chrome.storage.local.get(["rewardTotals", "weeklyStats"]);
            const rewardTotals = mergeRewardTotals(data.rewardTotals, sessionRewards);
            const roleRewardsEntries = [...roleRewards.entries()].map(([role, rewards]) => ({ role, rewards }));
            const weeklyStats = mergeWeeklyStats(data.weeklyStats, getCurrentWeekKey(), mall, roleRewardsEntries);
            await chrome.storage.local.set({ rewardTotals, weeklyStats });
        } catch (e) {
            console.warn("[LilithDraw] Could not flush reward totals:", e);
        }
    };
    const reportProgress = async () => {
        if (typeof onProgress === "function") {
            try {
                await onProgress(log);
            } catch (err) {
                console.warn("[LilithDraw] onProgress error:", err);
            }
        }
    };

    let roles;
    try {
        roles = await getRoles(token, mall, forceRefreshRoles, accountId);
    } catch (e) {
        log.push(t("logLoadRolesError", { error: e.message }, lang));
        await reportProgress();
        return log;
    }

    log.push(t("logFoundRoles", { count: roles.length }, lang));
    await reportProgress();
    if (roles.length === 0) {
        log.push(t("logNoRolesFound", {}, lang));
        await reportProgress();
        return log;
    }

    // Sort or filter roles by favorite characters (favoriteRoleIds & drawFavoritesOnly)
    let filteredByFavorites = false;
    try {
        const favKey = ask(mall, accountId, "favoriteRoleIds");
        const legacyFavKey = `${mall}_favoriteRoleIds`;
        const favData = await chrome.storage.local.get([favKey, legacyFavKey, "drawFavoritesOnly"]);
        const favIds = Array.isArray(favData[favKey])
            ? favData[favKey].map(String)
            : Array.isArray(favData[legacyFavKey])
                ? favData[legacyFavKey].map(String)
                : [];
        const totalRolesCount = roles.length;
        const normalizedRoles = roles.map(r => ({ ...r, roleId: String(r.roleId ?? "") }));
        const filtered = filterRolesForDraw(normalizedRoles, favIds, Boolean(favData.drawFavoritesOnly));
        roles = filtered.rolesToDraw;
        filteredByFavorites = filtered.filteredByFavorites;
        if (filteredByFavorites) {
            log.push(t("logFavoritesFiltered", { matched: roles.length, total: totalRolesCount }, lang));
            await reportProgress();
        }
    } catch (err) {
        console.warn("[LilithDraw] Could not sort/filter roles by favorite:", err);
    }

    const initialStoreData = await getStoreData(mall, accountId);
    let cachedIdentifiers;
    try {
        cachedIdentifiers = getAppIdentifiers(initialStoreData, lang);
    } catch (err) {
        log.push(t("missingAppIdentifiersError", {}, lang) || err.message);
        await reportProgress();
        return log;
    }
    let currentTotalDraws = Number(initialStoreData.drawsLeft);

    let remaining = 0;
    try {
        for (const role of roles) {
            if (Date.now() - startedAt >= maxRuntimeMs) {
                log.push(t("logPausedTimeout", {}, lang));
                await reportProgress();
                return log;
            }
            try {
                const manifest = await getManifest(token, role, mall, accountId, cachedIdentifiers);
                Object.assign(sessionRewardIcons, getRewardIcons(manifest));
                let drawCount = getRoleDrawCount(manifest, mall);
                if (drawCount > 0) {
                    while (drawCount > 0) {
                        if (Date.now() - startedAt >= maxRuntimeMs) {
                            log.push(t("logPausedTimeout", {}, lang));
                            await reportProgress();
                            return log;
                        }
                        try {
                            const result = await drawOnce(token, role, mall, accountId, cachedIdentifiers);
                            const rewardId = result?.data?.rewardId;
                            const reward = getRewardNameById(rewardId, lang) ||
                                (result?.data?.reward ? translateRewardName(result.data.reward, lang) : null) ||
                                (rewardId ? t("rewardFallback", { id: rewardId }, lang) : null);
                            if (!reward) throw new Error(result?.msg || t("missingRewardInfoError", {}, lang));
                            if (rewardId && sessionRewardIcons[rewardId] && !sessionRewardIcons[reward]) {
                                sessionRewardIcons[reward] = sessionRewardIcons[rewardId];
                            }
                            log.push(`[${role.name}] x1 ${reward}`);
                            sessionRewards[reward] = (sessionRewards[reward] || 0) + 1;
                            if (!roleRewards.has(role)) roleRewards.set(role, {});
                            const roleCounts = roleRewards.get(role);
                            roleCounts[reward] = (roleCounts[reward] || 0) + 1;
                            drawCount--;
                            await reportProgress();

                            // Decrement drawsLeft in storage progressively in real time
                            if (Number.isFinite(currentTotalDraws) && currentTotalDraws > 0) {
                                currentTotalDraws = Math.max(0, currentTotalDraws - 1);
                                try {
                                    await setStoreData(mall, { drawsLeft: currentTotalDraws }, accountId);
                                } catch (e) {
                                    console.warn("[LilithDraw] Could not decrement drawsLeft:", e);
                                }
                            }

                            if (drawCount > 0) {
                                await new Promise(r => setTimeout(r, 300));
                            }
                        } catch (drawErr) {
                            const errMsg = drawErr.message || "";
                            if (/resource not enough|not enough|không đủ|hết lượt/i.test(errMsg)) {
                                log.push(t("logOutOfDrawsWithReason", { name: role.name, error: errMsg }, lang));
                                await reportProgress();
                                drawCount = 0;
                                break;
                            } else if (drawErr.status === 401 || drawErr.status === 403 || /hết hạn|expired|invalid/i.test(errMsg)) {
                                log.push(t("logTokenExpiredStopDraw", { name: role.name, error: errMsg }, lang));
                                await reportProgress();
                                return log;
                            } else {
                                throw drawErr;
                            }
                        }
                    }
                } else {
                    log.push(t("logNoDrawsLeftForRole", { name: role.name }, lang));
                    await reportProgress();
                }
                remaining += drawCount;
            } catch (e) {
                const errMsg = e.message || "";
                if (/resource not enough|not enough|không đủ|hết lượt/i.test(errMsg)) {
                    log.push(t("logOutOfDrawsWithReason", { name: role.name, error: errMsg }, lang));
                    await reportProgress();
                } else if (e.status === 401 || e.status === 403 || /hết hạn|expired|invalid/i.test(errMsg)) {
                    log.push(t("logTokenExpiredStopDraw", { name: role.name, error: errMsg }, lang));
                    await reportProgress();
                    return log;
                } else {
                    log.push(t("logRoleError", { name: role.name, error: errMsg }, lang));
                    await reportProgress();
                }
            }
            // Send webhook notification immediately after a character finishes drawing (if rewards won)
            const charRewards = roleRewards.get(role);
            if (charRewards && Object.keys(charRewards).length > 0) {
                const storeName = STORE_NAMES[mall] || mall;
                const wonCount = Object.values(charRewards).reduce((a, b) => a + b, 0);
                const lines = Object.entries(charRewards).map(([name, count]) => {
                    const icon = sessionRewardIcons[name];
                    return icon ? `  x${count} ${name}: ${icon}` : `  x${count} ${name}`;
                }).join("\n");
                const avatar = role.avatar ? `\n  Avatar: ${role.avatar}` : "";
                const notifyText = t("webhookDrawCompleteText", { store: storeName, count: wonCount, name: role.name, avatar, lines }, lang);
                const discordPayload = {
                    username: "Lucky Draw Bot",
                    content: t("webhookDrawCompleteDiscord", { store: storeName, count: wonCount, name: role.name }, lang),
                    embeds: [buildSingleDiscordRewardEmbed(storeName, role, charRewards, sessionRewardIcons, lang)],
                };
                void sendWebhookMessage(notifyText, discordPayload);
                await new Promise(r => setTimeout(r, 800));
            }
        }

        // Draws left = what each role still had after its loop; avoids re-fetching every manifest.
        // When filteredByFavorites is true, non-favorite roles weren't looped, so keep decremented currentTotalDraws.
        const finalDrawsLeft = (filteredByFavorites && Number.isFinite(currentTotalDraws))
            ? currentTotalDraws
            : remaining;
        const localeTag = lang === "vi" ? "vi-VN" : "en-US";
        try {
            await setStoreData(mall, { drawsLeft: finalDrawsLeft, lastCheck: new Date().toLocaleString(localeTag) }, accountId);
        } catch (e) {
            console.warn("[LilithDraw] Could not refresh drawsLeft after runDraws:", e);
        }
    } finally {
        await flushSessionRewards();
    }

    log.push("Done!");
    await reportProgress();
    return log;
}


async function getDrawHistory(token, roleOrRoleId, mall, accountId) {
    const lang = await getLanguage();
    const character = (roleOrRoleId && typeof roleOrRoleId === "object")
        ? roleOrRoleId
        : await getCharacterById(token, roleOrRoleId, mall, accountId);
    if (!character) throw new Error(t("characterNotFoundError", {}, lang));

    const identifiers = getAppIdentifiers(await getStoreData(mall, accountId), lang);
    const config = STORE_CONFIG[mall];
    const params = new URLSearchParams({
        language: lang === "vi" ? "vi" : "en", osType: "pc",
        name: character.name, avatar: character.avatar,
        svrId: character.svrId, svrName: "", roleId: character.roleId,
        gmEnvId: "", bbxRegion: "global",
        appId: identifiers.appId, appUid: identifiers.appUid,
        page: 1, size: 20,
    });
    return fetchJson(
        `https://plat-campaign-api.lilithgame.com/page/${config.pageId}/reward-history?${params}`,
        { headers: { accept: "application/json", authorization: token } },
        accountId
    );
}


function formatDate(date) {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0") + " " +
        String(date.getHours()).padStart(2, "0") + ":" +
        String(date.getMinutes()).padStart(2, "0") + ":" +
        String(date.getSeconds()).padStart(2, "0");
}

async function autoSurvey(csrf, params) {
    if (typeof csrf !== "string" || !csrf || !params || typeof params !== "object") {
        const lang = await getLanguage();
        throw new Error(t("missingSurveyParamsError", {}, lang));
    }
    const end = new Date();
    const start = new Date(end.getTime() - 3 * 60 * 1000);
    const url = new URL("https://q.lilithgame.com/api/answer/collect");
    url.searchParams.set("_csrf", csrf);
    return fetchJson(
        url.toString(),
        {
            method: "POST",
            headers: { "content-type": "application/json;charset=UTF-8" },
            body: JSON.stringify({
                survey_id: params.sid,
                start_time: formatDate(start),
                end_time: formatDate(end),
                pages: [],
                region: params.region,
                role_key: params.role_key,
                sign: params.sign,
                lang: params.lang,
                source: params.source
            })
        }
    );
}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg !== "object") return false;

    if (msg.action === "accountSwitchReady") {
        (async () => {
            const [session, settings] = await Promise.all([
                chrome.storage.session.get([
                    "autoReloginTabId",
                    "autoReloginStartedAt",
                    "autoReloginMall",
                    "autoReloginAccountId",
                ]),
                chrome.storage.local.get("autoReloginEnabled"),
            ]);
            let senderUrl;
            try {
                senderUrl = new URL(sender.url || "");
            } catch {
                senderUrl = null;
            }
            if (
                !STORE_CONFIG[msg.mall] ||
                session.autoReloginMall !== msg.mall ||
                sender.tab?.id !== session.autoReloginTabId ||
                sender.frameId !== 0 ||
                !senderUrl ||
                !isReloginStoreUrl(senderUrl, msg.mall) ||
                !Number.isFinite(session.autoReloginStartedAt) ||
                Date.now() - session.autoReloginStartedAt > 10 * 60 * 1000 ||
                settings.autoReloginEnabled !== true
            ) {
                const lang = await getLanguage();
                sendResponse({ error: t("invalidAccountSwitchSessionError", {}, lang) });
                return;
            }

            const { autoReloginReadyAt } = await chrome.storage.session.get("autoReloginReadyAt");
            if (!autoReloginReadyAt) {
                await chrome.storage.session.set({
                    autoReloginReturnedAt: Date.now(),
                    autoReloginReadyAt: Date.now(),
                    autoReloginAccountSwitch: true,
                });
                const lang = await getLanguage();
                await chrome.storage.local.set({
                    autoReloginStatus: t("accountSwitchDetectedStatus", { store: STORE_NAMES[msg.mall] }, lang),
                });
            }
            sendResponse({ ok: true });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "testRelogin" && STORE_CONFIG[msg.mall]) {
        openReloginWindow(msg.mall, msg.accountId)
            .then(started => sendResponse({ ok: started }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "testReloginSequence" && STORE_CONFIG[msg.mall]) {
        (async () => {
            const accounts = await getStoreAccounts(msg.mall);
            const requestedIds = Array.isArray(msg.accountIds) ? msg.accountIds : [];
            const lang = await getLanguage();
            if (
                requestedIds.length === 0 ||
                requestedIds.some(id => !accounts.some(account =>
                    account.id === id && account.username && account.password
                ))
            ) {
                sendResponse({ error: t("invalidTestAccountListError", {}, lang) });
                return;
            }
            const { autoReloginEnabled } = await chrome.storage.local.get("autoReloginEnabled");
            if (autoReloginEnabled !== true) {
                sendResponse({ error: t("enableAutoReloginFirst", {}, lang) });
                return;
            }
            const runningSession = await chrome.storage.session.get("autoReloginStartedAt");
            if (
                Number.isFinite(runningSession.autoReloginStartedAt) &&
                Date.now() - runningSession.autoReloginStartedAt < 5 * 60 * 1000
            ) {
                sendResponse({ error: t("reloginFlowAlreadyRunningError", {}, lang) });
                return;
            }
            const queue = requestedIds.map(id => ({ mall: msg.mall, accountId: id }));
            await chrome.storage.session.set({
                autoReloginQueue: queue,
                autoReloginQueueIndex: 0,
                autoReloginQueueFailures: [],
            });
            const started = await openReloginWindow(msg.mall, requestedIds[0]);
            if (!started) {
                void continueReloginSequence(msg.mall, requestedIds[0], t("cannotOpenLoginTabError", {}, lang)).catch(error => {
                    console.error("[LilithDraw] Could not continue account-check sequence:", error);
                });
            }
            sendResponse({ ok: true });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "getReloginCredentials") {
        (async () => {
            const [settings, session] = await Promise.all([
                chrome.storage.local.get("autoReloginEnabled"),
                chrome.storage.session.get([
                    "autoReloginWindowId",
                    "autoReloginTabId",
                    "autoReloginStartedAt",
                    "autoReloginMall",
                    "autoReloginAccountId",
                ]),
            ]);
            let origin;
            try {
                origin = new URL(sender.url || "").origin;
            } catch {
                origin = "";
            }
            const mall = session.autoReloginMall;
            const account = await getStoreAccount(mall, session.autoReloginAccountId);
            if (
                !STORE_CONFIG[mall] ||
                origin !== RELOGIN_ORIGINS[mall] ||
                sender.frameId !== 0 ||
                sender.tab?.id !== session.autoReloginTabId ||
                !session.autoReloginStartedAt ||
                Date.now() - session.autoReloginStartedAt > 10 * 60 * 1000 ||
                settings.autoReloginEnabled !== true
            ) {
                const lang = await getLanguage();
                sendResponse({ error: t("noValidReloginSessionError", {}, lang) });
                return;
            }
            sendResponse({
                mall,
                accountId: session.autoReloginAccountId,
                username: account?.username || "",
                password: account?.password || "",
            });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "reloginFinished") {
        (async () => {
            const { autoReloginTabId, autoReloginStartedAt, autoReloginMall, autoReloginAccountId } =
                await chrome.storage.session.get([
                    "autoReloginTabId",
                    "autoReloginStartedAt",
                    "autoReloginMall",
                    "autoReloginAccountId",
                ]);
            let origin;
            try {
                origin = new URL(sender.url || "").origin;
            } catch {
                origin = "";
            }
            const lang = await getLanguage();
            if (
                !STORE_CONFIG[autoReloginMall] ||
                origin !== RELOGIN_ORIGINS[autoReloginMall] ||
                sender.frameId !== 0 ||
                sender.tab?.id !== autoReloginTabId ||
                !autoReloginStartedAt ||
                Date.now() - autoReloginStartedAt > 10 * 60 * 1000
            ) {
                sendResponse({ error: t("invalidReloginReportSourceError", {}, lang) });
                return;
            }
            const storeName = STORE_NAMES[autoReloginMall];
            await chrome.storage.local.set({
                autoReloginStatus: msg.success
                    ? t("reloginSuccessStatus", { store: storeName }, lang)
                    : t("reloginFailedStatus", { store: storeName, error: String(msg.error || t("unknownError", {}, lang)) }, lang),
            });
            if (msg.success) {
                void chrome.notifications.create({
                    type: "basic",
                    iconUrl: "images/icons/icon48.png",
                    title: t("reloginSuccessNotificationTitle", { store: storeName }, lang),
                    message: t("reloginSuccessStatus", { store: storeName }, lang),
                }).catch(() => {});
            } else {
                void chrome.notifications.create({
                    type: "basic",
                    iconUrl: "images/icons/icon48.png",
                    title: t("reloginFailedNotificationTitle", { store: storeName }, lang),
                    message: String(msg.error || t("unknownError", {}, lang)),
                }).catch(() => {});
                await clearReloginSession(autoReloginTabId);
                await continueReloginSequence(
                    autoReloginMall,
                    autoReloginAccountId,
                    String(msg.error || t("unknownError", {}, lang))
                );
            }
            sendResponse({ ok: true });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "getCache") {
        (async () => {
            const mall = STORE_CONFIG[msg.mall] ? msg.mall : await getCurrentMall();
            const data = await getStoreData(mall, msg.accountId);
            const expired = isJwtExpired(data.token);
            if (expired && data.isValidToken !== false) {
                void setStoreData(mall, { isValidToken: false }, msg.accountId);
            }
            sendResponse({
                mall,
                roles: data.roles,
                drawsLeft: data.drawsLeft,
                lastCheck: data.lastCheck,
                isValidToken: expired ? false : data.isValidToken,
                isExpired: expired,
                hasToken: !!data.token,
            });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "refresh") {
        (async () => {
            const lang = await getLanguage();
            const mall = STORE_CONFIG[msg.mall] ? msg.mall : await getCurrentMall();
            const accountId = msg.accountId;
            const token = await getToken(mall, accountId);
            if (!token) { sendResponse({ error: t("noToken", {}, lang), hasToken: false }); return; }
            if (isJwtExpired(token)) {
                await setStoreData(mall, { isValidToken: false }, accountId);
                sendResponse({ error: t("tokenExpired", {}, lang), isValidToken: false, isExpired: true });
                return;
            }
            try {
                const roles = await getRoles(token, mall, true, accountId);
                const totalDrawsLeft = await getTotalDrawsLeft(token, roles, mall, accountId);
                const storeData = await getStoreData(mall, accountId);
                sendResponse({
                    mall,
                    roles,
                    totalDrawsLeft,
                    lastCheck: storeData.lastCheck,
                    isValidToken: storeData.isValidToken ?? true
                });
            } catch (e) {
                const isExp = e.status === 401 || e.status === 403 || /hết hạn|expired|invalid/i.test(e.message);
                if (isExp) {
                    await setStoreData(mall, { isValidToken: false }, accountId);
                }
                sendResponse({ error: e.message, isValidToken: isExp ? false : undefined, isExpired: isExp });
            }
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "drawAll") {
        (async () => {
            await autoDrawAllMalls("triggerDrawAll");
            sendResponse({ ok: true });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "testWebhook") {
        (async () => {
            const lang = await getLanguage();
            let rawUrls = msg.url;
            if (!rawUrls) {
                if (msg.type === "discord") {
                    const data = await chrome.storage.local.get("discordWebhookUrl");
                    rawUrls = data.discordWebhookUrl;
                } else if (msg.type === "telegram") {
                    const data = await chrome.storage.local.get("telegramWebhookUrl");
                    rawUrls = data.telegramWebhookUrl;
                } else {
                    const data = await chrome.storage.local.get(["webhookUrl", "discordWebhookUrl", "telegramWebhookUrl"]);
                    rawUrls = [data.discordWebhookUrl, data.telegramWebhookUrl, data.webhookUrl].filter(Boolean).join("\n");
                }
            }
            const urls = parseWebhookUrls(rawUrls);
            if (urls.length === 0) {
                sendResponse({ ok: false, error: t("noValidWebhookUrlError", {}, lang) });
                return;
            }
            const testDiscordPayload = msg.type === "discord"
                ? {
                    username: "Lucky Draw Bot",
                    content: "🔔 [ROK Auto] Discord Webhook test successful!",
                }
                : null;
            const results = await Promise.allSettled(
                urls.map(u => postSingleWebhook(u, msg.text || t("webhookTestMessage", {}, lang), testDiscordPayload))
            );
            const successCount = results.filter(r => r.status === "fulfilled" && r.value === true).length;
            const failure = results.find(r => r.status === "rejected")?.reason?.message;
            sendResponse({
                ok: successCount > 0,
                successCount,
                totalCount: urls.length,
                error: successCount === 0 ? (failure || t("allWebhooksFailedError", {}, lang)) : undefined
            });
        })().catch(error => sendResponse({ ok: false, error: error.message }));
        return true;
    }

    if (msg.action === "drawNow") {
        let responseSent = false;
        (async () => {
            const lang = await getLanguage();
            const mall = STORE_CONFIG[msg.mall] ? msg.mall : await getCurrentMall();
            const accountId = msg.accountId;
            const profileKey = ask(mall, accountId, "draw");
            const lockKey = `lock_draw_${profileKey}`;
            if (activeDraws.has(profileKey) || (await isSessionLocked(lockKey, 5 * 60 * 1000))) {
                sendResponse({ error: t("drawAlreadyRunningError", {}, lang) });
                responseSent = true;
                return;
            }
            activeDraws.add(profileKey);
            await setSessionLock(lockKey, true);
            await chrome.storage.local.set({ [ask(mall, accountId, "isDrawing")]: true });
            try {
                const token = await getToken(mall, accountId);
                if (!token) {
                    sendResponse({ error: t("noTokenInStorageError", {}, lang) });
                    responseSent = true;
                    return;
                }
                if (isJwtExpired(token)) {
                    await setStoreData(mall, { isValidToken: false }, accountId);
                    sendResponse({ error: t("tokenExpiredReloginError", {}, lang) });
                    responseSent = true;
                    return;
                }
                const storeData = await getStoreData(mall, accountId);
                if (storeData.drawsLeft === 0) {
                    const roles = await getRoles(token, mall, false, accountId);
                    const freshDraws = await getTotalDrawsLeft(token, roles, mall, accountId);
                    if (freshDraws === 0) {
                        await chrome.storage.local.set({
                            [ask(mall, accountId, "drawLog")]: [t("checkCompleteNoDraws", {}, lang)]
                        });
                        sendResponse({ ok: true, drawsLeft: 0 });
                        responseSent = true;
                        return;
                    }
                }
                await chrome.storage.local.set({ [ask(mall, accountId, "drawLog")]: [t("startingDraw", {}, lang)] });
                const log = await runDraws(token, mall, false, accountId, async currentLog => {
                    await chrome.storage.local.set({ [ask(mall, accountId, "drawLog")]: [...currentLog] });
                });
                await chrome.storage.local.set({ [ask(mall, accountId, "drawLog")]: log });
                sendResponse({ ok: true, log });
                responseSent = true;
            } catch (error) {
                if (!responseSent) {
                    sendResponse({ error: error.message });
                    responseSent = true;
                }
                try {
                    await chrome.storage.local.set({
                        [ask(mall, accountId, "drawLog")]: [t("logDrawError", { error: error.message }, lang)]
                    });
                } catch (storageError) {
                    console.error(`[LilithDraw][${mall}] Could not save draw error:`, storageError);
                }
            } finally {
                activeDraws.delete(profileKey);
                await setSessionLock(lockKey, false);
                await chrome.storage.local.set({ [ask(mall, accountId, "isDrawing")]: false });
            }
        })().catch(error => {
            if (!responseSent) {
                sendResponse({ error: error.message });
            }
        });
        return true;
    }

    if (msg.action === "getDrawHistory") {
        (async () => {
            const lang = await getLanguage();
            const mall = STORE_CONFIG[msg.mall] ? msg.mall : await getCurrentMall();
            const accountId = msg.accountId;
            const token = await getToken(mall, accountId);
            if (!token) { sendResponse({ error: t("noToken", {}, lang) }); return; }
            try {
                const character = await getCharacterById(token, msg.roleId, mall, accountId);
                if (!character) throw new Error(t("characterNotFoundError", {}, lang));
                const history = await getDrawHistory(token, character, mall, accountId);
                sendResponse({ history, character });
            } catch (e) {
                sendResponse({ error: e.message });
            }
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.type === "surveyCsrf") {
        (async () => {
            let origin;
            try {
                origin = new URL(sender.url || "").origin;
            } catch {
                origin = "";
            }
            if (origin !== "https://q.lilithgame.com") {
                const lang = await getLanguage();
                throw new Error(t("invalidSurveySourceError", {}, lang));
            }
            const json = await autoSurvey(msg.csrf, msg.params);
            const lang = await getLanguage();
            await chrome.notifications.create({
                type: "basic",
                iconUrl: "images/icons/icon48.png",
                title: "Auto Survey",
                message: `Message: ${json?.msg ?? t("surveySuccessDefault", {}, lang)}, Code: ${json?.ret ?? "-"}`,
                requireInteraction: false
            });
            sendResponse({ ok: true });
        })().catch(error => {
            console.error("[LilithDraw] Auto survey failed:", error);
            sendResponse({ error: error.message });
        });
        return true;
    }
});