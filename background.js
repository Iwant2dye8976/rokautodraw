const DRAW_API = "https://plat-campaign-api.lilithgame.com";
const activeDraws = new Set();
const activeRelogins = new Set();
const activeReloginRefreshes = new Set();
const LILITH_STORE_URL = "https://passport-global.lilith.com/login?client_id=gamepay_lglo&game_id=10043&is_feature=allow_post_events&fallback_referer=https%3A%2F%2Fstore.lilith.com&app_id=2104267&client_icon=https%3A%2F%2Fstatic.farlicdn.com%2Fp%2Fgamepay%2F2.0.0%2Flilith.png&client_name=LiLith+Store&redirect_to=https://store.lilith.com/rok?tab=perks&login_way=S-A&locale=vi";
const PLUTOMALL_RELOGIN_URL = "https://passport.pup.vn/login?client_id=gamepay_lglo&game_id=10043&subject=vn_gamota&is_feature=allow_post_events&fallback_referer=https%3A%2F%2Fwww.plutomall.com.vn&app_id=6626468&client_icon=https%3A%2F%2Fstatic.farlicdn.com%2Fp%2Fgamepay%2F2.0.0%2Fexternal_app.png&client_name=%E1%BB%A8ng+d%E1%BB%A5ng+kh%C3%A1c&redirect_to=https%3A%2F%2Fwww.plutomall.com.vn%2Frok%2Fvn%3Ftab%3Dperks&login_way=S-A&locale=vi";
const RELOGIN_ORIGINS = {
    lilithstore: "https://passport-global.lilith.com",
    plutomall: "https://passport.pup.vn",
};
const STORE_NAMES = {
    lilithstore: "Lilith Store",
    plutomall: "Plutomall",
};

const STORE_CONFIG = {
    plutomall: {
        pageId: "1986696212380155904",
        componentId: "1986690045431939073",
    },
    lilithstore: {
        pageId: "1986695937787461632",
        componentId: "1986689639322648578",
    }
};

const REWARDS = {
    "1986632021321089024": "200 Đá Quý",
    "1986631915360387072": "Tăng tốc 3 giờ",
    "1986631781406900224": "Tăng tốc 8 giờ",
    "1986631671386112000": "500 Đá Quý",
    "1986631555921117184": "Rương Tự Chọn Vật Liệu Trang Bị",
    "1986631409741234176": "Tăng tốc 24 giờ",
    "1986631205541543936": "2.000 Đá Quý"
};


function sk(mall, name) {
    return `${mall}_${name}`;
}

function isExpiredTokenResponse(json) {
    const code = Number(json?.code ?? json?.ret ?? json?.status);
    if (code === 401 || code === 403) return true;
    const message = `${json?.msg ?? ""} ${json?.message ?? ""}`.toLowerCase();
    return /token.{0,30}(expired|invalid|过期|失效|无效)|(?:expired|invalid|过期|失效|无效).{0,30}token|unauthori[sz]ed/.test(message);
}

async function getCurrentMall() {
    const { currentMall } = await chrome.storage.local.get("currentMall");
    return currentMall || "plutomall";
}

async function getStoreData(mall) {
    const keys = [
        sk(mall, "token"),
        sk(mall, "roles"),
        sk(mall, "drawsLeft"),
        sk(mall, "lastCheck"),
        sk(mall, "appUid"),
        sk(mall, "appId"),
        sk(mall, "isValidToken"),
    ];
    const data = await chrome.storage.local.get(keys);
    return {
        token: data[sk(mall, "token")] ?? null,
        roles: data[sk(mall, "roles")] ?? [],
        drawsLeft: data[sk(mall, "drawsLeft")] ?? null,
        lastCheck: data[sk(mall, "lastCheck")] ?? null,
        appUid: data[sk(mall, "appUid")] ?? null,
        appId: data[sk(mall, "appId")] ?? null,
        isValidToken: data[sk(mall, "isValidToken")] ?? null,
    };
}

