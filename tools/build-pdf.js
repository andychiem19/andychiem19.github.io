// Builds portfolio.pdf: a concise print of the home page (headlines, diagrams and links to the
// live writeups), using the @media print block in style.css.
// Usage: node tools/build-pdf.js <site-dir> <output.pdf>
const path = require("path");
const { chromium } = require("playwright");

const SITE = "https://andychiem19.github.io/";
const FOOTER = `<div style="width:100%;padding:0 0.65in;display:flex;justify-content:space-between;
  font:8px Georgia,serif;color:#555b69"><span>Andy Chiem · andychiem19.github.io</span><span class="pageNumber"></span></div>`;

(async () => {
  const [siteDir = ".", out = "portfolio.pdf"] = process.argv.slice(2);
  const rootUrl = "file://" + path.resolve(siteDir) + "/";

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  // Viewport = printed content width (Letter minus 0.65in margins) so screenshots match the page layout;
  // 3x scale gives ~288 dpi images
  const page = await browser.newPage({ viewport: { width: 691, height: 1000 }, deviceScaleFactor: 3 });
  await page.emulateMedia({ media: "print" });
  await page.goto(rootUrl + "index.html", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  // Diagrams and skill chips are many small vector shapes and gradient fills that make PDF viewers
  // lag, so print them as high-resolution images. Text (headlines, hover details, links) stays text.
  await page.evaluate(() => document.querySelectorAll(".diagram-details").forEach((d) => (d.style.display = "none")));
  const shots = { boxes: [], chips: [] };
  for (const box of await page.$$(".visual.diagram-box")) {
    shots.boxes.push((await box.screenshot({ type: "png", animations: "disabled" })).toString("base64"));
  }
  for (const list of await page.$$("ul.chips")) {
    // Crop to the chips themselves (including their pins), not the full-width list
    const clip = await list.evaluate((ul) => {
      const r = [...ul.children].map((li) => li.getBoundingClientRect());
      const x = Math.min(...r.map((b) => b.left)), y = Math.min(...r.map((b) => b.top)) - 5;
      return { x, y: y + scrollY, width: Math.max(...r.map((b) => b.right)) - x, height: Math.max(...r.map((b) => b.bottom)) + 5 - y };
    });
    shots.chips.push({ clip, png: (await page.screenshot({ type: "png", clip, fullPage: true, animations: "disabled" })).toString("base64") });
  }
  await page.evaluate(({ boxes, chips }) => {
    const img = (png, w, h, alt) => Object.assign(document.createElement("img"), {
      src: "data:image/png;base64," + png,
      alt,
      style: `display:block;width:${w}px;height:${h}px`,
    });
    document.querySelectorAll(".visual.diagram-box").forEach((box, i) => {
      const r = box.getBoundingClientRect();
      const details = box.querySelector(".diagram-details");
      const fig = document.createElement("div");
      fig.style.cssText = "break-inside:avoid";
      fig.append(img(boxes[i], r.width, r.height, box.querySelector("[aria-label]")?.getAttribute("aria-label") || "Block diagram"));
      if (details) { details.style.display = ""; details.style.marginTop = "0.75rem"; fig.append(details); }
      box.replaceWith(fig);
    });
    document.querySelectorAll("ul.chips").forEach((ul, i) => {
      const { width, height } = chips[i].clip;
      const cs = getComputedStyle(ul);
      const pic = img(chips[i].png, width, height, "Skills: " + [...ul.children].map((li) => li.textContent).join(", "));
      pic.style.margin = `${cs.marginTop} 0 ${cs.marginBottom}`;
      ul.replaceWith(pic);
    });
  }, shots);

  // Point links at the live site instead of local files
  await page.evaluate(([rootUrl, site]) => {
    document.querySelectorAll("a[href]").forEach((a) => {
      if (a.href.startsWith(rootUrl)) a.href = site + a.href.slice(rootUrl.length);
    });
  }, [rootUrl, SITE]);

  await page.pdf({
    path: out,
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: FOOTER,
  });
  console.log(`wrote ${out}`);
  await browser.close();
})();
