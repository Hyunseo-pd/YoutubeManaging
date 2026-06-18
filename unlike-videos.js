const fs = require("fs");
const { chromium } = require("playwright");
const CHANNEL_NAME = process.argv[2];

async function switchChannelIfNeeded(page, channelName) {
  if (!channelName) return;

  await page.locator("#avatar-btn").click();
  await page.getByText("계정 전환", { exact: true }).click();

  const accounts = page.locator("ytd-account-item-renderer");
  await accounts.first().waitFor({ state: "visible", timeout: 10000 });

  const currentChannel = await accounts
    .filter({ has: page.locator("yt-icon#selected") })
    .locator("#channel-title")
    .last()
    .textContent();

  if (currentChannel.trim() === channelName) {
    console.log("이미 해당 채널:", channelName);
    await page.keyboard.press("Escape");
    return;
  }

  await page
    .locator("ytd-account-item-renderer")
    .filter({ has: page.locator("#channel-title", { hasText: channelName }) })
    .first()
    .click();

  await page.waitForTimeout(2000);

  console.log("채널 전환:", channelName);
}

(async () => {
  const videos = JSON.parse(fs.readFileSync("non-music-videos.json", "utf8"));
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
  const video = videos[0];

  await page.goto(video.url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  await page.waitForTimeout(2000);

  const likeButton = page.locator('button[aria-label*="좋아요 표시"]').nth(1);

  const pressed = await likeButton.getAttribute("aria-pressed");

  if (pressed !== "true") {
    console.log("이미 좋아요 없음");
  } else {
    await likeButton.click();
    console.log(" 좋아요 취소");
  }

  await page.waitForTimeout(1000);
  process.exit(0);
})();
