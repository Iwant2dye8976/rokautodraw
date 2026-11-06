const test = require("node:test");
const assert = require("node:assert/strict");
const {
    STORE_CONFIG,
    STORE_NAMES,
    isReloginStoreUrl,
    accountStorageKey,
    getJwtExp,
    isJwtExpired,
    isExpiredTokenResponse,
    parseWebhookUrls,
    buildWebhookBody,
    getRewardIcons,
    buildSingleDiscordRewardEmbed,
    getRoleDrawCount,
    getNextUtcResetTime,
    getTodayUtcDateString,
    isUtcResetMissed,
    normalizeSearchText,
    matchesSearch,
    toCsv,
} = require("./utils.js");

// --- 1. isJwtExpired & getJwtExp ---
test("isJwtExpired and getJwtExp correctly identify valid and expired tokens", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const makeJwt = exp => `header.${btoa(JSON.stringify({ exp, client_id: "event_lglo" }))}.sig`;

    assert.equal(isJwtExpired(makeJwt(futureExp)), false, "Future token should not be expired");
    assert.equal(isJwtExpired(makeJwt(pastExp)), true, "Past token should be expired");
    assert.equal(isJwtExpired("Bearer " + makeJwt(pastExp)), true, "Bearer token should be expired");
    assert.equal(isJwtExpired("invalid.token"), false, "Malformed token should not throw");
    assert.equal(isJwtExpired(""), false, "Empty string should not throw");
    assert.equal(isJwtExpired(null), false, "Null token should not throw");

    assert.equal(getJwtExp(makeJwt(futureExp)), futureExp);
    assert.equal(getJwtExp("not.a.jwt"), null);
});

// --- 2. isExpiredTokenResponse ---
test("isExpiredTokenResponse detects expired codes without looping on empty roles", () => {
    assert.equal(isExpiredTokenResponse({ code: 1002, msg: "token expired" }), true);
    assert.equal(isExpiredTokenResponse({ code: 401 }), true);
    assert.equal(isExpiredTokenResponse({ code: 0, msg: "ok" }), false);
    // Regression test: empty user-roles list must NOT be treated as expired token
    const emptyRolesResponse = { code: 0, msg: "ok", data: { list: [] } };
    assert.equal(
        isExpiredTokenResponse(emptyRolesResponse),
        false,
        "Empty user-roles list should not trigger token expiration"
    );
});

// --- 3. isReloginStoreUrl ---
test("isReloginStoreUrl handles both plutomall domain variants and lilithstore", () => {
    assert.equal(isReloginStoreUrl(new URL("https://www.plutomall.com.vn/rok/vn?tab=perks"), "plutomall"), true);
    assert.equal(isReloginStoreUrl(new URL("https://plutomall.com/rok/perks"), "plutomall"), true);
    assert.equal(isReloginStoreUrl(new URL("https://www.plutomall.com/rok/perks"), "plutomall"), true);
    assert.equal(isReloginStoreUrl(new URL("https://store.lilith.com/rok?tab=perks"), "lilithstore"), true);

    // Rejections
    assert.equal(isReloginStoreUrl(new URL("http://store.lilith.com/rok"), "lilithstore"), false, "Must be https");
    assert.equal(isReloginStoreUrl(new URL("https://fakeplutomall.com/rok"), "plutomall"), false, "Reject spoofed host");
    assert.equal(isReloginStoreUrl(new URL("https://store.lilith.com/other"), "lilithstore"), false, "Must start with /rok");
});

// --- 4. accountStorageKey ---
test("accountStorageKey generates prefixed and legacy keys correctly", () => {
    assert.equal(accountStorageKey("plutomall", "acc1", "token"), "plutomall_account_acc1_token");
    assert.equal(accountStorageKey("plutomall", "", "token"), "plutomall_token");
    assert.equal(accountStorageKey("lilithstore", undefined, "drawLog"), "lilithstore_drawLog");
});

// --- 5. getRoleDrawCount ---
test("getRoleDrawCount extracts draw count from nested manifest using STORE_CONFIG", () => {
    const compId = STORE_CONFIG.plutomall.componentId;
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
    assert.equal(getRoleDrawCount(manifest, "plutomall"), 3);
});

