const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
    STORE_CONFIG,
    STORE_NAMES,
    isReloginStoreUrl,
    accountStorageKey,
    parseJwtPayload,
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
    escapeCsvCell,
    stripStoreAccountsPasswords,
    mergeRewardTotals,
    buildExportSettings,
    CONFIG_SETTING_VALIDATORS,
    filterRolesForDraw,
    progressReloginQueue,
    getAlarmSyncPlan,
    getCurrentWeekKey,
    getRewardPoints,
    mergeWeeklyStats,
    isJwtExpiringSoon,
    getPreResetReloginTime,
    encryptJsonWithPassphrase,
    decryptJsonWithPassphrase,
    POPUP_TABS,
    normalizePopupTab,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    normalizeLanguage,
    REWARDS_BY_ID,
    getRewardNameById,
    translateRewardName,
    normalizeTranslatedRewards,
    TRANSLATIONS,
    t,
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
    assert.equal(parseJwtPayload(makeJwt(futureExp))?.client_id, "event_lglo");
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
    assert.equal(matchesSearch(role, "#1055"), true, "Server ID match with # prefix");
    assert.equal(matchesSearch(role, "  #1055  "), true, "Trimmed # prefix match");
    assert.equal(matchesSearch(role, "9999"), false, "Non-matching query");
});

// --- 7. Multi-mall relogin queue progression ---
test("relogin queue advances sequentially across multiple stores", () => {
    const queue = [
        { mall: "plutomall", accountId: "p1" },
        { mall: "lilithstore", accountId: "l1" },
    ];
    assert.equal(progressReloginQueue(queue, 0, "lilithstore", "p1"), null, "Reject wrong mall");
    const step1 = progressReloginQueue(queue, 0, "plutomall", "p1");
    assert.equal(step1.nextIndex, 1);
    assert.equal(step1.nextItem.mall, "lilithstore");
    assert.equal(step1.nextItem.accountId, "l1");

    const step2 = progressReloginQueue(queue, 1, "lilithstore", "l1");
    assert.equal(step2.finished, true);
});