async function setStoreData(mall, partial) {
    const mapped = {};
    for (const [k, v] of Object.entries(partial)) {
        mapped[sk(mall, k)] = v;
    }
    await chrome.storage.local.set(mapped);
}


async function getToken(mall) {
    const m = mall ?? await getCurrentMall();
    const data = await getStoreData(m);
    return data.token ?? null;
}

async function fetchJson(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
        let response;
        try {
            response = await fetch(url, { ...options, signal: controller.signal });
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("Yêu cầu hết thời gian chờ");
            }
            throw new Error(`Lỗi kết nối: ${error.message}`);
        }

        if (response.status === 401 || response.status === 403) {
            const mall = detectMallFromUrl(url);
            if (mall) void openReloginWindow(mall);
        }

        let json;
        try {
            json = await response.json();
        } catch {
            const error = new Error(`Phản hồi API không phải JSON (HTTP ${response.status})`);
            error.status = response.status;
            throw error;
        }
        if (response.ok && isExpiredTokenResponse(json)) {
            const mall = detectMallFromUrl(url);
            if (mall) void openReloginWindow(mall);
            const error = new Error(json?.msg || json?.message || "Token đã hết hạn");
            error.status = 401;
            throw error;
        }
        if (!response.ok) {
            const error = new Error(json?.msg || json?.message || `API trả về HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return json;
    } finally {
        clearTimeout(timeout);
    }
}

async function openReloginWindow(mall) {
    if (!STORE_CONFIG[mall]) return false;
    if (activeRelogins.has(mall)) return true;
    activeRelogins.add(mall);
    try {
        const usernameKey = `${mall}Username`;
        const passwordKey = `${mall}Password`;
        const settings = await chrome.storage.local.get([
            "autoReloginEnabled",
            usernameKey,
            passwordKey,
        ]);
        const session = await chrome.storage.session.get([
            "autoReloginWindowId",
            "autoReloginTabId",
            "autoReloginStartedAt",
            "autoReloginMall",
        ]);
        if (settings.autoReloginEnabled !== true) {
            await chrome.storage.local.set({
                autoReloginStatus: "Hãy bật Auto đăng nhập lại trước khi kiểm tra.",
            });
            return false;
        }
        if (!settings[usernameKey] || !settings[passwordKey]) {
            await chrome.storage.local.set({
                autoReloginStatus: `Thiếu tài khoản hoặc mật khẩu ${mall === "lilithstore" ? "Lilith Store" : "Plutomall"}.`,
            });
            return false;
        }

        if (session.autoReloginMall && session.autoReloginStartedAt &&
            Date.now() - session.autoReloginStartedAt < 5 * 60 * 1000) {
            try {
                await chrome.tabs.get(session.autoReloginTabId);
                await chrome.storage.local.set({
                    autoReloginStatus: session.autoReloginMall === mall
                        ? `Tab đăng nhập ${mall === "lilithstore" ? "Lilith Store" : "Plutomall"} đã đang mở.`
                        : "Một tab tự đăng nhập khác đang chạy.",
                });
                return true;
            } catch {
                await chrome.storage.session.remove([
                    "autoReloginWindowId",
                    "autoReloginTabId",
                    "autoReloginStartedAt",
                    "autoReloginMall",
                    "autoReloginReturnedAt",
                ]);
            }
        }

        const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (activeTab?.windowId === undefined) {
            throw new Error("Không tìm thấy cửa sổ trình duyệt hiện tại");
        }
        const reloginTab = await chrome.tabs.create({
            windowId: activeTab.windowId,
            url: "about:blank",
            active: false,
        });
        if (reloginTab.id === undefined) throw new Error("Không tạo được tab đăng nhập");

        await chrome.storage.session.set({
            autoReloginWindowId: activeTab.windowId,
            autoReloginTabId: reloginTab.id,
            autoReloginStartedAt: Date.now(),
            autoReloginMall: mall,
        });
        const currentSettings = await chrome.storage.local.get("autoReloginEnabled");
        if (currentSettings.autoReloginEnabled !== true) {
            await chrome.tabs.remove(reloginTab.id);
            await chrome.storage.session.remove([
                "autoReloginWindowId",
                "autoReloginTabId",
                "autoReloginStartedAt",
                "autoReloginMall",
                "autoReloginReturnedAt",
            ]);
            return false;
        }
        await chrome.storage.local.set({
            currentMall: mall,
            autoReloginStatus: `Đang đăng nhập ${mall === "lilithstore" ? "Lilith Store" : "Plutomall"} trong tab nền`,
        });
        const reloginUrl = mall === "lilithstore" ? LILITH_STORE_URL : PLUTOMALL_RELOGIN_URL;
        await chrome.tabs.update(reloginTab.id, { url: reloginUrl, active: false });
        return true;
    } catch (error) {
        console.error(`[LilithDraw] Could not open ${STORE_NAMES[mall]} relogin tab:`, error);
        try {
            await chrome.storage.local.set({
                autoReloginStatus: `Không thể mở cửa sổ đăng nhập: ${error.message}`,
            });
        } catch (storageError) {
            console.error("[LilithDraw] Could not save relogin error status:", storageError);
        }
        return false;
    } finally {
        activeRelogins.delete(mall);
    }
}

function getAppIdentifiers(data) {
    const appUid = Number(data.appUid);
    const appId = Number(data.appId);
    if (!Number.isFinite(appUid) || appUid <= 0 || !Number.isFinite(appId) || appId <= 0) {
        throw new Error("Thiếu appUid/appId. Hãy mở lại trang cửa hàng để lấy thông tin.");
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
        const authHeader = details.requestHeaders?.find(
            h => h.name?.toLowerCase() === "authorization"
        );

        const session = await chrome.storage.session.get([
            "autoReloginTabId",
            "autoReloginMall",
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

        if (mall && authHeader?.value) {
            const token = authHeader.value;
            try {
                const urlObj = new URL(details.url);
                const appUid = urlObj.searchParams.get("appUid");
                const appId = urlObj.searchParams.get("appId");

                const tokenPart = token.replace(/^Bearer\s+/i, "").split(".")[1];
                if (tokenPart) {
                    const base64 = tokenPart.replace(/-/g, "+").replace(/_/g, "/");
                    const payload = JSON.parse(
                        atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
                    );
                    if (payload.client_id === "event_lglo") {
                        const tokenTimestamp = Date.now();
                        await setStoreData(mall, { token, tokenTimestamp });
                        await chrome.storage.local.set({ tokenTimestamp });
                        console.log(`[LilithDraw][${mall}] Campaign token captured`);
                    }
                }

                if (appUid && appId) {
                    await setStoreData(mall, { appUid, appId });
                    console.log(`[LilithDraw][${mall}] appUid and appId captured`);
                    try {
                        if (tab?.url?.includes("plutomall.com") || tab?.url?.includes("store.lilith.com")) {
                            await chrome.action.openPopup();
                        }
                    } catch (e) {
                        console.warn("[LilithDraw] Could not open popup:", e.message);
                    }
                }
            } catch (e) {
                console.error("[LilithDraw] webRequest error:", e);
            }
        }
    },
    { urls: ["https://plat-campaign-api.lilithgame.com/*"] },
    ["requestHeaders", "extraHeaders"]
);


chrome.runtime.onStartup.addListener(async () => {
    chrome.alarms.get("dailyResetCheck", (alarm) => {
        if (!alarm) chrome.alarms.create("dailyResetCheck", { periodInMinutes: 60 });
    });
    await autoDrawAllMalls();
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.get("dailyResetCheck", (alarm) => {
        if (!alarm) {
            chrome.alarms.create("dailyResetCheck", { periodInMinutes: 60 });
            console.log("[LilithDraw] Alarm created");
        }
    });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "dailyResetCheck") {
        await autoDrawAllMalls();
    }
});

async function refreshStoreAfterRelogin(mall) {
    const {
        autoReloginTabId,
        autoReloginStartedAt,
        autoReloginReturnedAt,
        autoReloginMall,
    } = await chrome.storage.session.get([
        "autoReloginTabId",
        "autoReloginStartedAt",
        "autoReloginReturnedAt",
        "autoReloginMall",
    ]);
    if (
        autoReloginMall !== mall ||
        !autoReloginReturnedAt ||
        !Number.isInteger(autoReloginTabId) ||
        activeReloginRefreshes.has(autoReloginTabId)
    ) return;

    const data = await chrome.storage.local.get([
        sk(mall, "token"),
        sk(mall, "tokenTimestamp"),
        sk(mall, "appUid"),
        sk(mall, "appId"),
    ]);
    const token = data[sk(mall, "token")];
    if (
        !token ||
        !Number.isFinite(data[sk(mall, "tokenTimestamp")]) ||
        data[sk(mall, "tokenTimestamp")] <= autoReloginStartedAt ||
        !data[sk(mall, "appUid")] ||
        !data[sk(mall, "appId")]
    ) return;

    activeReloginRefreshes.add(autoReloginTabId);
    try {
        const roles = await getRoles(token, mall, true);
        const totalDrawsLeft = await getTotalDrawsLeft(token, roles, mall);
        await chrome.storage.local.set({
            autoReloginStatus: `Đăng nhập ${STORE_NAMES[mall]} thành công; đã làm mới ${roles.length} nhân vật, còn ${totalDrawsLeft} lượt.`,
        });
    } catch (error) {
        await chrome.storage.local.set({
            autoReloginStatus: `Đăng nhập ${STORE_NAMES[mall]} xong nhưng làm mới thất bại: ${error.message}`,
        });
        console.error(`[LilithDraw] Refresh after ${STORE_NAMES[mall]} relogin failed:`, error);
    } finally {
        await chrome.storage.session.remove([
            "autoReloginWindowId",
            "autoReloginTabId",
            "autoReloginStartedAt",
            "autoReloginMall",
            "autoReloginReturnedAt",
        ]);
        activeReloginRefreshes.delete(autoReloginTabId);
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;
    void (async () => {
        if (activeReloginRefreshes.has(tabId)) return;
        const { autoReloginTabId, autoReloginMall } = await chrome.storage.session.get([
            "autoReloginTabId",
            "autoReloginMall",
        ]);
        if (tabId !== autoReloginTabId) return;
        const url = new URL(tab.url);
        const returnedToStore = autoReloginMall === "lilithstore"
            ? url.origin === "https://store.lilith.com" && url.pathname.startsWith("/rok")
            : autoReloginMall === "plutomall" &&
                url.origin === "https://www.plutomall.com.vn" &&
                url.pathname.startsWith("/rok/vn");
        if (!returnedToStore) return;
        await chrome.storage.session.set({ autoReloginReturnedAt: Date.now() });
        await chrome.storage.local.set({
            autoReloginStatus: `Đã trở về ${STORE_NAMES[autoReloginMall]}; đang chờ token mới để làm mới dữ liệu.`,
        });
        await refreshStoreAfterRelogin(autoReloginMall);
    })().catch(error => console.error("[LilithDraw] Could not verify relogin redirect:", error));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    for (const mall of Object.keys(STORE_CONFIG)) {
        if (
            changes[sk(mall, "tokenTimestamp")] ||
            changes[sk(mall, "appUid")] ||
            changes[sk(mall, "appId")]
        ) {
            void refreshStoreAfterRelogin(mall).catch(error => {
                console.error(`[LilithDraw] Could not refresh after ${mall} token capture:`, error);
            });
        }
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || changes.autoReloginEnabled?.newValue !== false) return;
    void (async () => {
        const { autoReloginTabId } = await chrome.storage.session.get("autoReloginTabId");
        if (Number.isInteger(autoReloginTabId)) {
            try {
                await chrome.tabs.remove(autoReloginTabId);
            } catch (error) {
                if (!/No tab with id/i.test(error.message)) throw error;
            }
        }
        await chrome.storage.session.remove([
            "autoReloginWindowId",
            "autoReloginTabId",
            "autoReloginStartedAt",
            "autoReloginMall",
            "autoReloginReturnedAt",
        ]);
        await chrome.storage.local.remove([
            "autoReloginStatus",
        ]);
    })().catch(error => console.error("[LilithDraw] Could not clear relogin data:", error));
});

async function autoDrawAllMalls() {
    for (const mall of Object.keys(STORE_CONFIG)) {
        try {
            await autoDrawMall(mall);
        } catch (e) {
            console.error(`[LilithDraw][${mall}] Scheduled draw failed:`, e);
        }
    }
}

async function autoDrawMall(mall) {
    if (activeDraws.has(mall)) return;
    activeDraws.add(mall);
    try {
        const token = await getToken(mall);
        if (!token) return;
        const log = await runDraws(token, mall, true);
        await chrome.storage.local.set({ [sk(mall, "drawLog")]: log });
    } catch (e) {
        console.error(`[LilithDraw][${mall}] autoDrawMall error:`, e);
    } finally {
        activeDraws.delete(mall);
    }
}


async function getRoles(token, mall, forceRefresh = false) {
    if (!forceRefresh) {
        const cached = (await getStoreData(mall)).roles;
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
            }
        );
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            await setStoreData(mall, { roles: [], isValidToken: false });
        }
        throw error;
    }
    const roles = json?.data?.list;
    if (!Array.isArray(roles)) {
        throw new Error("Phản hồi danh sách nhân vật không hợp lệ");
    }
    await setStoreData(mall, { roles, isValidToken: true });
    return roles;
}

async function getCharacterById(token, roleId, mall) {
    const cached = (await getStoreData(mall)).roles;
    if (cached?.length > 0) {
        const hit = cached.find(r => String(r.roleId) === String(roleId));
        if (hit) return hit;
    }
    const roles = await getRoles(token, mall, true);
    return roles.find(c => String(c.roleId) === String(roleId));
}

async function getManifest(token, role, mall) {
    const identifiers = getAppIdentifiers(await getStoreData(mall));
    const config = STORE_CONFIG[mall];
    const params = new URLSearchParams({
        language: "vi", osType: "pc",
        name: role.name, avatar: role.avatar,
        svrId: role.svrId, svrName: "", roleId: role.roleId,
        gmEnvId: "", bbxRegion: "global",
        appId: identifiers.appId, appUid: identifiers.appUid,
        region: "VNM", currency: "VND"
    });
    return fetchJson(
        `https://plat-campaign-api.lilithgame.com/page/${config.pageId}/manifest?${params}`,
        { headers: { accept: "application/json", authorization: token } }
    );
}

