import { parse } from "node-html-parser";
import fs from "fs";
const html = fs.readFileSync("data/reference/raw/brand/_index.ar.html", "utf8");
const root = parse(html);
const links = root.querySelectorAll("a[href*='brand-']");
console.log("link count", links.length);
const seen = new Set();
for (const a of links.slice(0, 8)) {
  console.log("HREF:", a.getAttribute("href"));
  console.log("HTML:", a.outerHTML.slice(0, 500));
  console.log("---");
}
