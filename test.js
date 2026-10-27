const test = require("node:test");
const assert = require("node:assert/strict");

// --- 1. isJwtExpired ---
function isJwtExpired(token) {
    if (!token || typeof token !== "string") return false;
    try {
        const clean = token.replace(/^Bearer\s+/i, "").trim();
        const parts = clean.split(".");
        if (parts.length < 2) return false;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonStr = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
        const payload = JSON.parse(jsonStr);
        if (typeof payload?.exp === "number") {
            return Math.floor(Date.now() / 1000) >= payload.exp;
        }
    } catch {}
    return false;
}

test("isJwtExpired correctly identifies valid and expired tokens", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const makeJwt = exp => `header.${btoa(JSON.stringify({ exp, client_id: "event_lglo" }))}.sig`;

    assert.equal(isJwtExpired(makeJwt(futureExp)), false, "Future token should not be expired");
    assert.equal(isJwtExpired(makeJwt(pastExp)), true, "Past token should be expired");
    assert.equal(isJwtExpired("Bearer " + makeJwt(pastExp)), true, "Bearer token should be expired");
    assert.equal(isJwtExpired("invalid.token"), false, "Malformed token should not throw");
    assert.equal(isJwtExpired(""), false, "Empty string should not throw");
    assert.equal(isJwtExpired(null), false, "Null token should not throw");
});

// --- 2. isExpiredTokenResponse ---
function isExpiredTokenResponse(json, url) {
    const rawCode = json?.code ?? json?.ret ?? json?.status;
    if (rawCode !== undefined && rawCode !== null) {
        const code = Number(rawCode);
        if (code === 401 || code === 403 || code === 1001 || code === 1002 || code === 20004 || code === 20005) return true;
    }
    const message = `${json?.msg ?? ""} ${json?.message ?? ""}`.toLowerCase();
    const hasExpiredTokenMessage =
        /token.{0,30}(expired|invalid|timeout|过期|失效|无效)|(?:expired|invalid|timeout|过期|失效|无效).{0,30}token|unauthori[sz]ed|not\s*login|user\s*not\s*login|session\s*expired|login\s*expired|auth\s*fail/i.test(message);
    return hasExpiredTokenMessage;
}

test("isExpiredTokenResponse detects expired codes without looping on empty roles", () => {
    assert.equal(isExpiredTokenResponse({ code: 1002, msg: "token expired" }), true);
    assert.equal(isExpiredTokenResponse({ code: 401 }), true);
    assert.equal(isExpiredTokenResponse({ code: 0, msg: "ok" }), false);
    // Crucial regression test for Finding 4: empty user-roles list must NOT be treated as expired token
    const emptyRolesResponse = { code: 0, msg: "ok", data: { list: [] } };
    assert.equal(
        isExpiredTokenResponse(emptyRolesResponse, "https://plat-campaign-api.lilithgame.com/page/123/user-roles"),
        false,
        "Empty user-roles list should not trigger token expiration"
    );
});

// --- 3. getRoleDrawCount ---
function getRoleDrawCount(manifest, componentId) {
    if (!componentId || !manifest || typeof manifest !== "object") {
        throw new Error("Invalid manifest");
    }
    const counters = [];
    const visited = new WeakSet();
    const visit = value => {
        if (!value || typeof value !== "object" || visited.has(value)) return;
        visited.add(value);
        if (value.params && typeof value.params === "object" && Object.prototype.hasOwnProperty.call(value.params, "curDrawTimes")) {
            const identifiers = [value.componentId, value.component_id, value.componentID, value.id, value.cid]
                .filter(id => id !== undefined && id !== null)
                .map(String);
            counters.push({
                rawCount: value.params.curDrawTimes,
                matchesComponent: identifiers.includes(componentId),
            });
        }
        for (const child of Object.values(value)) visit(child);
    };
    visit(manifest);

    const matching = counters.filter(c => c.matchesComponent);
    const candidate = matching.length > 0 ? matching[0] : (counters.length === 1 ? counters[0] : null);
    if (!candidate) throw new Error("Counter not found");
    return Number(candidate.rawCount);
}

test("getRoleDrawCount extracts draw count from nested manifest", () => {
    const compId = "1986690045431939073";
    const manifest = {
        data: {
            modules: [
                {
                    componentId: compId,
                    params: { curDrawTimes: 3 }
                }
            ]
        }
    };
    assert.equal(getRoleDrawCount(manifest, compId), 3);
});

// --- 4. normalizeSearchText & matchesSearch ---
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

