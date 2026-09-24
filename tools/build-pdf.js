// Builds portfolio.pdf: the home page followed by every writeup it links to,
// printed with the site's print styles (the @media print block in style.css).
// Usage: node tools/build-pdf.js <site-dir> <output.pdf>
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { PDFDocument } = require("pdf-lib");

const SITE = "https://andychiem19.github.io/";
const FOOTER = `<div style="width:100%;padding:0 0.65in;display:flex;justify-content:space-between;
  font:8px Georgia,serif;color:#555b69"><span>Andy Chiem · andychiem19.github.io</span><span class="pageNumber"></span></div>`;

(async () => {
  const [siteDir = ".", out = "portfolio.pdf"] = process.argv.slice(2);
  const root = path.resolve(siteDir);
  const rootUrl = "file://" + root + "/";

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  await page.emulateMedia({ media: "print" });

  // Writeups in the order the home page links to them
  await page.goto(rootUrl + "index.html");
  const writeups = await page.$$eval('a[href^="writeups/"]', (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);

  const merged = await PDFDocument.create();
  merged.setTitle("Andy Chiem — Portfolio");
  merged.setAuthor("Andy Chiem");

  for (const rel of ["index.html", ...writeups]) {
    await page.goto(rootUrl + rel, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    // Point links at the live site instead of local files
    await page.evaluate(([rootUrl, site]) => {
      document.querySelectorAll("a[href]").forEach((a) => {
        if (a.href.startsWith(rootUrl)) a.href = site + a.href.slice(rootUrl.length);
      });
    }, [rootUrl, SITE]);
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: FOOTER,
    });
    const doc = await PDFDocument.load(pdf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    console.log(`${rel}: ${doc.getPageCount()} page(s)`);
  }

  fs.writeFileSync(out, await merged.save());
  console.log(`wrote ${out} (${merged.getPageCount()} pages)`);
  await browser.close();
})();
