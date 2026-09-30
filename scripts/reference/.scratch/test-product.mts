import { readFileSync } from "fs";
import { parseProductPage } from "../parse/product";

const ar = readFileSync("data/reference/raw/product/266433170.ar.html", "utf8");
const en = readFileSync("data/reference/raw/product/266433170.en.html", "utf8");
const parsedAr = parseProductPage(ar);
const parsedEn = parseProductPage(en);
console.log("AR:", JSON.stringify({...parsedAr, options: parsedAr.options.map(o=>({...o, details: o.details.length}))}, null, 2));
console.log("EN categoryNames:", parsedEn.categoryNames);
console.log("EN weight:", parsedEn.weightText, "EN model:", parsedEn.modelNumber);
console.log("images:", parsedAr.images.length, parsedAr.images[0]);
