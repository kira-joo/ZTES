import { readFileSync } from "fs";
import { parseBrandIndex, parseBrandDetail } from "../parse/brand";

const idx = readFileSync("data/reference/raw/brand/_index.ar.html", "utf8");
const entries = parseBrandIndex(idx);
console.log("brand count:", entries.length);
console.log(entries.slice(0,3));

const detail = readFileSync("data/reference/raw/brand/822152061.ar.html", "utf8");
console.log(parseBrandDetail(detail));
