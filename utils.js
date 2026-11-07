// Pure helpers shared by background.js (importScripts), popup.js (<script>) and test.js (require).

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

const STORE_HOSTS = {
    lilithstore: /^store\.lilith\.com$/,
    plutomall: /^(www\.)?plutomall\.com(\.vn)?$/,
};

function isReloginStoreUrl(url, mall) {
    const hosts = STORE_HOSTS[mall];
    return Boolean(
        hosts &&
        url.protocol === "https:" &&
        hosts.test(url.hostname) &&
        url.pathname.startsWith("/rok")
    );
}

function accountStorageKey(mall, accountId, name) {
    return accountId ? `${mall}_account_${accountId}_${name}` : `${mall}_${name}`;
}

function parseJwtPayload(token) {
    if (!token || typeof token !== "string") return null;
    try {
        const parts = token.replace(/^Bearer\s+/i, "").trim().split(".");
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
        return payload && typeof payload === "object" ? payload : null;
    } catch {
        return null; // not a standard JWT
    }
}

function getJwtExp(token) {
    const payload = parseJwtPayload(token);
    return typeof payload?.exp === "number" ? payload.exp : null;
}

function isJwtExpired(token) {
    const exp = getJwtExp(token);
    return exp !== null && Math.floor(Date.now() / 1000) >= exp;
}

function isJwtExpiringSoon(token, withinMs = 30 * 60 * 1000, nowMs = Date.now()) {
    if (!token) return true;
    const exp = getJwtExp(token);
    return exp !== null && exp * 1000 <= nowMs + withinMs;
}

function isExpiredTokenResponse(json) {
    const rawCode = json?.code ?? json?.ret ?? json?.status;
    if (rawCode !== undefined && rawCode !== null) {
        const code = Number(rawCode);
        if (code === 401 || code === 403 || code === 1001 || code === 1002 || code === 20004 || code === 20005) return true;
    }
    const message = `${json?.msg ?? ""} ${json?.message ?? ""}`.toLowerCase();
    return /token.{0,30}(expired|invalid|timeout|过期|失效|无效)|(?:expired|invalid|timeout|过期|失效|无效).{0,30}token|unauthori[sz]ed|not\s*login|user\s*not\s*login|session\s*expired|login\s*expired|auth\s*fail/i.test(message);
}

function parseWebhookUrls(rawInput) {
    if (!rawInput) return [];
    const lines = Array.isArray(rawInput) ? rawInput : String(rawInput).split("\n");
    return [...new Set(lines.map(u => String(u).trim()).filter(u => u.startsWith("http")))];
}

function buildWebhookBody(webhookUrl, text, discordPayload = null) {
    if (webhookUrl.includes("discord.com/api/webhooks") || webhookUrl.includes("discordapp.com/api/webhooks")) {
        return discordPayload || { content: text };
    }
    if (webhookUrl.includes("api.telegram.org/bot")) {
        const chatId = new URL(webhookUrl).searchParams.get("chat_id");
        return chatId ? { chat_id: chatId, text } : { text };
    }
    return { text, content: text };
}

function getRewardIcons(manifest) {
    const icons = {};
    const visited = new WeakSet();
    const visit = value => {
        if (!value || typeof value !== "object" || visited.has(value)) return;
        visited.add(value);
        if (value.id && typeof value.icon === "string" && value.icon.startsWith("http")) {
            icons[String(value.id)] = value.icon;
            if (value.name) icons[String(value.name)] = value.icon;
        }
        for (const child of Object.values(value)) visit(child);
    };
    visit(manifest);
    return icons;
}

