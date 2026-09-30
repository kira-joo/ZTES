import { readFileSync } from "fs";
const html = readFileSync("data/reference/raw/page/1172106860.ar.html", "utf8");
const marker = 'class="content-entry">';
const start = html.indexOf(marker) + marker.length;
// find next "content-single-page" closing wrapper end, search for the following <salla-hook or footer-ish marker
const nextHook = html.indexOf('<salla-hook', start);
console.log("nextHook at", nextHook, "distance", nextHook-start);
console.log(html.slice(nextHook-400, nextHook+50));
