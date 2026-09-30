import { readFileSync } from "fs";
import { parseProductPage } from "../parse/product";

const ar = readFileSync("data/reference/raw/product/266433170.ar.html", "utf8");
const en = readFileSync("data/reference/raw/product/266433170.en.html", "utf8");
const parsedAr = parseProductPage(ar);
const parsedEn = parseProductPage(en);
console.log("AR desc length:", parsedAr.descriptionHtml.length);
console.log("AR desc end:", parsedAr.descriptionHtml.slice(-200));
console.log("EN desc length:", parsedEn.descriptionHtml.length);
console.log("EN desc start:", parsedEn.descriptionHtml.slice(0,200));