function buildSingleDiscordRewardEmbed(storeName, role, rewards, sessionRewardIcons) {
    const rewardLines = Object.entries(rewards).map(([name, count]) => {
        const icon = sessionRewardIcons[name];
        return (icon && typeof icon === "string" && icon.startsWith("http"))
            ? `**[${name}](${icon}) x${count}**`
            : `**${name} x${count}**`;
    }).join("\n");

    const embed = {
        title: `🎉 LUCKY DRAW - ${storeName.toUpperCase()}`,
        color: 16757578,
        fields: [
            {
                name: "👤 Nhân vật",
                value: `**${role.name || "N/A"}**`,
                inline: true,
            },
            {
                name: "🆔 Character ID",
                value: String(role.roleId || "N/A"),
                inline: true,
            },
            {
                name: "🎁 Phần thưởng",
                value: rewardLines || "**Không có vật phẩm**",
                inline: false,
            },
        ],
        footer: {
            text: `${storeName} • Lucky Draw System`,
        },
        timestamp: new Date().toISOString(),
    };

    if (role.avatar && typeof role.avatar === "string" && role.avatar.startsWith("http")) {
        embed.thumbnail = { url: role.avatar };
    }

    const firstIcon = Object.keys(rewards)
        .map(name => sessionRewardIcons[name])
        .find(u => u && typeof u === "string" && u.startsWith("http"));
    if (firstIcon) {
        embed.image = { url: firstIcon };
    }

    return embed;
}

function getRoleDrawCount(manifest, mall) {
    const componentId = STORE_CONFIG[mall]?.componentId;
    if (!componentId || !manifest || typeof manifest !== "object") {
        throw new Error(`Không tìm thấy manifest hợp lệ cho ${STORE_NAMES[mall]}`);
    }

    const counters = [];
    const visited = new WeakSet();
    const visit = value => {
        if (!value || typeof value !== "object" || visited.has(value)) return;
        visited.add(value);

        if (
            value.params &&
            typeof value.params === "object" &&
            Object.prototype.hasOwnProperty.call(value.params, "curDrawTimes")
        ) {
            const identifiers = [
                value.componentId,
                value.component_id,
                value.componentID,
                value.id,
                value.cid,
            ].filter(identifier => identifier !== undefined && identifier !== null)
                .map(String);
            counters.push({
                rawCount: value.params.curDrawTimes,
                matchesComponent: identifiers.includes(componentId),
            });
        }

        for (const child of Object.values(value)) visit(child);
    };
    visit(manifest);

    const matchingCounters = counters.filter(counter => counter.matchesComponent);
    const candidates = matchingCounters.length > 0
        ? matchingCounters
        : counters.length === 1 ? counters : [];
    if (candidates.length !== 1) {
        throw new Error(
            `Không xác định được bộ đếm lượt quay của ${STORE_NAMES[mall]} trong manifest`
        );
    }

    const rawCount = candidates[0].rawCount;
    if (typeof rawCount === "string" && rawCount.trim() === "") {
        throw new Error(`Bộ đếm lượt quay của ${STORE_NAMES[mall]} không hợp lệ`);
    }
    const count = Number(rawCount);
    if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error(`Bộ đếm lượt quay của ${STORE_NAMES[mall]} không hợp lệ`);
    }
    return count;
}

function getNextUtcResetTime(targetDay = "5", referenceTime = Date.now()) {
    const now = new Date(referenceTime);
    const target = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 5, 0, 0
    ));

    if (targetDay === "everyday" || targetDay === "daily") {
        if (target.getTime() <= now.getTime()) {
            target.setUTCDate(target.getUTCDate() + 1);
        }
        return target.getTime();
    }

    const dayNum = Number(targetDay);
    let daysToAdd = (dayNum - now.getUTCDay() + 7) % 7;
    if (daysToAdd === 0 && target.getTime() <= now.getTime()) {
        daysToAdd = 7;
    }
    target.setUTCDate(target.getUTCDate() + daysToAdd);
    return target.getTime();
}

function getPreResetReloginTime(targetDay = "5", referenceTime = Date.now()) {
    const nextReset = getNextUtcResetTime(targetDay, referenceTime);
    const preReset = nextReset - 15 * 60 * 1000;
    if (preReset > referenceTime) return preReset;
    const periodMs = (targetDay === "everyday" || targetDay === "daily")
        ? 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;
    return preReset + periodMs;
}