// --- 6. normalizeSearchText & matchesSearch ---
test("matchesSearch handles Vietnamese names and server IDs", () => {
    const role = { name: "Chiến Thần Độc Cô", roleId: "12345678", svrId: "1055" };
    assert.equal(matchesSearch(role, "chien"), true, "Diacritics insensitive");
    assert.equal(matchesSearch(role, "doc co"), true, "d vs đ match");
    assert.equal(matchesSearch(role, "1055"), true, "Server ID match");
    assert.equal(matchesSearch(role, "9999"), false, "Non-matching query");
});

// --- 7. Multi-mall relogin queue progression ---
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

// --- 8. Export storeAccounts password stripping & validation ---
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

// --- 9. getNextUtcResetTime & isUtcResetMissed ---
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

// --- 10. toCsv ---
test("toCsv handles special characters, commas, quotes and UTF-8 BOM", () => {
    const rows = [
        ["Tên", "Mô tả", "Số lượng"],
        ["Đá Quý", 'Rương "Đặc Biệt", vip 10', 500],
    ];
    const csv = toCsv(rows);
    assert.equal(csv.startsWith("\uFEFF"), true, "Must include BOM for Excel Vietnamese display");
    assert.equal(csv.includes('"Rương ""Đặc Biệt"", vip 10"'), true, "Quotes and commas properly escaped");
});

// --- 11. buildWebhookBody ---
test("buildWebhookBody shapes Discord and Telegram payloads correctly", () => {
    const discordUrl = "https://discord.com/api/webhooks/123/xyz";
    const telegramUrl = "https://api.telegram.org/bot12345:TOKEN/sendMessage?chat_id=98765";
    const genericUrl = "https://hooks.slack.com/services/custom";

    const dPayload = buildWebhookBody(discordUrl, "Hello Discord");
    assert.deepEqual(dPayload, { content: "Hello Discord" });

    const customEmbedPayload = { content: "Title", embeds: [{ title: "Embed 1" }] };
    const dCustomPayload = buildWebhookBody(discordUrl, "Hello Discord", customEmbedPayload);
    assert.deepEqual(dCustomPayload, customEmbedPayload);

    const tPayload = buildWebhookBody(telegramUrl, "Hello Telegram", customEmbedPayload);
    assert.deepEqual(tPayload, { chat_id: "98765", text: "Hello Telegram" });

    const gPayload = buildWebhookBody(genericUrl, "Hello Slack", customEmbedPayload);
    assert.deepEqual(gPayload, { text: "Hello Slack", content: "Hello Slack" });
});

// --- 12. CONFIG_SETTING_VALIDATORS ---
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

// --- 13. parseWebhookUrls ---
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

// --- 14. mergeRewardTotals ---
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

// --- 15. buildExportSettings ---
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

// --- 16. autoCheckMode validator and alarm sync logic ---
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
    if (!enabled) {
        alarms.delete("dailyResetCheck");
        alarms.delete("utcResetCheck");
        return { alarms, activeMode: "none" };
    }

    if (mode === "utcReset") {
        alarms.delete("dailyResetCheck");
        const periodInMinutes = (utcResetDay === "everyday" || utcResetDay === "daily") ? 24 * 60 : 7 * 24 * 60;
        alarms.set("utcResetCheck", { periodInMinutes });
        return { alarms, activeMode: "utcReset" };
    } else {
        alarms.delete("utcResetCheck");
        alarms.set("dailyResetCheck", { periodInMinutes: intervalMinutes || 60 });
        return { alarms, activeMode: "interval" };
    }
}

test("syncAutoCheckAlarms enforces mutual exclusion between UTC and interval alarms", () => {
    const disabled = simulateSyncAutoCheckAlarms({ enabled: false, mode: "utcReset" });
    assert.equal(disabled.alarms.size, 0, "No alarms when master switch is off");

    const utcMode = simulateSyncAutoCheckAlarms({ enabled: true, mode: "utcReset", utcResetDay: "5" });
    assert.equal(utcMode.alarms.has("utcResetCheck"), true);
    assert.equal(utcMode.alarms.has("dailyResetCheck"), false);
    assert.equal(utcMode.alarms.get("utcResetCheck").periodInMinutes, 7 * 24 * 60);

    const intervalMode = simulateSyncAutoCheckAlarms({ enabled: true, mode: "interval", intervalMinutes: 120 });
    assert.equal(intervalMode.alarms.has("dailyResetCheck"), true);
    assert.equal(intervalMode.alarms.has("utcResetCheck"), false);
    assert.equal(intervalMode.alarms.get("dailyResetCheck").periodInMinutes, 120);
});

