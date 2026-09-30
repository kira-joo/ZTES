import { readFileSync } from "fs";
import { extractStoreConfigFacts, extractAnnouncement, extractPopupRawHtml } from "../parse/settings";

const html = readFileSync("data/reference/raw/home/ar.html", "utf8");
console.log(extractStoreConfigFacts(html));
console.log("announcement:", extractAnnouncement(html));
const popup = extractPopupRawHtml(html);
console.log("popup html length:", popup?.length);
console.log(popup?.slice(0, 500));