function getCurrentWeekKey(now = new Date()) {
    const d = now instanceof Date ? now : new Date(now);
    const candidate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    let daysSinceFriday = (d.getUTCDay() - 5 + 7) % 7;
    if (daysSinceFriday === 0) {
        const friResetToday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 5, 0, 0);
        if (d.getTime() < friResetToday) daysSinceFriday = 7;
    }
    candidate.setUTCDate(candidate.getUTCDate() - daysSinceFriday);
    return candidate.toISOString().slice(0, 10);
}

function getTodayUtcDateString(d = new Date()) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

function isUtcResetMissed(now, targetDay = "5", lastCheckedDate) {
    const todayStr = getTodayUtcDateString(now);
    if (lastCheckedDate === todayStr) return false;

    const isTodayResetDay = targetDay === "everyday" || targetDay === "daily" || now.getUTCDay() === Number(targetDay);
    if (!isTodayResetDay) return false;

    const targetToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 5, 0, 0);
    return now.getTime() >= targetToday;
}

function normalizeSearchText(str) {
    return String(str ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

function matchesSearch(role, rawQuery) {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    const qNorm = normalizeSearchText(q);
    const name = String(role.name ?? "").toLowerCase();
    const id = String(role.roleId ?? "").toLowerCase();
    const svr = String(role.svrId ?? "").toLowerCase();
    return name.includes(q) || id.includes(q) || svr.includes(q) ||
        normalizeSearchText(name).includes(qNorm) ||
        normalizeSearchText(svr).includes(qNorm);
}

function toCsv(rows) {
    return "\uFEFF" + rows
        .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
}

function stripStoreAccountsPasswords(storeAccounts) {
    if (!storeAccounts || typeof storeAccounts !== "object") return storeAccounts;
    const stripped = {};
    for (const [mall, accounts] of Object.entries(storeAccounts)) {
        stripped[mall] = Array.isArray(accounts)
            ? accounts.map(acc => ({ id: acc.id, username: acc.username, password: "" }))
            : [];
    }
    return stripped;
}

function mergeRewardTotals(existing, sessionRewards) {
    const totals = { ...(existing || {}) };
    for (const [name, count] of Object.entries(sessionRewards || {})) {
        totals[name] = (totals[name] || 0) + count;
    }
    return totals;
}

const REWARD_POINTS = {
    "2.000 Đá Quý": 2000,
    "Tăng tốc 24 giờ": 1500,
    "Rương Tự Chọn Vật Liệu Trang Bị": 1400,
    "Tăng tốc 8 giờ": 600,
    "500 Đá Quý": 500,
    "Tăng tốc 3 giờ": 300,
    "200 Đá Quý": 200,
};

function getRewardPoints(rewardName) {
    return Object.prototype.hasOwnProperty.call(REWARD_POINTS, rewardName)
        ? REWARD_POINTS[rewardName]
        : 100;
}

function filterRolesForDraw(roles, favIds, drawFavoritesOnly) {
    const favSet = new Set(Array.isArray(favIds) ? favIds : []);
    const sorted = [...(roles || [])].sort((a, b) => (favSet.has(b.roleId) ? 1 : 0) - (favSet.has(a.roleId) ? 1 : 0));
    if (drawFavoritesOnly) {
        const favRoles = sorted.filter(r => favSet.has(r.roleId));
        if (favRoles.length > 0) {
            return { rolesToDraw: favRoles, filteredByFavorites: true };
        }
    }
    return { rolesToDraw: sorted, filteredByFavorites: false };
}

function mergeWeeklyStats(existingWeeklyStats, weekKey, mall, roleRewardsEntries) {
    const isSameWeek = existingWeeklyStats && existingWeeklyStats.weekKey === weekKey;
    const rewardTotals = isSameWeek && existingWeeklyStats.rewardTotals
        ? { ...existingWeeklyStats.rewardTotals }
        : {};
    const characterScores = isSameWeek && existingWeeklyStats.characterScores
        ? { ...existingWeeklyStats.characterScores }
        : {};

    for (const entry of roleRewardsEntries || []) {
        const role = entry?.role;
        const rewards = entry?.rewards || {};
        if (!role?.roleId) continue;

        const charKey = `${mall}:${role.roleId}`;
        const prev = characterScores[charKey] || {
            name: role.name || String(role.roleId),
            roleId: String(role.roleId),
            svrId: String(role.svrId || ""),
            mall,
            score: 0,
            draws: 0,
            rewards: {},
        };
        const mergedCharRewards = { ...(prev.rewards || {}) };
        let addedScore = 0;
        let addedDraws = 0;

        for (const [rewardName, count] of Object.entries(rewards)) {
            const num = Number(count) || 0;
            if (num <= 0) continue;
            rewardTotals[rewardName] = (rewardTotals[rewardName] || 0) + num;
            mergedCharRewards[rewardName] = (mergedCharRewards[rewardName] || 0) + num;
            addedScore += getRewardPoints(rewardName) * num;
            addedDraws += num;
        }

        characterScores[charKey] = {
            ...prev,
            name: role.name || prev.name,
            svrId: String(role.svrId || prev.svrId || ""),
            score: (prev.score || 0) + addedScore,
            draws: (prev.draws || 0) + addedDraws,
            rewards: mergedCharRewards,
        };
    }

    return { weekKey, rewardTotals, characterScores };
}

function bytesToBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function deriveAesGcmKey(passphrase, saltBytes, iterations = 100000) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptJsonWithPassphrase(data, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = 100000;
    const key = await deriveAesGcmKey(passphrase, salt, iterations);
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    return {
        kdf: "PBKDF2-SHA256",
        iterations,
        cipher: "AES-GCM",
        salt: bytesToBase64(salt),
        iv: bytesToBase64(iv),
        data: bytesToBase64(new Uint8Array(cipherBuf)),
    };
}

async function decryptJsonWithPassphrase(envelope, passphrase) {
    try {
        const salt = base64ToBytes(envelope.salt);
        const iv = base64ToBytes(envelope.iv);
        const cipherBytes = base64ToBytes(envelope.data);
        const iterations = Number(envelope.iterations) || 100000;
        const key = await deriveAesGcmKey(passphrase, salt, iterations);
        const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
        return JSON.parse(new TextDecoder().decode(plainBuf));
    } catch {
        throw new Error("Mật khẩu giải mã không đúng hoặc dữ liệu bị hỏng.");
    }
}

function buildExportSettings(selectedKeys, storedSettings, currentSettings) {
    const settings = {};
    for (const key of selectedKeys) {
        if (Object.prototype.hasOwnProperty.call(storedSettings, key)) {
            settings[key] = storedSettings[key];
        } else if (Object.prototype.hasOwnProperty.call(currentSettings, key)) {
            settings[key] = currentSettings[key];
        }
    }
    if (selectedKeys.includes("webhookEnabled") && typeof storedSettings.webhookUrl === "string") {
        settings.webhookUrl = storedSettings.webhookUrl;
    }
    if (selectedKeys.includes("autoCheckMode") && (storedSettings.utcResetDay || currentSettings.utcResetDay)) {
        settings.utcResetDay = storedSettings.utcResetDay || currentSettings.utcResetDay || "5";
    }
    if (selectedKeys.includes("rewardTotals") && storedSettings.weeklyStats && typeof storedSettings.weeklyStats === "object") {
        settings.weeklyStats = storedSettings.weeklyStats;
    }
    return settings;
}

const CONFIG_SETTING_VALIDATORS = {
    drawFavoritesOnly: value => typeof value === "boolean",
    autoReloginEnabled: value => typeof value === "boolean",
    autoCheckIntervalMinutes: value => Number.isSafeInteger(value) && value >= 1,
    autoCheckEnabled: value => typeof value === "boolean",
    autoCheckMode: value => typeof value === "string" && ["utcReset", "interval"].includes(value),
    theme: value => typeof value === "string" && ["light", "dark", "system"].includes(value),
    utcResetDay: value => typeof value === "string" || Number.isInteger(value),
    lastUtcResetDate: value => typeof value === "string",
    webhookEnabled: value => typeof value === "boolean",
    webhookUrl: value => typeof value === "string",
    rewardTotals: value => Boolean(value && typeof value === "object" && !Array.isArray(value)),
    weeklyStats: value => Boolean(
        value && typeof value === "object" && !Array.isArray(value) &&
        typeof value.weekKey === "string" &&
        value.rewardTotals && typeof value.rewardTotals === "object" && !Array.isArray(value.rewardTotals) &&
        value.characterScores && typeof value.characterScores === "object" && !Array.isArray(value.characterScores)
    ),
    encryptedStoreAccounts: value => Boolean(
        value && typeof value === "object" && !Array.isArray(value) &&
        typeof value.salt === "string" && typeof value.iv === "string" && typeof value.data === "string"
    ),
    storeAccounts: value => Boolean(value && typeof value === "object" &&
        !Array.isArray(value) && ["plutomall", "lilithstore"].every(mall =>
            Array.isArray(value[mall]) &&
            value[mall].every(account =>
                account && typeof account.id === "string" &&
                /^[A-Za-z0-9-]+$/.test(account.id) &&
                typeof account.username === "string" && typeof account.password === "string"
            ) &&
            new Set(value[mall].map(account => account?.id)).size === value[mall].length
        )),
    favoriteRoleIds: value => Boolean(value && typeof value === "object" &&
        !Array.isArray(value) && ["plutomall", "lilithstore"].every(mall =>
            value[mall] && typeof value[mall] === "object" &&
            !Array.isArray(value[mall]) &&
            Object.entries(value[mall]).every(([accountId, roleIds]) =>
                (!accountId || /^[A-Za-z0-9-]+$/.test(accountId)) &&
                Array.isArray(roleIds) && roleIds.every(roleId => typeof roleId === "string")
            )
        )),
    tokens: value => Boolean(value && typeof value === "object" &&
        !Array.isArray(value) && ["plutomall", "lilithstore"].every(mall =>
            value[mall] && typeof value[mall] === "object" &&
            !Array.isArray(value[mall]) &&
            Object.entries(value[mall]).every(([accountId, token]) =>
                (!accountId || /^[A-Za-z0-9-]+$/.test(accountId)) &&
                typeof token === "string"
            )
        )),
    plutomallUsername: value => typeof value === "string",
    plutomallPassword: value => typeof value === "string",
    lilithstoreUsername: value => typeof value === "string",
    lilithstorePassword: value => typeof value === "string",
};

if (typeof module !== "undefined") {
    module.exports = {
        STORE_CONFIG, STORE_NAMES, isReloginStoreUrl, accountStorageKey,
        parseJwtPayload, getJwtExp, isJwtExpired, isJwtExpiringSoon, isExpiredTokenResponse, parseWebhookUrls, buildWebhookBody,
        getRewardIcons, buildSingleDiscordRewardEmbed, getRoleDrawCount,
        getNextUtcResetTime, getPreResetReloginTime, getCurrentWeekKey, getTodayUtcDateString, isUtcResetMissed,
        normalizeSearchText, matchesSearch, toCsv,
        stripStoreAccountsPasswords, mergeRewardTotals, REWARD_POINTS, getRewardPoints,
        filterRolesForDraw, mergeWeeklyStats, encryptJsonWithPassphrase, decryptJsonWithPassphrase,
        buildExportSettings, CONFIG_SETTING_VALIDATORS,
    };
}
