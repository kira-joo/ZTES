import { readFileSync } from "fs";
import { parseCategoryMenu, flattenMenuTree } from "../parse/category-menu";

const html = readFileSync("data/reference/raw/home/ar.html", "utf8");
const tree = parseCategoryMenu(html);
console.log("top-level count:", tree.length);
const flat = flattenMenuTree(tree);
console.log("total flat count:", flat.length);
console.log(JSON.stringify(tree.slice(0,2), null, 2).slice(0, 2000));
const withChildren = tree.find(n => n.children.length > 0);
console.log("example with children:", withChildren?.name, withChildren?.children.length);
const level3 = flat.find(n => n.level === 3);
console.log("has level3:", !!level3, level3?.name);
const ids = flat.map(n => n.sallaId);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log("dupe count:", dupes.length, [...new Set(dupes)].slice(0,5));
console.log("unique ids:", new Set(ids).size);