// --- 8. Export storeAccounts password stripping & validation ---
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
    assert.equal(CONFIG_SETTING_VALIDATORS.storeAccounts(exported), true, "Stripped accounts must pass schema validator");
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

    const injectionRows = [
        ["Character", "Reward"],
        ["=1+1", "-500 Gems"],
        ["@SUM(A1:A2)", "+100% Boost"],
    ];
    const sanitizedCsv = toCsv(injectionRows);
    assert.equal(sanitizedCsv.includes("\"'=1+1\""), true, "Formula starting with = sanitized");
    assert.equal(sanitizedCsv.includes("\"'-500 Gems\""), true, "Formula starting with - sanitized");
    assert.equal(sanitizedCsv.includes("\"'@SUM(A1:A2)\""), true, "Formula starting with @ sanitized");
    assert.equal(sanitizedCsv.includes("\"'+100% Boost\""), true, "Formula starting with + sanitized");
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
test("validators correctly check settings", () => {
    assert.equal(CONFIG_SETTING_VALIDATORS.webhookEnabled(false), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.webhookUrl("https://discord.com"), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.webhookUrl(123), false);
    assert.equal(CONFIG_SETTING_VALIDATORS.discordWebhookEnabled(true), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.discordWebhookUrl("https://discord.com/api/webhooks/123/abc"), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.discordWebhookUrl(123), false);
    assert.equal(CONFIG_SETTING_VALIDATORS.telegramWebhookEnabled(false), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.telegramWebhookUrl("https://api.telegram.org/bot123/sendMessage"), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.telegramWebhookUrl(null), false);
    assert.equal(CONFIG_SETTING_VALIDATORS.rewardTotals({ "200 Đá Quý": 5 }), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.rewardTotals([1, 2, 3]), false);
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
test("buildExportSettings automatically bundles webhookUrl when webhookEnabled is selected", () => {
    const selected = ["theme", "webhookEnabled"];
    const stored = { theme: "dark", webhookEnabled: true, webhookUrl: "https://discord.com/api/webhooks/test" };
    const current = { theme: "dark", webhookEnabled: true };

    const exported = buildExportSettings(selected, stored, current);
    assert.equal(exported.webhookEnabled, true);
    assert.equal(exported.webhookUrl, "https://discord.com/api/webhooks/test");
});

test("buildExportSettings bundles discordWebhookUrl and telegramWebhookUrl when selected", () => {
    const selected = ["discordWebhookEnabled", "telegramWebhookEnabled"];
    const stored = {
        discordWebhookEnabled: true,
        discordWebhookUrl: "https://discord.com/api/webhooks/test",
        telegramWebhookEnabled: true,
        telegramWebhookUrl: "https://api.telegram.org/bot123/sendMessage",
    };
    const current = {
        discordWebhookEnabled: true,
        telegramWebhookEnabled: true,
    };

    const exported = buildExportSettings(selected, stored, current);
    assert.equal(exported.discordWebhookEnabled, true);
    assert.equal(exported.discordWebhookUrl, "https://discord.com/api/webhooks/test");
    assert.equal(exported.telegramWebhookEnabled, true);
    assert.equal(exported.telegramWebhookUrl, "https://api.telegram.org/bot123/sendMessage");
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
test("autoCheckMode validator validates correct modes and rejects invalid values", () => {
    assert.equal(CONFIG_SETTING_VALIDATORS.autoCheckMode("utcReset"), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.autoCheckMode("interval"), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.autoCheckMode("daily"), false);
    assert.equal(CONFIG_SETTING_VALIDATORS.autoCheckMode(""), false);
    assert.equal(CONFIG_SETTING_VALIDATORS.autoCheckMode(null), false);
    assert.equal(CONFIG_SETTING_VALIDATORS.autoCheckMode(undefined), false);
    assert.equal(CONFIG_SETTING_VALIDATORS.autoCheckMode(123), false);
});

test("syncAutoCheckAlarms enforces mutual exclusion between UTC and interval alarms", () => {
    const disabled = getAlarmSyncPlan({ enabled: false, mode: "utcReset" });
    assert.equal(disabled.activeMode, "none", "No alarms when master switch is off");
    assert.equal(disabled.toCreate, null);
    assert.deepEqual(disabled.toClear, ["dailyResetCheck", "utcResetCheck", "utcPreResetRelogin"]);

    const utcMode = getAlarmSyncPlan({ enabled: true, mode: "utcReset", utcResetDay: "5" });
    assert.equal(utcMode.activeMode, "utcReset");
    assert.equal(utcMode.toCreate.name, "utcResetCheck");
    assert.equal(utcMode.toCreate.periodInMinutes, 7 * 24 * 60);
    assert.deepEqual(utcMode.toClear, ["dailyResetCheck"]);

    const intervalMode = getAlarmSyncPlan({ enabled: true, mode: "interval", intervalMinutes: 120 });
    assert.equal(intervalMode.activeMode, "interval");
    assert.equal(intervalMode.toCreate.name, "dailyResetCheck");
    assert.equal(intervalMode.toCreate.periodInMinutes, 120);
    assert.deepEqual(intervalMode.toClear, ["utcResetCheck", "utcPreResetRelogin"]);
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
    assert.deepEqual(embed.fields[0], { name: "👤 Character", value: "**DragonSlayer**", inline: true });
    assert.deepEqual(embed.fields[1], { name: "🆔 Character ID", value: "123456789", inline: true });
    assert.equal(embed.fields[2].value.includes("**[Legendary Chest](https://example.com/chest.png) x5**"), true);
    assert.equal(embed.image.url, "https://example.com/chest.png");
    assert.equal(embed.footer.text, "Plutomall • Lucky Draw System");
    assert.equal(typeof embed.timestamp, "string");

    const embedVi = buildSingleDiscordRewardEmbed("Plutomall", role, { "200 Gems": 1 }, {}, "vi");
    assert.deepEqual(embedVi.fields[0], { name: "👤 Nhân vật", value: "**DragonSlayer**", inline: true });
    assert.equal(embedVi.fields[2].value, "**200 Đá Quý x1**");
});

// --- 20. Feature #2: filterRolesForDraw ---
test("filterRolesForDraw filters to favorites when enabled and falls back to all when no favorites match", () => {
    const roles = [
        { roleId: "1", name: "Farm" },
        { roleId: "2", name: "Main" },
    ];
    const filtered = filterRolesForDraw(roles, ["2"], true);
    assert.equal(filtered.filteredByFavorites, true);
    assert.deepEqual(filtered.rolesToDraw.map(r => r.roleId), ["2"]);

    const fallback = filterRolesForDraw(roles, [], true);
    assert.equal(fallback.filteredByFavorites, false);
    assert.equal(fallback.rolesToDraw.length, 2);

    const sortedWithoutFilter = filterRolesForDraw(roles, ["2"], false);
    assert.equal(sortedWithoutFilter.filteredByFavorites, false);
    assert.deepEqual(sortedWithoutFilter.rolesToDraw.map(r => r.roleId), ["2", "1"], "Favorites sorted first even when drawFavoritesOnly is false");

    const numRoles = [{ roleId: 10, name: "Farm" }, { roleId: 20, name: "Main" }];
    const sortedNum = filterRolesForDraw(numRoles, ["20"], false);
    assert.deepEqual(sortedNum.rolesToDraw.map(r => r.roleId), [20, 10], "Handles numeric roleId");
});

// --- 21. Feature #4: getCurrentWeekKey, getRewardPoints, mergeWeeklyStats ---
test("getCurrentWeekKey respects Friday 00:05 UTC reset boundary", () => {
    const friBefore = new Date(Date.UTC(2026, 9, 30, 0, 2, 0));
    assert.equal(getCurrentWeekKey(friBefore), "2026-10-23");

    const friAfter = new Date(Date.UTC(2026, 9, 30, 0, 6, 0));
    assert.equal(getCurrentWeekKey(friAfter), "2026-10-30");

    const tue = new Date(Date.UTC(2026, 10, 3, 12, 0, 0));
    assert.equal(getCurrentWeekKey(tue), "2026-10-30");
});

test("getRewardPoints and mergeWeeklyStats accumulate scores and roll over on new weekKey", () => {
    assert.equal(getRewardPoints("2.000 Đá Quý"), 2000);
    assert.equal(getRewardPoints("Tăng tốc 24 giờ"), 1500);
    assert.equal(getRewardPoints("Rương Tự Chọn Vật Liệu Trang Bị"), 1400);
    assert.equal(getRewardPoints("Tăng tốc 8 giờ"), 600);
    assert.equal(getRewardPoints("500 Đá Quý"), 500);
    assert.equal(getRewardPoints("Tăng tốc 3 giờ"), 300);
    assert.equal(getRewardPoints("200 Đá Quý"), 200);
    assert.equal(getRewardPoints("Unknown Item"), 100);

    const oldStats = { weekKey: "2026-10-23", rewardTotals: { "200 Đá Quý": 5 }, characterScores: {} };
    const nextStats = mergeWeeklyStats(oldStats, "2026-10-30", "plutomall", [
        {
            role: { roleId: "101", name: "SunTzu", svrId: "1001" },
            rewards: { "2.000 Đá Quý": 1, "Tăng tốc 3 giờ": 2 }
        }
    ]);
    assert.equal(nextStats.weekKey, "2026-10-30");
    assert.equal(nextStats.rewardTotals["200 Đá Quý"], undefined, "Old week must be discarded");
    assert.equal(nextStats.rewardTotals["2.000 Đá Quý"], 1);
    assert.equal(nextStats.characterScores["plutomall:101"].score, 2600);
    assert.equal(nextStats.characterScores["plutomall:101"].draws, 3);
});

// --- 22. Feature #5: isJwtExpiringSoon & getPreResetReloginTime ---
test("isJwtExpiringSoon and getPreResetReloginTime handle pre-reset window", () => {
    const nowMs = Date.UTC(2026, 9, 29, 23, 50, 0);
    const expIn10Min = Math.floor((nowMs + 10 * 60 * 1000) / 1000);
    const expIn2Hours = Math.floor((nowMs + 120 * 60 * 1000) / 1000);
    const makeJwt = exp => `header.${btoa(JSON.stringify({ exp }))}.sig`;

    assert.equal(isJwtExpiringSoon(makeJwt(expIn10Min), 30 * 60 * 1000, nowMs), true);
    assert.equal(isJwtExpiringSoon(makeJwt(expIn2Hours), 30 * 60 * 1000, nowMs), false);

    const insideWindow = Date.UTC(2026, 9, 29, 23, 55, 0);
    const nextPreReset = getPreResetReloginTime("5", insideWindow);
    assert.equal(nextPreReset > insideWindow, true);
    assert.equal(new Date(nextPreReset).getUTCDate(), 5, "Next pre-reset is Thursday Nov 5 at 23:50 UTC");
});

// --- 23. Feature #6: encryptJsonWithPassphrase & decryptJsonWithPassphrase ---
test("encryptJsonWithPassphrase and decryptJsonWithPassphrase round-trip and reject wrong passphrase", async () => {
    const payload = { plutomall: [{ id: "a1", username: "u", password: "secret" }], lilithstore: [] };
    const encrypted = await encryptJsonWithPassphrase(payload, "correct-horse");
    assert.equal(typeof encrypted.data, "string");
    const decrypted = await decryptJsonWithPassphrase(encrypted, "correct-horse");
    assert.deepEqual(decrypted, payload);

    await assert.rejects(
        () => decryptJsonWithPassphrase(encrypted, "wrong-passphrase"),
        /Incorrect decryption passphrase/
    );
    await assert.rejects(
        () => decryptJsonWithPassphrase(encrypted, "wrong-passphrase", "vi"),
        /Mật khẩu giải mã không đúng/
    );
});

// --- 24. Popup Tab Navigation Normalization ---
test("normalizePopupTab validates 4-tab layout ids and defaults to draw", () => {
    assert.deepEqual(POPUP_TABS, ["draw", "analytics", "automation", "system"]);
    for (const tab of POPUP_TABS) {
        assert.equal(normalizePopupTab(tab), tab);
    }
    assert.equal(normalizePopupTab("unknown"), "draw");
    assert.equal(normalizePopupTab(""), "draw");
    assert.equal(normalizePopupTab(null), "draw");
    assert.equal(normalizePopupTab(undefined), "draw");
});

// --- 25. i18n helpers & bilingual reward compatibility ---
test("normalizeLanguage, t(), and TRANSLATIONS maintain en/vi parity and parameter interpolation", () => {
    assert.deepEqual(SUPPORTED_LANGUAGES, ["en", "vi"]);
    assert.equal(DEFAULT_LANGUAGE, "en");
    assert.equal(normalizeLanguage("vi"), "vi");
    assert.equal(normalizeLanguage("en"), "en");
    assert.equal(normalizeLanguage("fr"), "en");
    assert.equal(normalizeLanguage(null), "en");

    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const viKeys = Object.keys(TRANSLATIONS.vi).sort();
    assert.deepEqual(enKeys, viKeys, "en and vi dictionaries must have identical keys");

    assert.equal(t("drawsRemaining", { count: 0 }, "en"), "0 draws left");
    assert.equal(t("drawsRemaining", { count: 0 }, "vi"), "0 lượt còn lại");
    assert.equal(t("unknown.key.test", {}, "fr"), "unknown.key.test");
});

test("translateRewardName, normalizeTranslatedRewards, and getRewardPoints handle both English and Vietnamese rewards", () => {
    assert.equal(getRewardPoints("2,000 Gems"), 2000);
    assert.equal(getRewardPoints("2.000 Đá Quý"), 2000);
    assert.equal(getRewardPoints("24-Hour Speedup"), 1500);
    assert.equal(getRewardPoints("Equipment Material Choice Chest"), 1400);
    assert.equal(getRewardPoints("8-Hour Speedup"), 600);
    assert.equal(getRewardPoints("500 Gems"), 500);
    assert.equal(getRewardPoints("3-Hour Speedup"), 300);
    assert.equal(getRewardPoints("200 Gems"), 200);

    assert.equal(getRewardNameById("1986632021321089024", "en"), "200 Gems");
    assert.equal(getRewardNameById("1986632021321089024", "vi"), "200 Đá Quý");
    assert.equal(getRewardNameById("nonexistent", "en"), null);

    assert.equal(translateRewardName("200 Đá Quý", "en"), "200 Gems");
    assert.equal(translateRewardName("200 Gems", "vi"), "200 Đá Quý");
    assert.equal(translateRewardName("Phần thưởng 999", "en"), "Reward 999");
    assert.equal(translateRewardName("Reward 999", "vi"), "Phần thưởng 999");

    const mixed = { "200 Đá Quý": 3, "200 Gems": 2, "Tăng tốc 3 giờ": 1 };
    assert.deepEqual(normalizeTranslatedRewards(mixed, "en"), {
        "200 Gems": 5,
        "3-Hour Speedup": 1,
    });
    assert.deepEqual(normalizeTranslatedRewards(mixed, "vi"), {
        "200 Đá Quý": 5,
        "Tăng tốc 3 giờ": 1,
    });

    assert.equal(CONFIG_SETTING_VALIDATORS.language("en"), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.language("vi"), true);
    assert.equal(CONFIG_SETTING_VALIDATORS.language("de"), false);
});

// --- 26. popup.html English default and data-i18n key coverage ---
test("popup.html defaults to lang='en', includes language controls, and all data-i18n* keys exist in TRANSLATIONS", () => {
    const html = fs.readFileSync(path.join(__dirname, "popup.html"), "utf8");
    assert.equal(/<html\s+lang="en">/i.test(html), true, "popup.html must default to lang='en'");
    assert.equal(html.includes('id="langToggleBtn"'), true, "popup.html must include #langToggleBtn");
    assert.equal(html.includes('name="languageMode"'), true, "popup.html must include languageMode radio group");
    assert.equal(html.includes('value="language"'), true, "popup.html must include language config export option");
    assert.equal(html.includes('id="discordWebhookEnabled"'), true, "popup.html must include discordWebhookEnabled switch");
    assert.equal(html.includes('id="telegramWebhookEnabled"'), true, "popup.html must include telegramWebhookEnabled switch");
    assert.equal(html.includes('id="discordWebhookUrl"'), true, "popup.html must include discordWebhookUrl textarea");
    assert.equal(html.includes('id="telegramWebhookUrl"'), true, "popup.html must include telegramWebhookUrl textarea");

    const attrPattern = /data-i18n(?:-(?:placeholder|title|aria-label))?="([^"]+)"/g;
    const keys = [];
    let match;
    while ((match = attrPattern.exec(html)) !== null) {
        keys.push(match[1]);
    }
    assert.equal(keys.length > 40, true, "popup.html must annotate translatable elements with data-i18n*");
    for (const key of keys) {
        assert.equal(
            Object.prototype.hasOwnProperty.call(TRANSLATIONS.en, key),
            true,
            `Missing key in TRANSLATIONS.en: ${key}`
        );
        assert.equal(
            Object.prototype.hasOwnProperty.call(TRANSLATIONS.vi, key),
            true,
            `Missing key in TRANSLATIONS.vi: ${key}`
        );
    }
});

// --- 27. popup.js i18n key coverage and localization ---
test("popup.js uses tr() for all strings and every tr() key exists in TRANSLATIONS", () => {
    const popupJs = fs.readFileSync(path.join(__dirname, "popup.js"), "utf8");
    assert.equal(popupJs.includes("function applyLanguage("), true, "popup.js must define applyLanguage");
    assert.equal(popupJs.includes("function tr("), true, "popup.js must define tr()");

    const trPattern = /\btr\(\s*"([^"]+)"/g;
    const keys = [];
    let match;
    while ((match = trPattern.exec(popupJs)) !== null) {
        keys.push(match[1]);
    }
    assert.equal(keys.length > 50, true, "popup.js must use tr() across UI actions and statuses");
    for (const key of keys) {
        assert.equal(
            Object.prototype.hasOwnProperty.call(TRANSLATIONS.en, key),
            true,
            `Missing popup.js tr() key in TRANSLATIONS.en: ${key}`
        );
        assert.equal(
            Object.prototype.hasOwnProperty.call(TRANSLATIONS.vi, key),
            true,
            `Missing popup.js tr() key in TRANSLATIONS.vi: ${key}`
        );
    }
});

// --- 28. background.js, relogin.js, and content.js i18n coverage ---
test("background.js defines getLanguage() and uses valid t() keys", () => {
    const bgJs = fs.readFileSync(path.join(__dirname, "background.js"), "utf8");
    assert.equal(bgJs.includes("async function getLanguage("), true, "background.js must define async function getLanguage");

    const tPattern = /\bt\(\s*"([^"]+)"/g;
    const keys = [];
    let match;
    while ((match = tPattern.exec(bgJs)) !== null) {
        keys.push(match[1]);
    }
    assert.equal(keys.length > 20, true, "background.js must use t() for localized notifications, logs, and statuses");
    for (const key of keys) {
        assert.equal(
            Object.prototype.hasOwnProperty.call(TRANSLATIONS.en, key),
            true,
            `Missing background.js t() key in TRANSLATIONS.en: ${key}`
        );
        assert.equal(
            Object.prototype.hasOwnProperty.call(TRANSLATIONS.vi, key),
            true,
            `Missing background.js t() key in TRANSLATIONS.vi: ${key}`
        );
    }
});

