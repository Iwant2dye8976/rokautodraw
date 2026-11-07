// Pure helpers shared by background.js (importScripts), popup.js (<script>) and test.js (require).

const SUPPORTED_LANGUAGES = ["en", "vi"];
const DEFAULT_LANGUAGE = "en";

function normalizeLanguage(lang) {
    return lang === "vi" ? "vi" : "en";
}

const REWARDS_BY_ID = {
    "1986632021321089024": { en: "200 Gems", vi: "200 Đá Quý", points: 200 },
    "1986631915360387072": { en: "3-Hour Speedup", vi: "Tăng tốc 3 giờ", points: 300 },
    "1986631781406900224": { en: "8-Hour Speedup", vi: "Tăng tốc 8 giờ", points: 600 },
    "1986631671386112000": { en: "500 Gems", vi: "500 Đá Quý", points: 500 },
    "1986631555921117184": { en: "Equipment Material Choice Chest", vi: "Rương Tự Chọn Vật Liệu Trang Bị", points: 1400 },
    "1986631409741234176": { en: "24-Hour Speedup", vi: "Tăng tốc 24 giờ", points: 1500 },
    "1986631205541543936": { en: "2,000 Gems", vi: "2.000 Đá Quý", points: 2000 },
};

const REWARD_NAME_TO_ENTRY = {};
for (const entry of Object.values(REWARDS_BY_ID)) {
    REWARD_NAME_TO_ENTRY[entry.en] = entry;
    REWARD_NAME_TO_ENTRY[entry.vi] = entry;
}

function getRewardNameById(rewardId, lang = DEFAULT_LANGUAGE) {
    const entry = REWARDS_BY_ID[String(rewardId ?? "")];
    if (!entry) return null;
    return entry[normalizeLanguage(lang)];
}

function translateRewardName(rawName, lang = DEFAULT_LANGUAGE) {
    const str = String(rawName ?? "");
    const targetLang = normalizeLanguage(lang);
    const entry = REWARD_NAME_TO_ENTRY[str];
    if (entry) return entry[targetLang];
    const fallbackMatch = str.match(/^(?:Phần thưởng|Reward)\s+(.+)$/i);
    if (fallbackMatch) {
        return targetLang === "vi" ? `Phần thưởng ${fallbackMatch[1]}` : `Reward ${fallbackMatch[1]}`;
    }
    return str;
}

function normalizeTranslatedRewards(rewardsMap, lang = DEFAULT_LANGUAGE) {
    const normalized = {};
    if (!rewardsMap || typeof rewardsMap !== "object") return normalized;
    for (const [rawName, rawCount] of Object.entries(rewardsMap)) {
        const count = Number(rawCount) || 0;
        if (count <= 0) continue;
        const translated = translateRewardName(rawName, lang);
        normalized[translated] = (normalized[translated] || 0) + count;
    }
    return normalized;
}

