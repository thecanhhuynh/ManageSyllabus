const path = require("path");
const { chromium } = require("C:/Users/Admin/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity-ide/brain/aa8bf06b-5d86-4788-85ba-237704c8ff66";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });

  try {
    console.log("=== BƯỚC 1: GIẢNG VIÊN MỞ MÀN HÌNH CHỈNH SỬA ĐỀ CƯƠNG ===");
    const lecturerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await lecturerContext.addCookies([
      { name: "token", value: "test_lecturer_201_valid_token_123", domain: "localhost", path: "/" },
    ]);
    const lecturerPage = await lecturerContext.newPage();

    lecturerPage.on("console", (msg) => {
      if (msg.type() === "error") console.log("[Lecturer Console Error]:", msg.text());
    });

    await lecturerPage.goto("http://localhost:3000/syllabuses/1", { waitUntil: "networkidle" });
    await lecturerPage.waitForTimeout(3000);

    const shot1 = path.join(ARTIFACT_DIR, "realtime_step1_lecturer_editing.png");
    await lecturerPage.screenshot({ path: shot1 });
    console.log("1. Màn hình giảng viên đang chỉnh sửa đề cương: ", shot1);

    console.log("\n=== BƯỚC 2: CHUYÊN VIÊN BAN HÀNH CẬP NHẬT PHIÊN BẢN / STYLE MỚI ===");
    const specialistContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await specialistContext.addCookies([
      { name: "token", value: "XNm7P0nQLw0wO3qGziL8oA9uj8c4Ib", domain: "localhost", path: "/" },
    ]);
    const specialistPage = await specialistContext.newPage();
    await specialistPage.goto("http://localhost:3000/specialist/templates/1/builder", { waitUntil: "networkidle" });
    await specialistPage.waitForTimeout(2000);

    console.log("Chuyên viên mở popconfirm 'Ban hành'...");
    const publishBtn = specialistPage.locator('button:has-text("Ban hành")').first();
    await publishBtn.waitFor({ state: "visible", timeout: 10000 });
    await publishBtn.click();
    await specialistPage.waitForTimeout(500);

    console.log("Chuyên viên nhấn 'Đồng ý ban hành'...");
    const confirmBtn = specialistPage.locator('.ant-popconfirm button:has-text("Đồng ý ban hành"), button.ant-btn-primary:has-text("Đồng ý ban hành")').first();
    await confirmBtn.waitFor({ state: "visible", timeout: 5000 });
    await confirmBtn.click();
    await specialistPage.waitForTimeout(2500);

    const shot2 = path.join(ARTIFACT_DIR, "realtime_step2_specialist_published.png");
    await specialistPage.screenshot({ path: shot2 });
    console.log("2. Chuyên viên đã ban hành phiên bản mới: ", shot2);

    console.log("\n=== BƯỚC 3: MÀN HÌNH GIẢNG VIÊN XUẤT HIỆN THÔNG BÁO REALTIME ===");
    await lecturerPage.bringToFront();
    const notificationNotice = lecturerPage.locator(".ant-notification-notice").first();
    await notificationNotice.waitFor({ state: "visible", timeout: 15000 });

    const notifText = await notificationNotice.innerText();
    console.log("-> ĐÃ NHẬN THÔNG BÁO REALTIME TRÊN MÀN HÌNH GIẢNG VIÊN!");
    console.log("   Nội dung thông báo:\n" + notifText.split("\n").map(l => "   " + l).join("\n"));

    const shot3 = path.join(ARTIFACT_DIR, "realtime_step3_lecturer_notification.png");
    await lecturerPage.screenshot({ path: shot3 });
    console.log("3. Ảnh chụp màn hình giảng viên nhận thông báo: ", shot3);

    console.log("\n=== BƯỚC 4: KIỂM TRA CHỨC NĂNG RELOAD & CẬP NHẬT GIAO DIỆN ===");
    const reloadBtn = lecturerPage.locator(".ant-notification-notice button").first();
    const btnText = await reloadBtn.innerText();
    console.log("Nút hành động trong thông báo:", btnText);

    await reloadBtn.click();
    await lecturerPage.waitForTimeout(2500);

    const shot4 = path.join(ARTIFACT_DIR, "realtime_step4_lecturer_reloaded.png");
    await lecturerPage.screenshot({ path: shot4 });
    console.log("4. Ảnh chụp sau khi giảng viên click reload dữ liệu: ", shot4);

    console.log("\n=== KIỂM TRA THÊM: SỰ KIỆN SYNC_COMPLETED (THAY ĐỔI CẤU TRÚC ĐỀ CƯƠNG MẪU) ===");
    const { execSync } = require("child_process");
    execSync(`python -c "import redis, json; r = redis.StrictRedis(); r.publish('syllabus_sync_channel', json.dumps({'action': 'sync_completed', 'template_id': 1}))"`);

    await lecturerPage.waitForTimeout(1500);
    const syncNotif = lecturerPage.locator(".ant-notification-notice:has-text('Template đã được cập nhật')").first();
    await syncNotif.waitFor({ state: "visible", timeout: 10000 });
    const syncText = await syncNotif.innerText();
    console.log("-> ĐÃ NHẬN THÔNG BÁO SYNC_COMPLETED:\n" + syncText.split("\n").map(l => "   " + l).join("\n"));

    const shot5 = path.join(ARTIFACT_DIR, "realtime_step5_sync_completed_notification.png");
    await lecturerPage.screenshot({ path: shot5 });
    console.log("5. Ảnh chụp thông báo cấu trúc mới: ", shot5);

    const syncReloadBtn = syncNotif.locator("button:has-text('Tải lại dữ liệu ngay')");
    await syncReloadBtn.click();
    await lecturerPage.waitForTimeout(1500);
    console.log("-> Đã click 'Tải lại dữ liệu ngay', dữ liệu được nạp lại thành công!");

    console.log("\n>>> TẤT CẢ CÁC BƯỚC KIỂM TRA ĐỒNG BỘ REALTIME ĐỀU THÀNH CÔNG 100%! <<<");
  } finally {
    await browser.close();
  }
})();
