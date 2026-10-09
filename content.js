(async () => {
    const surveyCsrf = document.querySelector('input#_csrf')?.value;
    if (!surveyCsrf) {
        console.warn("[LilithDraw] Không tìm thấy CSRF token cho khảo sát");
        return;
    }
    const params = Object.fromEntries(new URL(location.href).searchParams.entries());
    chrome.runtime.sendMessage(
        { type: "surveyCsrf", csrf: surveyCsrf, params },
        response => {
            if (chrome.runtime.lastError) {
                console.error("[LilithDraw] Không gửi được yêu cầu khảo sát:", chrome.runtime.lastError.message);
            } else if (response?.error) {
                console.error("[LilithDraw] Gửi khảo sát thất bại:", response.error);
            }
        }
    );
})();