const TRANSLATIONS = {
    en: {
        // Header & Navigation
        storeSelectAria: "Select store",
        switchThemeToDark: "Switch to dark mode",
        switchThemeToLight: "Switch to light mode",
        switchLangTitle: "Switch language to Tiếng Việt",
        accountLabel: "Account",
        activeAccountAria: "Selected account",
        captureBtnTitle: "Open store to capture token",
        captureBtn: "Get Token",
        refreshCharsTitle: "Refresh character list",
        refreshCharsAria: "Refresh",
        navDraw: "Draw",
        navAnalytics: "Luck",
        navAutomation: "Auto",
        navSystem: "System",
        mainNavAria: "Main navigation",

        // Tab 1: Draw Deck
        heroDrawAria: "Lucky draw actions",
        drawsRemaining: "{count} draws left",
        drawsRemainingPlaceholder: "- draws left",
        noToken: "No token",
        tokenExpired: "Token expired",
        tokenInvalid: "Invalid token",
        tokenOk: "Token OK",
        tokenOkRemaining: "Token OK ({days}d {hours}h left)",
        tokenSaved: "Token saved",
        drawNowBtn: "Draw this account",
        drawingBtn: "Drawing…",
        drawAllBtn: "Draw all",
        drawingAllBtn: "Drawing all…",
        rosterFilterAria: "Character filters",
        charSearchPlaceholder: "Search name, ID, or server…",
        charSearchAria: "Search characters",
        clearSearchAria: "Clear search",
        favFilterTitle: "Only draw favorite characters",
        favFilterLabel: "Favorites",
        toggleOn: "On",
        toggleOff: "Off",
        charListAria: "Character list",
        loading: "Loading…",
        loadingData: "Loading data…",
        refreshing: "Refreshing…",
        noCharsFound: "No characters found",
        noMatchingChars: "No matching characters found",
        unknownName: "Unknown name",
        viewCharHistoryAria: "View draw history for {name}",
        removeFavorite: "Remove from favorites",
        addFavorite: "Add to favorites",
        copyCharInfo: "Copy character ID and name",
        copied: "Copied",
        copiedCharInfoAria: "Copied character info",
        copyCharInfoError: "Could not copy character info",
        noDataCapturePrompt: "No data yet — click Get Token",
        clickRefreshToLoadChars: "Click Refresh to load characters",
        connectionError: "Connection error",
        extensionConnectionError: "Extension connection error",
        responseError: "Response error",
        extensionEmptyResponse: "Extension returned no data",
        tokenExpiredReloginPrompt: "Token expired. Please click Get Token to log in again.",
        readDataError: "Error reading data: {error}",
        loadFavoritesError: "Could not load favorite characters: {error}",
        updateFavoriteError: "Could not update favorite: {error}",
        saveSettingError: "Could not save setting: {error}",
        openStoreSuccess: "Store opened; token will be captured automatically",
        openStoreError: "Could not open store: {error}",
        refreshError: "Could not refresh: {error}",
        drawError: "Could not start draw: {error}",
        popupInitError: "Could not initialize popup: {error}",
        startingDraw: "Starting lucky draw...",
        startingDrawAll: "Starting sequential draw for all accounts...",
        checkCompleteNoDraws: "Check complete: no draws remaining.",

        // Character History Detail View
        backBtn: "Back",
        drawHistoryTitle: "Draw History",
        exportCsvTitle: "Export CSV file",
        exportCsvBtn: "Export CSV",
        rewardsReceivedHead: "Rewards Received",
        noHistoryToExport: "No draw history to export.",
        noDrawHistory: "No draw history yet",
        invalidHistoryResponse: "Invalid history response",
        csvHistoryNo: "No.",
        csvHistoryTime: "Time",
        csvHistoryCharacter: "Character",
        csvHistoryServer: "Server",
        csvHistoryReward: "Reward",
        csvHistoryQuantity: "Quantity",
        csvHistoryRewardId: "Reward ID",
        errorPrefix: "Error: {error}",

        // Tab 2: Analytics & Leaderboard
        rewardSummaryTitle: "Reward Statistics",
        statsScopeAria: "Statistics scope",
        statsWeekly: "This Week",
        statsAllTime: "All Time",
        noRewardsWeekly: "No rewards won this week yet.",
        noRewardsAllTime: "No reward statistics yet.",
        leaderboardTitle: "Weekly Luck Leaderboard",
        leaderboardMeta: "Resets Friday 00:05 UTC",
        noLeaderboardData: "No luck data for this week yet.",
        pointsSuffix: "{score} pts",
        clearRewardsBtn: "Clear stats",
        noRewardsToExport: "No rewards to export.",
        confirmClearRewards: "Are you sure you want to clear all reward statistics?",
        csvScope: "Scope",
        csvReward: "Reward",
        csvQuantity: "Quantity",
        csvWeekPrefix: "Week {week}",
        csvAllTime: "All Time",
        csvRank: "Rank",
        csvCharacter: "Character",
        csvServer: "Server",
        csvLuckScore: "Luck Score",
        csvRewardDetails: "Reward Breakdown",

        // Tab 3: Automation & Accounts
        autoCheckTitle: "Auto Check Schedule",
        autoCheckModeAria: "Select check mode",
        modeUtcReset: "By UTC Reset",
        modeCustomInterval: "Custom Interval",
        utcResetDayLabel: "Target reset day",
        utcDayFriday: "Friday (RoK Event Reset)",
        utcDayEveryday: "Everyday (Daily 00:05 UTC)",
        utcDayMonday: "Every Monday",
        utcDaySunday: "Every Sunday",
        utcResetNote: "Runs at 00:05 UTC (proactively refreshes tokens at 23:50 UTC). Automatically catches up if the browser opens late.",
        intervalMinutesLabel: "Interval between checks (minutes)",
        intervalPresetsAria: "Preset check intervals",
        preset1hTitle: "1 hour (60 mins - 24x/day)",
        preset2hTitle: "2 hours (120 mins - 12x/day)",
        preset3hTitle: "3 hours (180 mins - 8x/day)",
        preset4hTitle: "4 hours (240 mins - 6x/day)",
        preset6hTitle: "6 hours (360 mins - 4x/day)",
        preset8hTitle: "8 hours (480 mins - 3x/day)",
        preset12hTitle: "12 hours (720 mins - 2x/day)",
        preset24hTitle: "24 hours (1440 mins - 1x/day)",
        autoCheckEnabledStatus: "Automatic check enabled.",
        autoCheckDisabledStatus: "Automatic check disabled.",
        updateSettingError: "Could not update setting: {error}",
        intervalSavedStatus: "Check interval set to every {minutes} min{hourText}.",
        intervalHoursSuffix: " ({hours} hr)",
        intervalSaveError: "Could not save check interval: {error}",
        intervalValidationError: "Check interval must be a whole number of minutes (1 or greater).",

        autoReloginTitle: "Accounts & Auto-Relogin",
        storeLoginTabsAria: "Store login configuration",
        addAccountBtn: "+ Add account",
        accountIsolationNote: "Each account maintains its own token and draw data.",
        saveLoginBtn: "Save credentials",
        clearLoginBtn: "Delete all",
        testPlutoAccountsBtn: "Check all Pluto",
        testLilithAccountsBtn: "Check all Lilith",
        testPlutoReloginBtn: "Relogin Pluto",
        testLilithReloginBtn: "Relogin Lilith",
        testPlutoReloginTitle: "Test selected Plutomall account",
        testLilithReloginTitle: "Test selected Lilith Store account",
        accountItemTitle: "Account {index}",
        accountItemTitleWithUser: "Account {index} ({username})",
        expandAccount: "Expand Account {index}",
        collapseAccount: "Collapse Account {index}",
        removeAccountTitle: "Remove account",
        storeAccountLabel: "{store} Account",
        passwordLabel: "Password",
        showPassword: "Show password",
        hidePassword: "Hide password",
        unnamedAccount: "Unnamed account",
        accountIncompleteError: "Every {store} account must have both a username and a password.",
        saveAccountError: "Could not save account: {error}",
        autoReloginDisabledStatus: "Auto-relogin disabled. Saved credentials are kept.",
        autoReloginEnabledStatus: "Auto-relogin enabled for {store} using saved credentials.",
        autoReloginNoCredsStatus: "No saved {store} credentials yet. Add an account and click Save credentials.",
        accountsSavedAutoStatus: "Accounts saved. Auto check will process accounts sequentially.",
        credentialsSavedStatus: "Login credentials saved.",
        saveGenericError: "Could not save: {error}",
        confirmClearAccounts: "Are you sure you want to delete all saved accounts and credentials?",
        accountsClearedStatus: "All saved accounts deleted.",
        clearAccountsError: "Could not delete credentials: {error}",
        testCannotStartError: "Could not start check: {error}",
        selectOrAddAccountPrompt: "Please select or add a {store} account before testing.",
        enterFullCredentialsPrompt: "Please enter and save both username and password for {store} before testing.",
        testingAndOpeningTabStatus: "Testing and opening {store} login tab…",
        sendRequestError: "Could not send request: {error}",
        testFailedError: "Check failed: {error}",
        openedBgTabStatus: "Opened {store} background tab. Watch status for login progress.",
        cannotStartLoginError: "Could not start login: {error}",
        cannotStartLoginFallback: "Could not start login. Check your settings and account credentials.",
        noFullStoreAccountsPrompt: "No complete {store} accounts saved yet.",
        testingSequentialAccountsStatus: "Sequentially checking {count} {store} account(s).",

        // Tab 4: System & Config
        webhookTitle: "Webhook Notifications",
        webhookUrlLabel: "Webhook URLs (one URL per line)",
        saveWebhookBtn: "Save Webhook",
        testWebhookBtn: "Send Test",
        webhookGuideTitle: "Supported webhook formats:",
        webhookEnabledStatus: "Webhook notifications enabled.",
        webhookDisabledStatus: "Webhook notifications disabled.",
        webhookSavedCountStatus: "Saved {count} Webhook URL(s).",
        webhookSavedEmptyStatus: "Webhook saved (empty list).",
        webhookSendingTest: "Sending test...",
        webhookExtError: "Extension error: {error}. Please reload the extension.",
        webhookTestSuccess: "Successfully sent {success}/{total} webhook(s)!",
        webhookTestFailed: "Send failed: {error}",
        webhookCheckUrlFallback: "Please check your URL",

        discordWebhookTitle: "Discord Webhook",
        discordWebhookUrlLabel: "Discord Webhook URLs (one URL per line)",
        saveDiscordWebhookBtn: "Save Discord",
        testDiscordWebhookBtn: "Send Test",
        discordWebhookEnabledStatus: "Discord Webhook enabled.",
        discordWebhookDisabledStatus: "Discord Webhook disabled.",
        discordWebhookSavedStatus: "Saved {count} Discord Webhook URL(s).",
        discordWebhookSavedEmptyStatus: "Discord Webhook saved (empty list).",

        telegramWebhookTitle: "Telegram Webhook",
        telegramWebhookUrlLabel: "Telegram Webhook URLs (one URL per line)",
        saveTelegramWebhookBtn: "Save Telegram",
        testTelegramWebhookBtn: "Send Test",
        telegramWebhookEnabledStatus: "Telegram Webhook enabled.",
        telegramWebhookDisabledStatus: "Telegram Webhook disabled.",
        telegramWebhookSavedStatus: "Saved {count} Telegram Webhook URL(s).",
        telegramWebhookSavedEmptyStatus: "Telegram Webhook saved (empty list).",

        configOptDiscordWebhook: "Discord Webhook notifications",
        configOptTelegramWebhook: "Telegram Webhook notifications",

        configTitle: "Export / Import Config",
        configWarningNote: "Passwords are excluded by default. Enter a passphrase below to encrypt account passwords with AES-GCM.",
        selectAll: "Select all",
        deselectAll: "Deselect all",
        selectAllSettingsAria: "Select all settings",
        deselectAllSettingsAria: "Deselect all settings",
        selectedCountLabel: "{selected}/{total} selected",
        configOptionsAria: "Select settings to export",
        configOptDrawFavoritesOnly: "Only draw favorite characters",
        configOptAutoReloginEnabled: "Auto-relogin",
        configOptAutoCheckIntervalMinutes: "Auto check interval",
        configOptAutoCheckEnabled: "Enable Auto check",
        configOptTheme: "Theme mode (Light / Dark)",
        configOptLanguage: "Language (EN / VI)",
        configOptAutoCheckMode: "Auto check mode (UTC / Interval)",
        configOptWebhookEnabled: "Enable Webhook notifications",
        configOptRewardTotals: "Reward statistics",
        configOptStoreAccounts: "Store accounts",
        configOptFavoriteRoleIds: "Favorite characters",
        configOptTokens: "Tokens",
        configPassphraseLabel: "File passphrase (optional — AES-GCM encryption)",
        configPassphrasePlaceholder: "Leave blank to omit account passwords…",
        exportConfigBtn: "Export config",
        importConfigBtn: "Import config",
        selectAtLeastOneExport: "Please select at least one setting to export.",
        noSavedSettingsInSelection: "No saved settings found in the selected items.",
        invalidSettingValueError: "Invalid value for setting {key}.",
        exportedSettingsStatus: "Exported {count} setting(s).",
        exportConfigError: "Could not export config: {error}",
        unsupportedConfigFormatError: "File does not match a supported configuration format.",
        invalidConfigSettingsError: "Settings in file are invalid or unsupported.",
        encryptedConfigPrompt: "This configuration file contains encrypted accounts. Enter decryption passphrase:",
        passphraseRequiredError: "A passphrase is required to decrypt accounts.",
        invalidDecryptedAccountsError: "Decrypted account data is invalid.",
        decryptFailedError: "Incorrect decryption passphrase or corrupted data.",
        legacyAccountMissingPairError: "File must include both username and password for {store}.",
        importedSettingsStatus: "Imported {count} setting(s) from {file}.",
        importConfigError: "Could not import config: {error}",

        languageTitle: "Language",
        languageSelectAria: "Select language",
        langEnglish: "English",
        langVietnamese: "Tiếng Việt",

        themeTitle: "Theme Mode",
        themeSelectAria: "Select theme mode",
        themeSystem: "System",
        themeLight: "Light",
        themeDark: "Dark",

        tokenTitle: "Token",
        copyTokenTitle: "Copy token",
        tokenPlaceholder: "Token will appear here after capture…",
        noTokenToCopy: "No token to copy.",
        copiedTokenAria: "Copied token",
        copiedTokenStatus: "Token copied.",
        copyTokenError: "Could not copy token",
        copyTokenErrorStatus: "Could not copy token: {error}",

        // Log Drawer & Footer
        logSectionAria: "Activity log",
        logDrawerTitle: "Activity Log",
        hideLogTitle: "Hide log",
        toggleLogTitle: "Toggle activity log",
        footerLogBtn: "Log",
        utcClockAria: "UTC Time",
        noSessionLogsYet: "No activity logs in this session yet.",

        // Background / Shared Errors, Logs & Webhooks
        embedCharacter: "👤 Character",
        embedCharacterId: "🆔 Character ID",
        embedRewards: "🎁 Rewards",
        embedNoItems: "**No items**",
        invalidManifestError: "Valid manifest not found for {store}",
        missingDrawCounterError: "Could not locate draw counter for {store} in manifest",
        invalidDrawCounterError: "Invalid draw counter for {store}",
        cannotOpenLoginTabError: "Could not open login tab.",
        reloginSeqCompleteWithFailures: "Finished checking accounts; {count} account(s) failed.",
        reloginSeqCompleteSuccess: "Completed sequential account check.",
        webhookReloginFailed: "⚠️ [ROK Auto] Login failed for {count} account(s):\n{details}",
        requestTimeoutError: "Request timed out",
        networkError: "Connection error: {error}",
        nonJsonResponseError: "Non-JSON API response (HTTP {status})",
        apiHttpError: "API returned HTTP {status}",
        enableAutoReloginFirst: "Please enable Auto-relogin before testing.",
        missingStoreCredentials: "Missing username or password for {store}.",
        storeLoginTabAlreadyOpen: "{store} login tab is already open.",
        otherLoginTabRunning: "Another auto-relogin tab is currently running.",
        cannotCreateLoginTabError: "Could not create login tab",
        loggingInBackgroundTab: "Logging into {store} in background tab",
        cannotOpenLoginWindowError: "Could not open login window: {error}",
        missingAppIdentifiersError: "Missing appUid/appId. Please reopen the store page to capture them.",
        triggerCatchUpUtc: "00:05 UTC Reset Catch-Up",
        triggerChromeStartup: "Chrome Startup",
        triggerIntervalAlarm: "Scheduled Interval",
        triggerUtcReset: "00:05 UTC Reset",
        triggerPostRelogin: "Auto-draw after relogin",
        triggerAutoCheck: "Auto Check",
        triggerDrawAll: "Draw All",
        reloginSuccessRefreshed: "Logged into {store}; refreshed {roles} character(s), {draws} draw(s) left.",
        reloginRefreshFailed: "Logged into {store}, but refresh failed: {error}",
        missingReloginStartTimeError: "Auto-relogin session start time not found.",
        noAccountSwitchPromptStatus: "No account-switch prompt on {store}; continuing with current session.",
        returnedToStoreCheckingSwitch: "Returned to {store}; checking for account-switch prompt.",
        cannotConfirmAccountSwitchError: "Could not confirm account-switch session",
        accountSwitchClickFailedError: "Found account-switch dialog but could not click the new account option.",
        accountSwitchDialogError: "Could not handle account-switch dialog: {error}",
        logHeaderAt: "{trigger} at {time}",
        logCheckingDraws: "Checking remaining draws...",
        logSkippedNoToken: "Skipped: no token",
        logSkippedExpiredToken: "Skipped: Token expired, triggering auto-relogin...",
        logCheckCompleteNoDrawsSkip: "Check complete: no draws left, skipping draw.",
        logCheckError: "Check error: {error}",
        invalidRoleListError: "Invalid character list response",
        logLoadRolesError: "Error loading character info: {error}",
        logFoundRoles: "Found {count} character(s)",
        logNoRolesFound: "No characters found",
        logFavoritesFiltered: "Favorites-only mode: filtered {matched}/{total} character(s)",
        logPausedTimeout: "Paused to avoid execution timeout; click draw again to continue.",
        rewardFallback: "Reward {id}",
        missingRewardInfoError: "Draw response missing reward information",
        logOutOfDrawsWithReason: "[{name}] Out of draws ({error})",
        logTokenExpiredStopDraw: "[{name}] Token expired, stopping draw: {error}",
        logNoDrawsLeftForRole: "[{name}] No draws left",
        logRoleError: "[{name}] Error: {error}",
        webhookDrawCompleteText: "🎲 [{store}] Completed {count} draw(s) for [{name}]!{avatar}\n{lines}",
        webhookDrawCompleteDiscord: "🎲 [{store}] Completed {count} draw(s) for **{name}**!",
        characterNotFoundError: "Character information not found",
        missingSurveyParamsError: "Missing CSRF token or survey parameters",
        invalidAccountSwitchSessionError: "No valid account-switch session",
        accountSwitchDetectedStatus: "Detected {store} account-switch prompt; selecting new account.",
        invalidTestAccountListError: "Invalid account list for testing.",
        reloginFlowAlreadyRunningError: "A relogin flow is already running. Please wait for it to finish and try again.",
        noValidReloginSessionError: "No valid auto-relogin session",
        invalidReloginReportSourceError: "Invalid login status report source",
        reloginSuccessStatus: "Logged into {store} successfully",
        reloginFailedStatus: "{store} login failed: {error}",
        reloginFailedNotificationTitle: "{store} login failed",
        unknownError: "Unknown error",
        noValidWebhookUrlError: "No valid webhook URL configured.",
        webhookTestMessage: "🔔 [ROK Auto] Webhook connection test successful!",
        allWebhooksFailedError: "All webhooks failed to send.",
        drawAlreadyRunningError: "A draw is already in progress for this store",
        noTokenInStorageError: "No token in storage. Please open the store page first.",
        tokenExpiredReloginError: "Token expired. Please capture a new token or log in again.",
        logDrawError: "Error during draw: {error}",
        invalidSurveySourceError: "Invalid survey request source",
        surveySuccessDefault: "Success",
    },
    vi: {
        // Header & Navigation
        storeSelectAria: "Chọn cửa hàng",
        switchThemeToDark: "Chuyển sang chế độ tối",
        switchThemeToLight: "Chuyển sang chế độ sáng",
        switchLangTitle: "Switch language to English",
        accountLabel: "Tài khoản",
        activeAccountAria: "Tài khoản đang chọn",
        captureBtnTitle: "Mở cửa hàng để lấy Token",
        captureBtn: "Lấy Token",
        refreshCharsTitle: "Làm mới danh sách nhân vật",
        refreshCharsAria: "Làm mới",
        navDraw: "Quay thưởng",
        navAnalytics: "Nhân phẩm",
        navAutomation: "Tự động",
        navSystem: "Hệ thống",
        mainNavAria: "Điều hướng chính",

        // Tab 1: Draw Deck
        heroDrawAria: "Thao tác quay thưởng",
        drawsRemaining: "{count} lượt còn lại",
        drawsRemainingPlaceholder: "- lượt còn lại",
        noToken: "Chưa có token",
        tokenExpired: "Token đã hết hạn",
        tokenInvalid: "Token không hợp lệ",
        tokenOk: "Token OK",
        tokenOkRemaining: "Token OK (còn {days}d {hours}h)",
        tokenSaved: "Token đã lưu",
        drawNowBtn: "Quay tài khoản này",
        drawingBtn: "Đang quay…",
        drawAllBtn: "Quay tất cả",
        drawingAllBtn: "Đang quay tất cả…",
        rosterFilterAria: "Bộ lọc nhân vật",
        charSearchPlaceholder: "Tìm tên, ID hoặc server…",
        charSearchAria: "Tìm kiếm nhân vật",
        clearSearchAria: "Xóa tìm kiếm",
        favFilterTitle: "Chỉ quay nhân vật yêu thích",
        favFilterLabel: "Yêu thích",
        toggleOn: "Bật",
        toggleOff: "Tắt",
        charListAria: "Danh sách nhân vật",
        loading: "Đang tải…",
        loadingData: "Đang tải dữ liệu…",
        refreshing: "Đang làm mới…",
        noCharsFound: "Không tìm thấy nhân vật",
        noMatchingChars: "Không tìm thấy nhân vật phù hợp",
        unknownName: "Không rõ tên",
        viewCharHistoryAria: "Xem lịch sử quay của {name}",
        removeFavorite: "Bỏ yêu thích",
        addFavorite: "Thêm vào yêu thích",
        copyCharInfo: "Sao chép ID và tên nhân vật",
        copied: "Đã sao chép",
        copiedCharInfoAria: "Đã sao chép thông tin nhân vật",
        copyCharInfoError: "Không thể sao chép thông tin nhân vật",
        noDataCapturePrompt: "Chưa có dữ liệu, hãy Lấy Token",
        clickRefreshToLoadChars: "Nhấn Làm mới để tải nhân vật",
        connectionError: "Lỗi kết nối",
        extensionConnectionError: "Lỗi kết nối extension",
        responseError: "Lỗi phản hồi",
        extensionEmptyResponse: "Extension không trả về dữ liệu",
        tokenExpiredReloginPrompt: "Token đã hết hạn. Vui lòng bấm Lấy Token để đăng nhập lại.",
        readDataError: "Lỗi đọc dữ liệu: {error}",
        loadFavoritesError: "Không thể tải nhân vật yêu thích: {error}",
        updateFavoriteError: "Không thể cập nhật yêu thích: {error}",
        saveSettingError: "Không thể lưu cài đặt: {error}",
        openStoreSuccess: "Đã mở cửa hàng; token sẽ được lưu tự động",
        openStoreError: "Không thể mở cửa hàng: {error}",
        refreshError: "Không thể làm mới: {error}",
        drawError: "Không thể quay thưởng: {error}",
        popupInitError: "Không thể khởi tạo popup: {error}",
        startingDraw: "Bắt đầu quay thưởng...",
        startingDrawAll: "Bắt đầu quay tuần tự tất cả tài khoản...",
        checkCompleteNoDraws: "Kiểm tra hoàn tất: không còn lượt quay nào.",

        // Character History Detail View
        backBtn: "Quay lại",
        drawHistoryTitle: "Lịch sử quay",
        exportCsvTitle: "Xuất file CSV",
        exportCsvBtn: "Xuất CSV",
        rewardsReceivedHead: "Phần thưởng đã nhận",
        noHistoryToExport: "Chưa có lịch sử quay để xuất.",
        noDrawHistory: "Chưa có lịch sử quay",
        invalidHistoryResponse: "Phản hồi lịch sử không hợp lệ",
        csvHistoryNo: "STT",
        csvHistoryTime: "Thời gian",
        csvHistoryCharacter: "Nhân vật",
        csvHistoryServer: "Server",
        csvHistoryReward: "Phần thưởng",
        csvHistoryQuantity: "Số lượng",
        csvHistoryRewardId: "Mã phần thưởng",
        errorPrefix: "Lỗi: {error}",

        // Tab 2: Analytics & Leaderboard
        rewardSummaryTitle: "Thống kê phần thưởng",
        statsScopeAria: "Phạm vi thống kê",
        statsWeekly: "Tuần này",
        statsAllTime: "Tất cả",
        noRewardsWeekly: "Chưa có phần thưởng nào trong tuần này.",
        noRewardsAllTime: "Chưa có thống kê phần thưởng nào.",
        leaderboardTitle: "Bảng xếp hạng nhân phẩm tuần",
        leaderboardMeta: "Reset Thứ Sáu 00:05 UTC",
        noLeaderboardData: "Chưa có dữ liệu nhân phẩm tuần này.",
        pointsSuffix: "{score} đ",
        clearRewardsBtn: "Xóa thống kê",
        noRewardsToExport: "Chưa có phần thưởng nào để xuất.",
        confirmClearRewards: "Bạn có chắc muốn xóa toàn bộ thống kê phần thưởng?",
        csvScope: "Phạm vi",
        csvReward: "Phần thưởng",
        csvQuantity: "Số lượng",
        csvWeekPrefix: "Tuần {week}",
        csvAllTime: "Tất cả",
        csvRank: "Hạng",
        csvCharacter: "Nhân vật",
        csvServer: "Server",
        csvLuckScore: "Điểm nhân phẩm",
        csvRewardDetails: "Chi tiết phần thưởng",

        // Tab 3: Automation & Accounts
        autoCheckTitle: "Lịch tự động kiểm tra",
        autoCheckModeAria: "Chọn chế độ kiểm tra",
        modeUtcReset: "Theo giờ reset UTC",
        modeCustomInterval: "Định kỳ tùy chỉnh",
        utcResetDayLabel: "Mục tiêu ngày reset",
        utcDayFriday: "Thứ Sáu (Reset sự kiện RoK)",
        utcDayEveryday: "Mỗi ngày (Daily 00:05 UTC)",
        utcDayMonday: "Thứ Hai hàng tuần",
        utcDaySunday: "Chủ Nhật hàng tuần",
        utcResetNote: "Chạy lúc 00:05 UTC (tự làm mới token lúc 23:50 UTC). Tự động bù lượt nếu mở trình duyệt muộn.",
        intervalMinutesLabel: "Thời gian giữa mỗi lần kiểm tra (phút)",
        intervalPresetsAria: "Thời gian kiểm tra có sẵn",
        preset1hTitle: "1 giờ (60 phút - 24 lần/ngày)",
        preset2hTitle: "2 giờ (120 phút - 12 lần/ngày)",
        preset3hTitle: "3 giờ (180 phút - 8 lần/ngày)",
        preset4hTitle: "4 giờ (240 phút - 6 lần/ngày)",
        preset6hTitle: "6 giờ (360 phút - 4 lần/ngày)",
        preset8hTitle: "8 giờ (480 phút - 3 lần/ngày)",
        preset12hTitle: "12 giờ (720 phút - 2 lần/ngày)",
        preset24hTitle: "24 giờ (1440 phút - 1 lần/ngày)",
        autoCheckEnabledStatus: "Đã bật kiểm tra tự động.",
        autoCheckDisabledStatus: "Đã tắt kiểm tra tự động.",
        updateSettingError: "Không thể cập nhật cài đặt: {error}",
        intervalSavedStatus: "Đã đặt thời gian kiểm tra mỗi {minutes} phút{hourText}.",
        intervalHoursSuffix: " ({hours} giờ)",
        intervalSaveError: "Không thể lưu thời gian kiểm tra: {error}",
        intervalValidationError: "Thời gian kiểm tra phải là số phút nguyên từ 1 trở lên.",

        autoReloginTitle: "Tài khoản & tự đăng nhập lại",
        storeLoginTabsAria: "Cấu hình đăng nhập cửa hàng",
        addAccountBtn: "+ Thêm tài khoản",
        accountIsolationNote: "Mỗi tài khoản có token và dữ liệu quay thưởng riêng.",
        saveLoginBtn: "Lưu thông tin",
        clearLoginBtn: "Xóa tất cả",
        testPlutoAccountsBtn: "Check lần lượt Pluto",
        testLilithAccountsBtn: "Check lần lượt Lilith",
        testPlutoReloginBtn: "Relogin Pluto",
        testLilithReloginBtn: "Relogin Lilith",
        testPlutoReloginTitle: "Kiểm tra tài khoản Plutomall đang chọn",
        testLilithReloginTitle: "Kiểm tra tài khoản Lilith Store đang chọn",
        accountItemTitle: "Tài khoản {index}",
        accountItemTitleWithUser: "Tài khoản {index} ({username})",
        expandAccount: "Mở rộng Tài khoản {index}",
        collapseAccount: "Thu nhỏ Tài khoản {index}",
        removeAccountTitle: "Xóa tài khoản",
        storeAccountLabel: "Tài khoản {store}",
        passwordLabel: "Mật khẩu",
        showPassword: "Hiện mật khẩu",
        hidePassword: "Ẩn mật khẩu",
        unnamedAccount: "Tài khoản chưa đặt tên",
        accountIncompleteError: "Mỗi tài khoản {store} cần có cả tên đăng nhập và mật khẩu.",
        saveAccountError: "Không thể lưu tài khoản: {error}",
        autoReloginDisabledStatus: "Đã tắt tự đăng nhập. Thông tin đã lưu được giữ nguyên.",
        autoReloginEnabledStatus: "Đã bật tự đăng nhập {store} bằng thông tin đã lưu.",
        autoReloginNoCredsStatus: "Chưa có thông tin {store} đã lưu. Thêm tài khoản và bấm Lưu thông tin.",
        accountsSavedAutoStatus: "Đã lưu tài khoản. Auto kiểm tra sẽ xử lý lần lượt các tài khoản có token.",
        credentialsSavedStatus: "Đã lưu thông tin đăng nhập.",
        saveGenericError: "Không thể lưu: {error}",
        confirmClearAccounts: "Bạn có chắc chắn muốn xóa toàn bộ tài khoản và thông tin đã lưu?",
        accountsClearedStatus: "Đã xóa toàn bộ tài khoản đã lưu.",
        clearAccountsError: "Không thể xóa thông tin: {error}",
        testCannotStartError: "Không thể kiểm tra: {error}",
        selectOrAddAccountPrompt: "Hãy chọn hoặc thêm tài khoản {store} trước khi kiểm tra.",
        enterFullCredentialsPrompt: "Hãy nhập và lưu đủ tài khoản, mật khẩu {store} trước khi kiểm tra.",
        testingAndOpeningTabStatus: "Đang kiểm tra và mở tab đăng nhập {store}…",
        sendRequestError: "Không gửi được yêu cầu: {error}",
        testFailedError: "Kiểm tra thất bại: {error}",
        openedBgTabStatus: "Đã mở tab nền {store}. Theo dõi trạng thái để kiểm tra flow đăng nhập.",
        cannotStartLoginError: "Không thể khởi chạy đăng nhập: {error}",
        cannotStartLoginFallback: "Không thể khởi chạy đăng nhập. Kiểm tra cài đặt và thông tin tài khoản.",
        noFullStoreAccountsPrompt: "Chưa có tài khoản đầy đủ của {store}.",
        testingSequentialAccountsStatus: "Đang kiểm tra tuần tự {count} tài khoản {store}.",

        // Tab 4: System & Config
        webhookTitle: "Thông báo Webhook",
        webhookUrlLabel: "URL Webhook (mỗi dòng một URL)",
        saveWebhookBtn: "Lưu Webhook",
        testWebhookBtn: "Gửi thử nghiệm",
        webhookGuideTitle: "Định dạng webhook hỗ trợ:",
        webhookEnabledStatus: "Đã bật thông báo Webhook.",
        webhookDisabledStatus: "Đã tắt thông báo Webhook.",
        webhookSavedCountStatus: "Đã lưu {count} URL Webhook.",
        webhookSavedEmptyStatus: "Đã lưu Webhook (danh sách trống).",
        webhookSendingTest: "Đang gửi thử nghiệm...",
        webhookExtError: "Lỗi extension: {error}. Hãy tải lại tiện ích.",
        webhookTestSuccess: "Gửi thành công {success}/{total} webhook!",
        webhookTestFailed: "Gửi thất bại: {error}",
        webhookCheckUrlFallback: "Vui lòng kiểm tra lại URL",

        discordWebhookTitle: "Discord Webhook",
        discordWebhookUrlLabel: "URL Discord Webhook (mỗi dòng một URL)",
        saveDiscordWebhookBtn: "Lưu Discord",
        testDiscordWebhookBtn: "Gửi thử nghiệm",
        discordWebhookEnabledStatus: "Đã bật Discord Webhook.",
        discordWebhookDisabledStatus: "Đã tắt Discord Webhook.",
        discordWebhookSavedStatus: "Đã lưu {count} URL Discord Webhook.",
        discordWebhookSavedEmptyStatus: "Đã lưu Discord Webhook (danh sách trống).",

        telegramWebhookTitle: "Telegram Webhook",
        telegramWebhookUrlLabel: "URL Telegram Webhook (mỗi dòng một URL)",
        saveTelegramWebhookBtn: "Lưu Telegram",
        testTelegramWebhookBtn: "Gửi thử nghiệm",
        telegramWebhookEnabledStatus: "Đã bật Telegram Webhook.",
        telegramWebhookDisabledStatus: "Đã tắt Telegram Webhook.",
        telegramWebhookSavedStatus: "Đã lưu {count} URL Telegram Webhook.",
        telegramWebhookSavedEmptyStatus: "Đã lưu Telegram Webhook (danh sách trống).",

        configOptDiscordWebhook: "Thông báo Discord Webhook",
        configOptTelegramWebhook: "Thông báo Telegram Webhook",

        configTitle: "Xuất / nhập cấu hình",
        configWarningNote: "Mặc định không lưu mật khẩu. Nếu nhập mật khẩu bảo vệ bên dưới, mật khẩu tài khoản sẽ được mã hóa AES-GCM.",
        selectAll: "Chọn tất cả",
        deselectAll: "Bỏ chọn tất cả",
        selectAllSettingsAria: "Chọn tất cả cài đặt",
        deselectAllSettingsAria: "Bỏ chọn tất cả cài đặt",
        selectedCountLabel: "{selected}/{total} được chọn",
        configOptionsAria: "Chọn cài đặt cần xuất",
        configOptDrawFavoritesOnly: "Chỉ quay nhân vật yêu thích",
        configOptAutoReloginEnabled: "Auto đăng nhập lại",
        configOptAutoCheckIntervalMinutes: "Thời gian Auto kiểm tra",
        configOptAutoCheckEnabled: "Bật Auto kiểm tra",
        configOptTheme: "Chế độ giao diện (Sáng / Tối)",
        configOptLanguage: "Ngôn ngữ (EN / VI)",
        configOptAutoCheckMode: "Chế độ Auto kiểm tra (UTC / Định kỳ)",
        configOptWebhookEnabled: "Bật thông báo Webhook",
        configOptRewardTotals: "Thống kê phần thưởng",
        configOptStoreAccounts: "Tài khoản cửa hàng",
        configOptFavoriteRoleIds: "Nhân vật yêu thích",
        configOptTokens: "Token",
        configPassphraseLabel: "Mật khẩu bảo vệ file (tùy chọn — mã hóa AES-GCM)",
        configPassphrasePlaceholder: "Để trống nếu không cần lưu mật khẩu tài khoản…",
        exportConfigBtn: "Xuất cấu hình",
        importConfigBtn: "Nhập cấu hình",
        selectAtLeastOneExport: "Hãy chọn ít nhất một cài đặt để xuất.",
        noSavedSettingsInSelection: "Không có cài đặt đã lưu nào trong các mục được chọn.",
        invalidSettingValueError: "Giá trị cài đặt {key} không hợp lệ.",
        exportedSettingsStatus: "Đã xuất {count} cài đặt.",
        exportConfigError: "Không thể xuất cấu hình: {error}",
        unsupportedConfigFormatError: "File không đúng định dạng cấu hình được hỗ trợ.",
        invalidConfigSettingsError: "Cài đặt trong file không hợp lệ hoặc không được hỗ trợ.",
        encryptedConfigPrompt: "File cấu hình này có tài khoản được mã hóa. Nhập mật khẩu giải mã:",
        passphraseRequiredError: "Cần nhập mật khẩu bảo vệ để giải mã tài khoản.",
        invalidDecryptedAccountsError: "Dữ liệu tài khoản sau khi giải mã không hợp lệ.",
        decryptFailedError: "Mật khẩu giải mã không đúng hoặc dữ liệu bị hỏng.",
        legacyAccountMissingPairError: "File cần có cả tài khoản và mật khẩu {store}.",
        importedSettingsStatus: "Đã nhập {count} cài đặt từ {file}.",
        importConfigError: "Không thể nhập cấu hình: {error}",

        languageTitle: "Ngôn ngữ",
        languageSelectAria: "Chọn ngôn ngữ",
        langEnglish: "English",
        langVietnamese: "Tiếng Việt",

        themeTitle: "Chế độ giao diện",
        themeSelectAria: "Chọn chế độ giao diện",
        themeSystem: "Hệ thống",
        themeLight: "Sáng",
        themeDark: "Tối",

        tokenTitle: "Token",
        copyTokenTitle: "Sao chép token",
        tokenPlaceholder: "Token sẽ hiện ở đây sau khi lấy…",
        noTokenToCopy: "Chưa có token để sao chép.",
        copiedTokenAria: "Đã sao chép token",
        copiedTokenStatus: "Đã sao chép token.",
        copyTokenError: "Không thể sao chép token",
        copyTokenErrorStatus: "Không thể sao chép token: {error}",

        // Log Drawer & Footer
        logSectionAria: "Nhật ký hoạt động",
        logDrawerTitle: "Nhật ký hoạt động",
        hideLogTitle: "Ẩn nhật ký",
        toggleLogTitle: "Bật/tắt nhật ký hoạt động",
        footerLogBtn: "Nhật ký",
        utcClockAria: "Giờ UTC",
        noSessionLogsYet: "Chưa có nhật ký hoạt động trong phiên này.",

        // Background / Shared Errors, Logs & Webhooks
        embedCharacter: "👤 Nhân vật",
        embedCharacterId: "🆔 Character ID",
        embedRewards: "🎁 Phần thưởng",
        embedNoItems: "**Không có vật phẩm**",
        invalidManifestError: "Không tìm thấy manifest hợp lệ cho {store}",
        missingDrawCounterError: "Không xác định được bộ đếm lượt quay của {store} trong manifest",
        invalidDrawCounterError: "Bộ đếm lượt quay của {store} không hợp lệ",
        cannotOpenLoginTabError: "Không thể mở tab đăng nhập.",
        reloginSeqCompleteWithFailures: "Đã kiểm tra xong các tài khoản; {count} tài khoản thất bại.",
        reloginSeqCompleteSuccess: "Đã hoàn tất kiểm tra tuần tự các tài khoản.",
        webhookReloginFailed: "⚠️ [ROK Auto] Đăng nhập thất bại {count} tài khoản:\n{details}",
        requestTimeoutError: "Yêu cầu hết thời gian chờ",
        networkError: "Lỗi kết nối: {error}",
        nonJsonResponseError: "Phản hồi API không phải JSON (HTTP {status})",
        apiHttpError: "API trả về HTTP {status}",
        enableAutoReloginFirst: "Hãy bật Auto đăng nhập lại trước khi kiểm tra.",
        missingStoreCredentials: "Thiếu tài khoản hoặc mật khẩu {store}.",
        storeLoginTabAlreadyOpen: "Tab đăng nhập {store} đã đang mở.",
        otherLoginTabRunning: "Một tab tự đăng nhập khác đang chạy.",
        cannotCreateLoginTabError: "Không tạo được tab đăng nhập",
        loggingInBackgroundTab: "Đang đăng nhập {store} trong tab nền",
        cannotOpenLoginWindowError: "Không thể mở cửa sổ đăng nhập: {error}",
        missingAppIdentifiersError: "Thiếu appUid/appId. Hãy mở lại trang cửa hàng để lấy thông tin.",
        triggerCatchUpUtc: "Bù lượt reset 00:05 UTC",
        triggerChromeStartup: "Khởi động Chrome",
        triggerIntervalAlarm: "Alarm định kỳ",
        triggerUtcReset: "Reset 00:05 UTC",
        triggerPostRelogin: "Tự động quay sau đăng nhập",
        triggerAutoCheck: "Kiểm tra tự động",
        triggerDrawAll: "Quay tất cả",
        reloginSuccessRefreshed: "Đăng nhập {store} thành công; đã làm mới {roles} nhân vật, còn {draws} lượt.",
        reloginRefreshFailed: "Đăng nhập {store} xong nhưng làm mới thất bại: {error}",
        missingReloginStartTimeError: "Không tìm thấy thời điểm bắt đầu phiên tự đăng nhập.",
        noAccountSwitchPromptStatus: "Không xuất hiện yêu cầu đổi tài khoản {store}; đang tiếp tục với phiên cửa hàng hiện có.",
        returnedToStoreCheckingSwitch: "Đã trở về {store}; đang kiểm tra yêu cầu chuyển sang tài khoản mới.",
        cannotConfirmAccountSwitchError: "Không xác nhận được phiên đổi tài khoản",
        accountSwitchClickFailedError: "Đã thấy hộp thoại đổi tài khoản nhưng không bấm được lựa chọn tài khoản mới.",
        accountSwitchDialogError: "Không thể xử lý hộp thoại chuyển tài khoản: {error}",
        logHeaderAt: "{trigger} lúc {time}",
        logCheckingDraws: "Đang kiểm tra lượt quay...",
        logSkippedNoToken: "Bỏ qua: chưa có token",
        logSkippedExpiredToken: "Bỏ qua: Token đã hết hạn, kích hoạt tự đăng nhập lại...",
        logCheckCompleteNoDrawsSkip: "Kiểm tra hoàn tất: không còn lượt quay, bỏ qua quay thưởng.",
        logCheckError: "Lỗi kiểm tra: {error}",
        invalidRoleListError: "Phản hồi danh sách nhân vật không hợp lệ",
        logLoadRolesError: "Lỗi khi tải thông tin nhân vật: {error}",
        logFoundRoles: "Tìm thấy {count} nhân vật",
        logNoRolesFound: "Không tìm thấy nhân vật nào",
        logFavoritesFiltered: "Chỉ quay nhân vật yêu thích: lọc {matched}/{total} nhân vật",
        logPausedTimeout: "Đã tạm dừng để tránh quá thời gian chạy; có thể bấm quay lại để tiếp tục.",
        rewardFallback: "Phần thưởng {id}",
        missingRewardInfoError: "Phản hồi quay thưởng thiếu thông tin phần thưởng",
        logOutOfDrawsWithReason: "[{name}] Đã hết lượt quay ({error})",
        logTokenExpiredStopDraw: "[{name}] Token đã hết hạn, dừng quay: {error}",
        logNoDrawsLeftForRole: "[{name}] Không còn lượt quay nào",
        logRoleError: "[{name}] Lỗi: {error}",
        webhookDrawCompleteText: "🎲 [{store}] Hoàn tất {count} lượt quay cho [{name}]!{avatar}\n{lines}",
        webhookDrawCompleteDiscord: "🎲 [{store}] Hoàn tất {count} lượt quay cho **{name}**!",
        characterNotFoundError: "Không tìm thấy thông tin nhân vật",
        missingSurveyParamsError: "Thiếu mã CSRF hoặc tham số khảo sát",
        invalidAccountSwitchSessionError: "Không có phiên đổi tài khoản hợp lệ",
        accountSwitchDetectedStatus: "Đã phát hiện yêu cầu chuyển tài khoản {store}; đang chọn tài khoản mới.",
        invalidTestAccountListError: "Danh sách tài khoản kiểm tra không hợp lệ.",
        reloginFlowAlreadyRunningError: "Một luồng đăng nhập lại đang chạy. Hãy chờ luồng đó hoàn tất rồi thử lại.",
        noValidReloginSessionError: "Không có phiên tự đăng nhập hợp lệ",
        invalidReloginReportSourceError: "Nguồn báo trạng thái đăng nhập không hợp lệ",
        reloginSuccessStatus: "Đăng nhập {store} thành công",
        reloginFailedStatus: "Đăng nhập {store} thất bại: {error}",
        reloginFailedNotificationTitle: "Đăng nhập {store} thất bại",
        unknownError: "Lỗi không xác định",
        noValidWebhookUrlError: "Chưa có URL webhook nào hợp lệ.",
        webhookTestMessage: "🔔 [ROK Auto] Kiểm tra kết nối Webhook thành công!",
        allWebhooksFailedError: "Tất cả webhook đều gửi thất bại.",
        drawAlreadyRunningError: "Đang có lượt quay chạy cho cửa hàng này",
        noTokenInStorageError: "Không có token trong bộ nhớ. Vui lòng mở trang quay thưởng trước.",
        tokenExpiredReloginError: "Token đã hết hạn. Vui lòng lấy token mới hoặc đăng nhập lại.",
        logDrawError: "Lỗi khi quay thưởng: {error}",
        invalidSurveySourceError: "Nguồn yêu cầu khảo sát không hợp lệ",
        surveySuccessDefault: "Thành công",
    },
};

