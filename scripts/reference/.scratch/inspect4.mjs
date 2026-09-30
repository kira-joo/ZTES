import { parse } from "node-html-parser";
import fs from "fs";
const html = fs.readFileSync("data/reference/raw/home/ar.html", "utf8");
const root = parse(html);
const nav = root.querySelector("#mobile-menu");
const topLis = nav.querySelector("ul.main-menu").childNodes.filter(n => n.tagName === "LI");
console.log("top li count", topLis.length);
// find one with nested submenu
for (const li of topLis) {
  const nestedUl = li.querySelector("ul");
  if (nestedUl) {
    console.log("FOUND nested li id attr raw:", JSON.stringify(li.getAttribute("id")));
    console.log(li.outerHTML.slice(0, 2500));
    break;
  }
}
