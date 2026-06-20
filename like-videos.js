const fs = require("fs");
const { chromium } = require("playwright");
const CHANNEL_NAME = process.argv[2];

async function switchChannelIfNeeded(page, channelName) {
  if (!channelName) return;

  await page.locator("#avatar-btn").click();
  await page.getByText("계정 전환", { exact: true }).click();

  //현재 채널 확인
  const selectedAccount = page.locator(
    "ytd-account-item-renderer:has(yt-icon#selected:not([hidden]))",
  );

  await selectedAccount.waitFor({ state: "visible", timeout: 10000 });

  const currentChannel = await selectedAccount
    .locator("#channel-title")
    .textContent();

  console.log("현재 채널:", currentChannel?.trim());

  //채널이 일치하는지 확인
  if (currentChannel.trim() === channelName) {
    console.log("이미 해당 채널:", channelName);
    await page.keyboard.press("Escape");
    return;
  }
  //채널 전환
  await page
    .locator("ytd-account-item-renderer")
    .filter({ has: page.locator("#channel-title", { hasText: channelName }) })
    .first()
    .click();

  await page.waitForTimeout(2000);

  console.log("채널 전환:", channelName);
}

(async () => {
  const videos = JSON.parse(fs.readFileSync("non-music-cleaned.json", "utf8"));
  const context = await chromium.launchPersistentContext(
    "C:/youtube-auto-profile",
    {
      headless: false,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    },
  );
  const page = await context.newPage();

  await page.goto("https://www.youtube.com", {
    waitUntil: "domcontentloaded",
  });
  await switchChannelIfNeeded(page, CHANNEL_NAME);
  const selectedvideos = videos.slice(50, 86);

  for (const video of selectedvideos) {
    await page.goto(video.url, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page.waitForTimeout(2000);

    const likeButton = page.locator('button[aria-label*="좋아요 표시"]').nth(1);

    const pressed = await likeButton.getAttribute("aria-pressed");

    if (pressed !== "true") {
      await likeButton.click();
      await page.waitForTimeout(3000);
      console.log("좋아요 표시 완료");
    } else {
      console.log(" 이미 좋아요");
    }
  }

  await page.waitForTimeout(1000);
  process.exit(0);
})();