function t(key, params = {}, lang = DEFAULT_LANGUAGE) {
    const activeLang = normalizeLanguage(lang);
    const dict = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
    const template = Object.prototype.hasOwnProperty.call(dict, key)
        ? dict[key]
        : Object.prototype.hasOwnProperty.call(TRANSLATIONS.en, key)
            ? TRANSLATIONS.en[key]
            : String(key);
    if (!params || typeof params !== "object") return template;
    return template.replace(/\{(\w+)\}/g, (match, paramKey) =>
        Object.prototype.hasOwnProperty.call(params, paramKey) && params[paramKey] !== undefined && params[paramKey] !== null
            ? String(params[paramKey])
            : match
    );
}

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

function buildSingleDiscordRewardEmbed(storeName, role, rewards, sessionRewardIcons, lang = DEFAULT_LANGUAGE) {
    const rewardLines = Object.entries(rewards).map(([name, count]) => {
        const displayName = translateRewardName(name, lang);
        const icon = sessionRewardIcons[name] || sessionRewardIcons[displayName];
        return (icon && typeof icon === "string" && icon.startsWith("http"))
            ? `**[${displayName}](${icon}) x${count}**`
            : `**${displayName} x${count}**`;
    }).join("\n");

    const embed = {
        title: `🎉 LUCKY DRAW - ${storeName.toUpperCase()}`,
        color: 16757578,
        fields: [
            {
                name: t("embedCharacter", {}, lang),
                value: `**${role.name || "N/A"}**`,
                inline: true,
            },
            {
                name: t("embedCharacterId", {}, lang),
                value: String(role.roleId || "N/A"),
                inline: true,
            },
            {
                name: t("embedRewards", {}, lang),
                value: rewardLines || t("embedNoItems", {}, lang),
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
        .map(name => sessionRewardIcons[name] || sessionRewardIcons[translateRewardName(name, lang)])
        .find(u => u && typeof u === "string" && u.startsWith("http"));
    if (firstIcon) {
        embed.image = { url: firstIcon };
    }

    return embed;
}

function getRoleDrawCount(manifest, mall, lang = DEFAULT_LANGUAGE) {
    const componentId = STORE_CONFIG[mall]?.componentId;
    if (!componentId || !manifest || typeof manifest !== "object") {
        throw new Error(t("invalidManifestError", { store: STORE_NAMES[mall] }, lang));
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
            t("missingDrawCounterError", { store: STORE_NAMES[mall] }, lang)
        );
    }

    const rawCount = candidates[0].rawCount;
    if (typeof rawCount === "string" && rawCount.trim() === "") {
        throw new Error(t("invalidDrawCounterError", { store: STORE_NAMES[mall] }, lang));
    }
    const count = Number(rawCount);
    if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error(t("invalidDrawCounterError", { store: STORE_NAMES[mall] }, lang));
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
    "2,000 Gems": 2000,
    "Tăng tốc 24 giờ": 1500,
    "24-Hour Speedup": 1500,
    "Rương Tự Chọn Vật Liệu Trang Bị": 1400,
    "Equipment Material Choice Chest": 1400,
    "Tăng tốc 8 giờ": 600,
    "8-Hour Speedup": 600,
    "500 Đá Quý": 500,
    "500 Gems": 500,
    "Tăng tốc 3 giờ": 300,
    "3-Hour Speedup": 300,
    "200 Đá Quý": 200,
    "200 Gems": 200,
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

async function decryptJsonWithPassphrase(envelope, passphrase, lang = DEFAULT_LANGUAGE) {
    try {
        const salt = base64ToBytes(envelope.salt);
        const iv = base64ToBytes(envelope.iv);
        const cipherBytes = base64ToBytes(envelope.data);
        const iterations = Number(envelope.iterations) || 100000;
        const key = await deriveAesGcmKey(passphrase, salt, iterations);
        const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
        return JSON.parse(new TextDecoder().decode(plainBuf));
    } catch {
        throw new Error(t("decryptFailedError", {}, lang));
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
    if (selectedKeys.includes("discordWebhookEnabled") && (typeof storedSettings.discordWebhookUrl === "string" || typeof currentSettings.discordWebhookUrl === "string")) {
        settings.discordWebhookUrl = storedSettings.discordWebhookUrl ?? currentSettings.discordWebhookUrl;
    }
    if (selectedKeys.includes("telegramWebhookEnabled") && (typeof storedSettings.telegramWebhookUrl === "string" || typeof currentSettings.telegramWebhookUrl === "string")) {
        settings.telegramWebhookUrl = storedSettings.telegramWebhookUrl ?? currentSettings.telegramWebhookUrl;
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
    language: value => typeof value === "string" && SUPPORTED_LANGUAGES.includes(value),
    utcResetDay: value => typeof value === "string" || Number.isInteger(value),
    lastUtcResetDate: value => typeof value === "string",
    webhookEnabled: value => typeof value === "boolean",
    webhookUrl: value => typeof value === "string",
    discordWebhookEnabled: value => typeof value === "boolean",
    discordWebhookUrl: value => typeof value === "string",
    telegramWebhookEnabled: value => typeof value === "boolean",
    telegramWebhookUrl: value => typeof value === "string",
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

const POPUP_TABS = ["draw", "analytics", "automation", "system"];

function normalizePopupTab(tab) {
    return POPUP_TABS.includes(tab) ? tab : "draw";
}

if (typeof module !== "undefined") {
    module.exports = {
        STORE_CONFIG, STORE_NAMES, isReloginStoreUrl, accountStorageKey,
        parseJwtPayload, getJwtExp, isJwtExpired, isJwtExpiringSoon, isExpiredTokenResponse, parseWebhookUrls, buildWebhookBody,
        getRewardIcons, buildSingleDiscordRewardEmbed, getRoleDrawCount,
        getNextUtcResetTime, getPreResetReloginTime, getCurrentWeekKey, getTodayUtcDateString, isUtcResetMissed,
        normalizeSearchText, matchesSearch, toCsv,
        stripStoreAccountsPasswords, mergeRewardTotals, REWARD_POINTS, getRewardPoints,
        filterRolesForDraw, mergeWeeklyStats, encryptJsonWithPassphrase, decryptJsonWithPassphrase,
        buildExportSettings, CONFIG_SETTING_VALIDATORS, POPUP_TABS, normalizePopupTab,
        SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, normalizeLanguage,
        REWARDS_BY_ID, getRewardNameById, translateRewardName, normalizeTranslatedRewards,
        TRANSLATIONS, t,
    };
}