test("matchesSearch handles Vietnamese names and server IDs", () => {
    const role = { name: "Chiến Thần Độc Cô", roleId: "12345678", svrId: "1055" };
    assert.equal(matchesSearch(role, "chien"), true, "Diacritics insensitive");
    assert.equal(matchesSearch(role, "doc co"), true, "d vs đ match");
    assert.equal(matchesSearch(role, "1055"), true, "Server ID match");
    assert.equal(matchesSearch(role, "9999"), false, "Non-matching query");
});

// --- 5. Multi-mall relogin queue progression ---
function progressQueue(queue, currentIndex, expectedMall, expectedAccountId, failure) {
    if (!Array.isArray(queue) || !queue[currentIndex]) return null;
    const current = queue[currentIndex];
    if (current.mall !== expectedMall || current.accountId !== expectedAccountId) return null;
    const failures = failure ? [{ mall: expectedMall, accountId: expectedAccountId, error: failure }] : [];
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
        return { nextIndex, nextItem: queue[nextIndex], failures };
    }
    return { finished: true, failures };
}

test("relogin queue advances sequentially across multiple stores", () => {
    const queue = [
        { mall: "plutomall", accountId: "p1" },
        { mall: "lilithstore", accountId: "l1" },
    ];
    assert.equal(progressQueue(queue, 0, "lilithstore", "p1"), null, "Reject wrong mall");
    const step1 = progressQueue(queue, 0, "plutomall", "p1");
    assert.equal(step1.nextIndex, 1);
    assert.equal(step1.nextItem.mall, "lilithstore");
    assert.equal(step1.nextItem.accountId, "l1");

    const step2 = progressQueue(queue, 1, "lilithstore", "l1");
    assert.equal(step2.finished, true);
});

// --- 6. Export storeAccounts password stripping & validation ---
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

const validateStoreAccounts = value => value && typeof value === "object" &&
    !Array.isArray(value) && ["plutomall", "lilithstore"].every(mall =>
        Array.isArray(value[mall]) &&
        value[mall].every(account =>
            account && typeof account.id === "string" &&
            /^[A-Za-z0-9-]+$/.test(account.id) &&
            typeof account.username === "string" && typeof account.password === "string"
        ) &&
        new Set(value[mall].map(account => account?.id)).size === value[mall].length
    );

test("stripStoreAccountsPasswords removes plaintext passwords and passes validator", () => {
    const rawAccounts = {
        plutomall: [
            { id: "acc-1", username: "user1@example.com", password: "SuperSecretPassword123" }
        ],
        lilithstore: [
            { id: "acc-2", username: "user2@example.com", password: "AnotherSecret456" }
        ]
    };

    const exported = stripStoreAccountsPasswords(rawAccounts);

    assert.equal(exported.plutomall[0].password, "");
    assert.equal(exported.lilithstore[0].password, "");
    assert.equal(exported.plutomall[0].username, "user1@example.com");
    assert.equal(exported.lilithstore[0].id, "acc-2");
    assert.equal(validateStoreAccounts(exported), true, "Stripped accounts must pass schema validator");
});

// --- 7. getNextUtcResetTime & isUtcResetMissed ---
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

function isUtcResetMissed(now, targetDay = "5", lastCheckedDate) {
    const todayStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
    if (lastCheckedDate === todayStr) return false;

    const isTodayResetDay = targetDay === "everyday" || targetDay === "daily" || now.getUTCDay() === Number(targetDay);
    if (!isTodayResetDay) return false;

    const targetToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 5, 0, 0);
    return now.getTime() >= targetToday;
}

test("getNextUtcResetTime targets Friday 00:05 UTC correctly", () => {
    // 2026-10-27 is a Tuesday (UTCDay = 2)
    const tuesday = Date.UTC(2026, 9, 27, 8, 30, 0);
    const nextFriday = new Date(getNextUtcResetTime("5", tuesday));
    assert.equal(nextFriday.getUTCDay(), 5, "Must be a Friday");
    assert.equal(nextFriday.getUTCDate(), 30, "Next Friday is Oct 30");
    assert.equal(nextFriday.getUTCHours(), 0);
    assert.equal(nextFriday.getUTCMinutes(), 5);

    // On Friday Oct 30 after 00:05 UTC (e.g. 07:00 UTC) -> should schedule next Friday (Nov 6)
    const fridayAfter = Date.UTC(2026, 9, 30, 7, 0, 0);
    const nextNextFriday = new Date(getNextUtcResetTime("5", fridayAfter));
    assert.equal(nextNextFriday.getUTCDay(), 5);
    assert.equal(nextNextFriday.getUTCDate(), 6, "Must advance 7 days to Nov 6");

    // Everyday mode
    const nextDaily = new Date(getNextUtcResetTime("everyday", tuesday));
    assert.equal(nextDaily.getUTCDate(), 28, "Advances 1 day in everyday mode");
});

