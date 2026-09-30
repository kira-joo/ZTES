import { readFileSync } from "fs";
const html = readFileSync("data/reference/raw/page/1172106860.ar.html", "utf8");

function extractBalancedTag(html, startIndex, tagName) {
  const openRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, "gi");
  const closeRe = new RegExp(`</${tagName}>`, "gi");
  let depth = 1;
  let cursor = startIndex;
  while (depth > 0) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;
    const openMatch = openRe.exec(html);
    const closeMatch = closeRe.exec(html);
    if (!closeMatch) return null;
    if (openMatch && openMatch.index < closeMatch.index) {
      depth++;
      cursor = openMatch.index + openMatch[0].length;
    } else {
      depth--;
      if (depth === 0) return html.slice(startIndex, closeMatch.index);
      cursor = closeMatch.index + closeMatch[0].length;
    }
  }
  return null;
}

const marker = 'class="content-entry">';
const markerIndex = html.indexOf(marker);
const body = extractBalancedTag(html, markerIndex + marker.length, "div");
console.log("length:", body?.length);
console.log("START:", body?.slice(0,200));
console.log("END:", body?.slice(-200));
