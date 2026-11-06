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

function getJwtExp(token) {
    if (!token || typeof token !== "string") return null;
    try {
        const parts = token.replace(/^Bearer\s+/i, "").trim().split(".");
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
        return typeof payload?.exp === "number" ? payload.exp : null;
    } catch {
        return null; // not a standard JWT
    }
}

function isJwtExpired(token) {
    const exp = getJwtExp(token);
    return exp !== null && Math.floor(Date.now() / 1000) >= exp;
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

if (typeof module !== "undefined") {
    module.exports = {
        STORE_CONFIG, STORE_NAMES, isReloginStoreUrl, accountStorageKey,
        getJwtExp, isJwtExpired, isExpiredTokenResponse, parseWebhookUrls, buildWebhookBody,
        getRewardIcons, buildSingleDiscordRewardEmbed, getRoleDrawCount,
        getNextUtcResetTime, getTodayUtcDateString, isUtcResetMissed,
        normalizeSearchText, matchesSearch, toCsv,
    };
}