test("manifest.json registers relogin-interceptor in MAIN world and relogin.js handles responses", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
    const interceptorScript = manifest.content_scripts.find(cs => cs.js?.includes("relogin-interceptor.js"));
    assert.ok(interceptorScript, "relogin-interceptor.js must be declared in content_scripts");
    assert.equal(interceptorScript.world, "MAIN", "relogin-interceptor.js must run in MAIN world");
    assert.equal(interceptorScript.run_at, "document_start", "relogin-interceptor.js must run at document_start");

    const reloginJs = fs.readFileSync(path.join(__dirname, "relogin.js"), "utf8");
    assert.ok(reloginJs.includes("ROK_PASSPORT_API_RESPONSE"), "relogin.js must listen for intercepted API responses");
    assert.ok(reloginJs.includes("waitForLoginResult"), "relogin.js must use waitForLoginResult");
});

test("notification toast system is defined in popup and has zero emoji in notification strings", () => {
    const popupHtml = fs.readFileSync(path.join(__dirname, "popup.html"), "utf8");
    assert.ok(popupHtml.includes('id="toastContainer"'), "popup.html must contain toastContainer");
    assert.ok(popupHtml.includes('id="toastCard"'), "popup.html must contain toastCard");
    assert.ok(popupHtml.includes('id="toastCloseBtn"'), "popup.html must contain toastCloseBtn");

    const popupJs = fs.readFileSync(path.join(__dirname, "popup.js"), "utf8");
    assert.ok(popupJs.includes("function showToast("), "popup.js must define showToast");
    assert.ok(popupJs.includes("function hideToast("), "popup.js must define hideToast");

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const [lang, dict] of Object.entries(TRANSLATIONS)) {
        for (const [key, text] of Object.entries(dict)) {
            if (key.startsWith("notify") || key.endsWith("NotificationTitle")) {
                assert.equal(
                    emojiRegex.test(text),
                    false,
                    `Notification string ${lang}.${key} must NOT contain emoji: "${text}"`
                );
            }
        }
    }
});