test("isUtcResetMissed detects missed runs when opening browser late on reset day", () => {
    // Friday Oct 30 at 7:00 AM UTC (missed 00:05 UTC)
    const friday7am = new Date(Date.UTC(2026, 9, 30, 7, 0, 0));
    assert.equal(isUtcResetMissed(friday7am, "5", "2026-10-23"), true, "Missed Friday reset should trigger catch-up");

    // Friday Oct 30 at 7:00 AM UTC but already ran today
    assert.equal(isUtcResetMissed(friday7am, "5", "2026-10-30"), false, "Already ran today, do not repeat");

    // Saturday Oct 31 at 7:00 AM UTC (not a reset day)
    const saturday7am = new Date(Date.UTC(2026, 9, 31, 7, 0, 0));
    assert.equal(isUtcResetMissed(saturday7am, "5", "2026-10-23"), false, "Not Friday, should not trigger");

    // Friday Oct 30 at 00:01 AM UTC (before 00:05 UTC)
    const fridayBefore = new Date(Date.UTC(2026, 9, 30, 0, 1, 0));
    assert.equal(isUtcResetMissed(fridayBefore, "5", "2026-10-23"), false, "Before 00:05 UTC, not yet missed");
});

// --- 8. CSV formatting ---
function formatCsv(rows) {
    return "\uFEFF" + rows
        .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
}

test("formatCsv handles special characters, commas, quotes and UTF-8 BOM", () => {
    const rows = [
        ["Tên", "Mô tả", "Số lượng"],
        ["Đá Quý", 'Rương "Đặc Biệt", vip 10', 500],
    ];
    const csv = formatCsv(rows);
    assert.equal(csv.startsWith("\uFEFF"), true, "Must include BOM for Excel Vietnamese display");
    assert.equal(csv.includes('"Rương ""Đặc Biệt"", vip 10"'), true, "Quotes and commas properly escaped");
});

// --- 9. Webhook payload formatting ---
function formatWebhookPayload(webhookUrl, text) {
    let body;
    if (webhookUrl.includes("discord.com/api/webhooks") || webhookUrl.includes("discordapp.com/api/webhooks")) {
        body = { content: text };
    } else if (webhookUrl.includes("api.telegram.org/bot")) {
        const urlObj = new URL(webhookUrl);
        const chatId = urlObj.searchParams.get("chat_id");
        body = chatId ? { chat_id: chatId, text } : { text };
    } else {
        body = { text, content: text };
    }
    return body;
}

test("formatWebhookPayload shapes Discord and Telegram payloads correctly", () => {
    const discordUrl = "https://discord.com/api/webhooks/123/xyz";
    const telegramUrl = "https://api.telegram.org/bot12345:TOKEN/sendMessage?chat_id=98765";
    const genericUrl = "https://hooks.slack.com/services/custom";

    const dPayload = formatWebhookPayload(discordUrl, "Hello Discord");
    assert.deepEqual(dPayload, { content: "Hello Discord" });

    const tPayload = formatWebhookPayload(telegramUrl, "Hello Telegram");
    assert.deepEqual(tPayload, { chat_id: "98765", text: "Hello Telegram" });

    const gPayload = formatWebhookPayload(genericUrl, "Hello Slack");
    assert.deepEqual(gPayload, { text: "Hello Slack", content: "Hello Slack" });
});

// --- 10. CONFIG_SETTING_VALIDATORS for new settings ---
const validators = {
    utcResetSyncEnabled: value => typeof value === "boolean",
    webhookEnabled: value => typeof value === "boolean",
    webhookUrl: value => typeof value === "string",
    rewardTotals: value => value && typeof value === "object" && !Array.isArray(value),
};

test("validators correctly check new settings", () => {
    assert.equal(validators.utcResetSyncEnabled(true), true);
    assert.equal(validators.utcResetSyncEnabled("yes"), false);
    assert.equal(validators.webhookEnabled(false), true);
    assert.equal(validators.webhookUrl("https://discord.com"), true);
    assert.equal(validators.webhookUrl(123), false);
    assert.equal(validators.rewardTotals({ "200 Đá Quý": 5 }), true);
    assert.equal(validators.rewardTotals([1, 2, 3]), false);
});

