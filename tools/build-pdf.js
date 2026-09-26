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
  const page = await browser.newPage();
  await page.emulateMedia({ media: "print" });
  await page.goto(rootUrl + "index.html", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

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