async function getTotalDrawsLeft(token, roles, mall) {
    let total = 0;
    for (const role of roles) {
        const manifest = await getManifest(token, role, mall);
        if (manifest) {
            const drawCount = manifest?.data?.campaigns?.[0]?.displayModules?.[0]?.components?.[0]?.params?.curDrawTimes;
            const count = Number(drawCount);
            if (Number.isFinite(count) && count > 0) total += count;
        }
    }
    const lastCheck = new Date().toLocaleString();
    await setStoreData(mall, { drawsLeft: total, lastCheck });
    return total;
}

async function drawOnce(token, role, mall) {
    const identifiers = getAppIdentifiers(await getStoreData(mall));
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
        }
    );
}

async function runDraws(token, mall, forceRefreshRoles = false) {
    const startedAt = Date.now();
    const maxRuntimeMs = 4 * 60 * 1000;
    const log = [];
    let roles;
    try {
        roles = await getRoles(token, mall, forceRefreshRoles);
    } catch (e) {
        log.push(`Lỗi khi tải thông tin nhân vật: ${e.message}`);
        return log;
    }

    log.push(`Tìm thấy ${roles.length} nhân vật`);
    if (roles.length === 0) {
        log.push("Không tìm thấy nhân vật nào");
        return log;
    }

    for (const role of roles) {
        if (Date.now() - startedAt >= maxRuntimeMs) {
            log.push("Đã tạm dừng để tránh quá thời gian chạy; có thể bấm quay lại để tiếp tục.");
            return log;
        }
        try {
            const manifest = await getManifest(token, role, mall);
            const drawCount = Number(manifest?.data?.campaigns?.[0]?.displayModules?.[0]?.components?.[0]?.params?.curDrawTimes ?? 0);
            if (drawCount > 0) {
                const result = await drawOnce(token, role, mall);
                const rewardId = result?.data?.rewardId;
                const reward = REWARDS[rewardId] || result?.data?.reward ||
                    (rewardId ? `Phần thưởng ${rewardId}` : null);
                if (!reward) throw new Error(result?.msg || "Phản hồi quay thưởng thiếu thông tin phần thưởng");
                log.push(`[${role.name}] x1 ${reward}`);
            } else {
                log.push(`[${role.name}] Không còn lượt quay nào`);
            }
        } catch (e) {
            log.push(`[${role.name}] Lỗi: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 500));
    }

    log.push("Done!");
    return log;
}


async function getDrawHistory(token, roleId, mall) {
    const character = await getCharacterById(token, roleId, mall);
    if (!character) throw new Error("Không tìm thấy thông tin nhân vật");

    const identifiers = getAppIdentifiers(await getStoreData(mall));
    const config = STORE_CONFIG[mall];
    const params = new URLSearchParams({
        language: "vi", osType: "pc",
        name: character.name, avatar: character.avatar,
        svrId: character.svrId, svrName: "", roleId: character.roleId,
        gmEnvId: "", bbxRegion: "global",
        appId: identifiers.appId, appUid: identifiers.appUid,
        page: 1, size: 20,
    });
    return fetchJson(
        `https://plat-campaign-api.lilithgame.com/page/${config.pageId}/reward-history?${params}`,
        { headers: { accept: "application/json", authorization: token } }
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
        throw new Error("Thiếu mã CSRF hoặc tham số khảo sát");
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

    if (msg.action === "testRelogin" && STORE_CONFIG[msg.mall]) {
        openReloginWindow(msg.mall)
            .then(started => sendResponse({ ok: started }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "getReloginCredentials") {
        (async () => {
            const [settings, session] = await Promise.all([
                chrome.storage.local.get([
                    "autoReloginEnabled",
                    "lilithstoreUsername",
                    "lilithstorePassword",
                    "plutomallUsername",
                    "plutomallPassword",
                ]),
                chrome.storage.session.get([
                    "autoReloginWindowId",
                    "autoReloginTabId",
                    "autoReloginStartedAt",
                    "autoReloginMall",
                ]),
            ]);
            let origin;
            try {
                origin = new URL(sender.url || "").origin;
            } catch {
                origin = "";
            }
            const mall = session.autoReloginMall;
            if (
                !STORE_CONFIG[mall] ||
                origin !== RELOGIN_ORIGINS[mall] ||
                sender.frameId !== 0 ||
                sender.tab?.id !== session.autoReloginTabId ||
                !session.autoReloginStartedAt ||
                Date.now() - session.autoReloginStartedAt > 10 * 60 * 1000 ||
                settings.autoReloginEnabled !== true
            ) {
                sendResponse({ error: "Không có phiên tự đăng nhập hợp lệ" });
                return;
            }
            sendResponse({
                mall,
                username: settings[`${mall}Username`] || "",
                password: settings[`${mall}Password`] || "",
            });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "reloginFinished") {
        (async () => {
            const { autoReloginTabId, autoReloginStartedAt, autoReloginMall } =
                await chrome.storage.session.get([
                    "autoReloginTabId",
                    "autoReloginStartedAt",
                    "autoReloginMall",
                ]);
            let origin;
            try {
                origin = new URL(sender.url || "").origin;
            } catch {
                origin = "";
            }
            if (
                !STORE_CONFIG[autoReloginMall] ||
                origin !== RELOGIN_ORIGINS[autoReloginMall] ||
                sender.frameId !== 0 ||
                sender.tab?.id !== autoReloginTabId ||
                !autoReloginStartedAt ||
                Date.now() - autoReloginStartedAt > 10 * 60 * 1000
            ) {
                sendResponse({ error: "Nguồn báo trạng thái đăng nhập không hợp lệ" });
                return;
            }
            await chrome.storage.local.set({
                autoReloginStatus: msg.success
                    ? `Đăng nhập ${STORE_NAMES[autoReloginMall]} thành công`
                    : `Đăng nhập ${STORE_NAMES[autoReloginMall]} thất bại: ${String(msg.error || "Lỗi không xác định")}`,
            });
            sendResponse({ ok: true });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "getCache") {
        (async () => {
            const mall = STORE_CONFIG[msg.mall] ? msg.mall : await getCurrentMall();
            const data = await getStoreData(mall);
            sendResponse({
                mall,
                roles: data.roles,
                drawsLeft: data.drawsLeft,
                lastCheck: data.lastCheck,
                isValidToken: data.isValidToken,
                hasToken: !!data.token,
            });
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "refresh") {
        (async () => {
            const mall = STORE_CONFIG[msg.mall] ? msg.mall : await getCurrentMall();
            const token = await getToken(mall);
            if (!token) { sendResponse({ error: "Không có token" }); return; }
            try {
                const roles = await getRoles(token, mall, true);
                const totalDrawsLeft = await getTotalDrawsLeft(token, roles, mall);
                const storeData = await getStoreData(mall);
                sendResponse({
                    mall,
                    roles,
                    totalDrawsLeft,
                    lastCheck: storeData.lastCheck,
                    isValidToken: storeData.isValidToken ?? true
                });
            } catch (e) {
                sendResponse({ error: e.message });
            }
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "drawNow") {
        (async () => {
            const mall = STORE_CONFIG[msg.mall] ? msg.mall : await getCurrentMall();
            if (activeDraws.has(mall)) {
                sendResponse({ error: "Đang có lượt quay chạy cho cửa hàng này" });
                return;
            }
            activeDraws.add(mall);
            let responseSent = false;
            try {
                const token = await getToken(mall);
                if (!token) {
                    sendResponse({ error: "Không có token trong bộ nhớ. Vui lòng mở trang quay thưởng trước." });
                    return;
                }
                await chrome.storage.local.set({ [sk(mall, "drawLog")]: ["Bắt đầu quay thưởng..."] });
                sendResponse({ ok: true });
                responseSent = true;
                const log = await runDraws(token, mall);
                await chrome.storage.local.set({ [sk(mall, "drawLog")]: log });
            } catch (error) {
                if (!responseSent) {
                    sendResponse({ error: error.message });
                } else {
                    try {
                        await chrome.storage.local.set({
                            [sk(mall, "drawLog")]: [`Lỗi khi quay thưởng: ${error.message}`]
                        });
                    } catch (storageError) {
                        console.error(`[LilithDraw][${mall}] Could not save draw error:`, storageError);
                    }
                }
            } finally {
                activeDraws.delete(mall);
            }
        })().catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (msg.action === "getDrawHistory") {
        (async () => {
            const mall = STORE_CONFIG[msg.mall] ? msg.mall : await getCurrentMall();
            const token = await getToken(mall);
            if (!token) { sendResponse({ error: "Không có token" }); return; }
            try {
                const [history, character] = await Promise.all([
                    getDrawHistory(token, msg.roleId, mall),
                    getCharacterById(token, msg.roleId, mall),
                ]);
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
                throw new Error("Nguồn yêu cầu khảo sát không hợp lệ");
            }
            const json = await autoSurvey(msg.csrf, msg.params);
            await chrome.notifications.create({
                type: "basic",
                iconUrl: "images/icons/icon48.png",
                title: "Auto Survey",
                message: `Message: ${json?.msg ?? "Không có thông báo"}, Code: ${json?.ret ?? "—"}`,
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