// --- 11. parseWebhookUrls multi-webhook parser ---
function parseWebhookUrls(rawInput) {
    if (!rawInput) return [];
    const lines = Array.isArray(rawInput) ? rawInput : String(rawInput).split("\n");
    return [...new Set(lines.map(u => String(u).trim()).filter(u => u.startsWith("http")))];
}

test("parseWebhookUrls handles multiple line-separated URLs, whitespace and invalid lines", () => {
    const raw = `
        https://discord.com/api/webhooks/1/aaa   
        https://api.telegram.org/bot123/sendMessage?chat_id=456

        not-a-valid-url
        https://discord.com/api/webhooks/1/aaa
    `;
    const parsed = parseWebhookUrls(raw);
    assert.equal(parsed.length, 2, "Should deduplicate and filter invalid lines");
    assert.equal(parsed[0], "https://discord.com/api/webhooks/1/aaa");
    assert.equal(parsed[1], "https://api.telegram.org/bot123/sendMessage?chat_id=456");
    assert.deepEqual(parseWebhookUrls(""), []);
    assert.deepEqual(parseWebhookUrls(null), []);
});

// --- 12. safeRewardTotals null guard ---
function mergeRewardTotals(existing, sessionRewards) {
    const totals = existing || {};
    for (const [name, count] of Object.entries(sessionRewards)) {
        totals[name] = (totals[name] || 0) + count;
    }
    return totals;
}

test("mergeRewardTotals handles null and undefined existing storage without throwing", () => {
    const resNull = mergeRewardTotals(null, { "200 Đá Quý": 2 });
    assert.equal(resNull["200 Đá Quý"], 2);

    const resUndefined = mergeRewardTotals(undefined, { "200 Đá Quý": 1 });
    assert.equal(resUndefined["200 Đá Quý"], 1);

    const resExisting = mergeRewardTotals({ "200 Đá Quý": 3 }, { "200 Đá Quý": 2, "Tăng tốc 3 giờ": 1 });
    assert.equal(resExisting["200 Đá Quý"], 5);
    assert.equal(resExisting["Tăng tốc 3 giờ"], 1);
});

// --- 13. buildExportSettings includes webhookUrl when webhookEnabled ---
function buildExportSettings(selectedKeys, storedSettings, currentSettings) {
    const storageKeys = selectedKeys.slice();
    if (selectedKeys.includes("webhookEnabled") && !storageKeys.includes("webhookUrl")) {
        storageKeys.push("webhookUrl");
    }
    const settings = {};
    for (const key of selectedKeys) {
        if (Object.prototype.hasOwnProperty.call(storedSettings, key)) {
            settings[key] = storedSettings[key];
        } else if (Object.prototype.hasOwnProperty.call(currentSettings, key)) {
            settings[key] = currentSettings[key];
        }
    }
    if (selectedKeys.includes("autoCheckMode") && !storageKeys.includes("utcResetDay")) {
        storageKeys.push("utcResetDay");
    }
    if (selectedKeys.includes("webhookEnabled") && typeof storedSettings.webhookUrl === "string") {
        settings.webhookUrl = storedSettings.webhookUrl;
    }
    if (selectedKeys.includes("autoCheckMode") && (storedSettings.utcResetDay || currentSettings.utcResetDay)) {
        settings.utcResetDay = storedSettings.utcResetDay || currentSettings.utcResetDay || "5";
    }
    return settings;
}

test("buildExportSettings automatically bundles webhookUrl when webhookEnabled is selected", () => {
    const selected = ["theme", "webhookEnabled"];
    const stored = { theme: "dark", webhookEnabled: true, webhookUrl: "https://discord.com/api/webhooks/test" };
    const current = { theme: "dark", webhookEnabled: true };

    const exported = buildExportSettings(selected, stored, current);
    assert.equal(exported.webhookEnabled, true);
    assert.equal(exported.webhookUrl, "https://discord.com/api/webhooks/test");
});

test("buildExportSettings bundles utcResetDay when autoCheckMode is selected", () => {
    const selected = ["theme", "autoCheckMode"];
    const stored = { theme: "light", autoCheckMode: "utcReset", utcResetDay: "5" };
    const current = { theme: "light", autoCheckMode: "utcReset", utcResetDay: "5" };

    const exported = buildExportSettings(selected, stored, current);
    assert.equal(exported.autoCheckMode, "utcReset");
    assert.equal(exported.utcResetDay, "5");
});