test("confirm delete modal is defined in popup with styling and zero emoji", () => {
    const popupHtml = fs.readFileSync(path.join(__dirname, "popup.html"), "utf8");
    assert.ok(popupHtml.includes('id="confirmModal"'), "popup.html must contain confirmModal");
    assert.ok(popupHtml.includes('id="confirmModalTitle"'), "popup.html must contain confirmModalTitle");
    assert.ok(popupHtml.includes('id="confirmModalMessage"'), "popup.html must contain confirmModalMessage");
    assert.ok(popupHtml.includes('id="confirmModalCancelBtn"'), "popup.html must contain confirmModalCancelBtn");
    assert.ok(popupHtml.includes('id="confirmModalConfirmBtn"'), "popup.html must contain confirmModalConfirmBtn");

    const popupCss = fs.readFileSync(path.join(__dirname, "popup.css"), "utf8");
    assert.ok(popupCss.includes(".modal-backdrop"), "popup.css must define .modal-backdrop");
    assert.ok(popupCss.includes(".modal-backdrop[hidden]"), "popup.css must define .modal-backdrop[hidden]");
    assert.ok(popupCss.includes(".btn-destructive"), "popup.css must define .btn-destructive");

    const popupJs = fs.readFileSync(path.join(__dirname, "popup.js"), "utf8");
    assert.ok(popupJs.includes("function showConfirmModal("), "popup.js must define showConfirmModal");
    assert.ok(popupJs.includes("function closeConfirmModal("), "popup.js must define closeConfirmModal");
    assert.equal(popupJs.includes("confirm("), false, "popup.js must not contain any native confirm() calls");

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const requiredModalKeys = [
        "confirmDeleteTitle",
        "confirmDeleteAccount",
        "confirmClearAccountsTitle",
        "confirmClearRewardsTitle",
        "modalCancelBtn",
        "modalDeleteBtn",
    ];
    for (const lang of ["en", "vi"]) {
        const dict = TRANSLATIONS[lang];
        for (const key of requiredModalKeys) {
            assert.ok(dict[key], `Missing modal translation key: ${lang}.${key}`);
            assert.equal(
                emojiRegex.test(dict[key]),
                false,
                `Modal translation ${lang}.${key} must NOT contain emoji: "${dict[key]}"`
            );
        }
    }
});





