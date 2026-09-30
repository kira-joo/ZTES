import { parse } from "node-html-parser";
import fs from "fs";
const html = fs.readFileSync("data/reference/raw/home/ar.html", "utf8");
const root = parse(html);
const nav = root.querySelector("#mobile-menu") || root.querySelector("ul.main-menu");
console.log("nav found:", !!nav);
if (nav) {
  console.log(nav.outerHTML.slice(0, 3000));
}