// --- 14. autoCheckMode validator and alarm sync logic ---
const autoCheckValidators = {
    autoCheckMode: value => typeof value === "string" && ["utcReset", "interval"].includes(value),
};

test("autoCheckMode validator validates correct modes and rejects invalid values", () => {
    assert.equal(autoCheckValidators.autoCheckMode("utcReset"), true);
    assert.equal(autoCheckValidators.autoCheckMode("interval"), true);
    assert.equal(autoCheckValidators.autoCheckMode("daily"), false);
    assert.equal(autoCheckValidators.autoCheckMode(""), false);
    assert.equal(autoCheckValidators.autoCheckMode(null), false);
    assert.equal(autoCheckValidators.autoCheckMode(undefined), false);
    assert.equal(autoCheckValidators.autoCheckMode(123), false);
});

function simulateSyncAutoCheckAlarms({ enabled, mode, intervalMinutes, utcResetDay }) {
    const alarms = new Map();
    // Simulate syncAutoCheckAlarms:
    if (!enabled) {
        alarms.delete("dailyResetCheck");
        alarms.delete("utc_reset_alarm");
        return { alarms, activeMode: "none" };
    }

    if (mode === "utcReset") {
        alarms.delete("dailyResetCheck");
        const periodInMinutes = (utcResetDay === "everyday" || utcResetDay === "daily") ? 24 * 60 : 7 * 24 * 60;
        alarms.set("utc_reset_alarm", { periodInMinutes });
        return { alarms, activeMode: "utcReset" };
    } else {
        alarms.delete("utc_reset_alarm");
        alarms.set("dailyResetCheck", { periodInMinutes: intervalMinutes || 60 });
        return { alarms, activeMode: "interval" };
    }
}

test("syncAutoCheckAlarms enforces mutual exclusion between UTC and interval alarms", () => {
    // 1. Master toggle OFF -> both alarms disabled
    const disabled = simulateSyncAutoCheckAlarms({ enabled: false, mode: "utcReset" });
    assert.equal(disabled.alarms.size, 0, "No alarms when master switch is off");

    // 2. UTC Reset mode -> only utc_reset_alarm active
    const utcMode = simulateSyncAutoCheckAlarms({ enabled: true, mode: "utcReset", utcResetDay: "5" });
    assert.equal(utcMode.alarms.has("utc_reset_alarm"), true);
    assert.equal(utcMode.alarms.has("dailyResetCheck"), false);
    assert.equal(utcMode.alarms.get("utc_reset_alarm").periodInMinutes, 7 * 24 * 60);

    // 3. Interval mode -> only dailyResetCheck active
    const intervalMode = simulateSyncAutoCheckAlarms({ enabled: true, mode: "interval", intervalMinutes: 120 });
    assert.equal(intervalMode.alarms.has("dailyResetCheck"), true);
    assert.equal(intervalMode.alarms.has("utc_reset_alarm"), false);
    assert.equal(intervalMode.alarms.get("dailyResetCheck").periodInMinutes, 120);
});

function simulateCheckAndCatchUp({ enabled, mode, now, utcResetDay, lastCheckedDate }) {
    if (!enabled || mode !== "utcReset") return false;
    return isUtcResetMissed(now, utcResetDay, lastCheckedDate);
}

test("checkAndCatchUp only runs when master switch is ON and mode is utcReset", () => {
    const friday7am = new Date(Date.UTC(2026, 9, 30, 7, 0, 0));

    // Master OFF -> skips catch up even if missed
    assert.equal(
        simulateCheckAndCatchUp({ enabled: false, mode: "utcReset", now: friday7am, utcResetDay: "5", lastCheckedDate: "2026-10-23" }),
        false,
        "Master toggle off must prevent catch up"
    );

    // Interval mode -> skips catch up even if missed
    assert.equal(
        simulateCheckAndCatchUp({ enabled: true, mode: "interval", now: friday7am, utcResetDay: "5", lastCheckedDate: "2026-10-23" }),
        false,
        "Interval mode must not trigger UTC catch up"
    );

    // UTC reset mode + Master ON -> catches up
    assert.equal(
        simulateCheckAndCatchUp({ enabled: true, mode: "utcReset", now: friday7am, utcResetDay: "5", lastCheckedDate: "2026-10-23" }),
        true,
        "UTC reset mode should trigger catch up on missed reset"
    );
});





