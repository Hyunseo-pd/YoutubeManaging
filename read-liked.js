const { chromium } = require("playwright");
const CHANNEL_NAME = process.argv[2];
(async () => {
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
  if (CHANNEL_NAME) {
    await page.locator("#avatar-btn").click();

    await page.getByText("계정 전환", { exact: true }).click();

    await page.getByText(CHANNEL_NAME, { exact: true }).click();

    await page.waitForTimeout(3000);
  }

  console.log("페이지 이동 중...");
  await page.goto("https://www.youtube.com/playlist?list=LL");

  console.log("영상 제목 기다리는 중...");
  await page.waitForTimeout(1000);

  const titleLocator = page
    .locator(" yt-lockup-view-model h3 > a > span")
    .first();

  const firstUrl = await page
    .locator("yt-lockup-view-model h3 a")
    .first()
    .getAttribute("href");

  console.log(`https://www.youtube.com${firstUrl}`);

  let previousHeight = 0;

  while (true) {
    const currentHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );

    if (currentHeight === previousHeight) break;

    previousHeight = currentHeight;

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );

    await page.waitForTimeout(2000);
  }

  const likedVideos = await page
    .locator("yt-lockup-view-model")
    .evaluateAll((items) =>
      items.map((item) => {
        const link = item.querySelector("h3 a");
        const title = link?.textContent?.trim() ?? "";
        const url = link?.href ?? "";
        const channel =
          item
            .querySelector("yt-content-metadata-view-model a")
            ?.textContent?.trim() ?? "";

        return {
          title,
          channel,
          url,
        };
      }),
    );

  const fs = require("fs");

  fs.writeFileSync(
    `liked-videos_${CHANNEL_NAME}.json`,
    JSON.stringify(likedVideos, null, 2),
    "utf8",
  );

  console.log(`${likedVideos.length}개 저장 완료`);
  process.exit(0);
})();
