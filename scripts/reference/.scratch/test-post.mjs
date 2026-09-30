import { readFileSync } from "fs";
const html = readFileSync("data/reference/raw/post/1060821541.ar.html", "utf8");

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

const titleMatch = /<h1[^>]*>\s*([^<]*?)\s*<\/h1>/.exec(html);
console.log("title:", titleMatch?.[1]);
const excerptMatch = /<p class="text-2xl font-primary da-tm my-2 leading-10" aria-hidden="true">\s*([^<]*?)\s*<\/p>/.exec(html);
console.log("excerpt:", excerptMatch?.[1]);
const coverMatch = /class="post-entry__image[^"]*"[^>]*>\s*<img[^>]*src="([^"]+)"/.exec(html);
console.log("cover:", coverMatch?.[1]);
const articleMarker = /<article[^>]*>/.exec(html);
console.log("articleMarker index", articleMarker?.index);
const bodyHtml = articleMarker ? extractBalancedTag(html, articleMarker.index + articleMarker[0].length, "article") : null;
console.log("body length", bodyHtml?.length);
console.log("body start", bodyHtml?.slice(0,150));
console.log("body end", bodyHtml?.slice(-150));
