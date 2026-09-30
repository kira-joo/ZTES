import { parse } from "node-html-parser";
import fs from "fs";
const html = fs.readFileSync("data/reference/raw/home/ar.html", "utf8");
const root = parse(html);
const nav = root.querySelector("#mobile-menu");
const topLis = nav.querySelector("ul.main-menu").childNodes.filter(n => n.tagName === "LI");
for (const li of topLis) {
  const nestedUl = li.querySelector("ul");
  if (nestedUl) {
    const cls = nestedUl.getAttribute("class");
    console.log("nested ul class:", cls);
    const childLis = nestedUl.childNodes.filter(n => n.tagName === "LI");
    console.log("child li count:", childLis.length);
    for (const cli of childLis.slice(0,3)) {
      console.log("child id:", JSON.stringify(cli.getAttribute("id")));
      const grandUl = cli.querySelector("ul");
      console.log("has grandchild ul:", !!grandUl);
      if (grandUl) {
        console.log(cli.outerHTML.slice(0, 1500));
      }
    }
    break;
  }
}