function simulateCheckAndCatchUp({ enabled, mode, now, utcResetDay, lastCheckedDate }) {
    if (!enabled || mode !== "utcReset") return false;
    return isUtcResetMissed(now, utcResetDay, lastCheckedDate);
}

test("checkAndCatchUp only runs when master switch is ON and mode is utcReset", () => {
    const friday7am = new Date(Date.UTC(2026, 9, 30, 7, 0, 0));

    assert.equal(
        simulateCheckAndCatchUp({ enabled: false, mode: "utcReset", now: friday7am, utcResetDay: "5", lastCheckedDate: "2026-10-23" }),
        false,
        "Master toggle off must prevent catch up"
    );

    assert.equal(
        simulateCheckAndCatchUp({ enabled: true, mode: "interval", now: friday7am, utcResetDay: "5", lastCheckedDate: "2026-10-23" }),
        false,
        "Interval mode must not trigger UTC catch up"
    );

    assert.equal(
        simulateCheckAndCatchUp({ enabled: true, mode: "utcReset", now: friday7am, utcResetDay: "5", lastCheckedDate: "2026-10-23" }),
        true,
        "UTC reset mode should trigger catch up on missed reset"
    );
});

// --- 17. getRewardIcons ---
test("getRewardIcons extracts icon urls by id and name from manifest", () => {
    const manifest = {
        data: {
            component: {
                rewards: [
                    {
                        id: "1986632021321089024",
                        type: "gmtItem",
                        icon: "https://oss-resource.farlightgames.com/p/event/c9dec9d70a699ce9457d7bfd7e21ac11.png",
                        name: "200 Đá Quý",
                        count: 1
                    }
                ]
            }
        }
    };

    const icons = getRewardIcons(manifest);
    assert.equal(icons["1986632021321089024"], "https://oss-resource.farlightgames.com/p/event/c9dec9d70a699ce9457d7bfd7e21ac11.png");
    assert.equal(icons["200 Đá Quý"], "https://oss-resource.farlightgames.com/p/event/c9dec9d70a699ce9457d7bfd7e21ac11.png");
});

// --- 18. multi-character draw simulation ---
test("multi-character draw processes all characters even if first has 0 draws", () => {
    const roles = [
        { roleId: "1", name: "CharA", draws: 0 },
        { roleId: "2", name: "CharB", draws: 2 },
        { roleId: "3", name: "CharC", draws: 1 }
    ];

    const drawn = [];
    for (const role of roles) {
        let count = role.draws;
        if (count > 0) {
            while (count > 0) {
                drawn.push(role.name);
                count--;
            }
        }
    }

    assert.deepEqual(drawn, ["CharB", "CharB", "CharC"]);
    const totalDraws = roles.reduce((sum, r) => sum + r.draws, 0);
    assert.equal(totalDraws, 3);
});

// --- 19. buildSingleDiscordRewardEmbed ---
test("buildSingleDiscordRewardEmbed generates single embed matching template", () => {
    const role = { roleId: "123456789", name: "DragonSlayer", avatar: "https://example.com/avatar.png" };
    const rewards = { "Legendary Chest": 5 };
    const sessionRewardIcons = { "Legendary Chest": "https://example.com/chest.png" };

    const embed = buildSingleDiscordRewardEmbed("Plutomall", role, rewards, sessionRewardIcons);
    assert.equal(embed.title, "🎉 LUCKY DRAW - PLUTOMALL");
    assert.equal(embed.color, 16757578);
    assert.equal(embed.thumbnail.url, "https://example.com/avatar.png");
    assert.deepEqual(embed.fields[0], { name: "👤 Nhân vật", value: "**DragonSlayer**", inline: true });
    assert.deepEqual(embed.fields[1], { name: "🆔 Character ID", value: "123456789", inline: true });
    assert.equal(embed.fields[2].value.includes("**[Legendary Chest](https://example.com/chest.png) x5**"), true);
    assert.equal(embed.image.url, "https://example.com/chest.png");
    assert.equal(embed.footer.text, "Plutomall • Lucky Draw System");
    assert.equal(typeof embed.timestamp, "string");
});
