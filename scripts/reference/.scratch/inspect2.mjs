import { parse } from "node-html-parser";
import fs from "fs";
const html = fs.readFileSync("data/reference/raw/brand/_index.ar.html", "utf8");
const root = parse(html);
const links = root.querySelectorAll("a").filter(a => /\/brand-\d+/.test(a.getAttribute("href") || ""));
console.log("real brand link count", links.length);
const seen = new Set();
for (const a of links.slice(0, 5)) {
  console.log("HREF:", a.getAttribute("href"));
  console.log("HTML:", a.outerHTML.slice(0, 800));
  console.log("---");
}
const ids = new Set(links.map(a => (a.getAttribute("href")||"").match(/brand-(\d+)/)?.[1]));
console.log("unique brand ids:", ids.size);
