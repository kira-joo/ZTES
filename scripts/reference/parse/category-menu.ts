import { HTMLElement, parse } from "node-html-parser";
import { extractSallaIdFromUrl, deepUnsliceStrings } from "../lib/html-utils";

export interface MenuCategoryNode {
  sallaId: string;
  name: string;
  href: string;
  iconUrl: string | null;
  level: 1 | 2 | 3;
  sortOrder: number;
  parentSallaId: string | null;
  children: MenuCategoryNode[];
}

/**
 * The reference's `id="123"` on a menu `<li>` is double-encoded in the raw
 * HTML — the attribute value literally contains the characters `&quot;` —
 * so `getAttribute("id")` returns `"123"` (with real quote characters
 * still in the string, e.g. `\"123\"`), not `123`. This strips them.
 */
function cleanMenuId(rawId: string | undefined): string | null {
  if (!rawId) return null;
  const cleaned = rawId.replace(/"/g, "").trim();
  return /^\d+$/.test(cleaned) ? cleaned : null;
}

function directChildLis(ul: HTMLElement): HTMLElement[] {
  return ul.childNodes.filter((node): node is HTMLElement => node instanceof HTMLElement && node.tagName === "LI");
}

/**
 * Walks one `<li>` of the menu into a node, recursing into a nested `<ul>`
 * for its children (up to 3 levels deep on the reference). A non-category
 * entry (the "blog" link, the slider placeholder `<li>`) has no numeric id
 * and is skipped by the caller.
 */
function parseMenuLi(li: HTMLElement, level: 1 | 2 | 3, parentSallaId: string | null, sortOrder: number): MenuCategoryNode | null {
  const sallaId = cleanMenuId(li.getAttribute("id"));
  if (!sallaId) return null;

  const anchor = li.querySelector("a");
  const href = anchor?.getAttribute("href") ?? "";
  const name = (anchor?.getAttribute("aria-label") ?? anchor?.text ?? "").trim();
  const iconDiv = li.querySelector("[data-bg]");
  const iconUrl = iconDiv?.getAttribute("data-bg") || null;

  const nestedUl = li.querySelector("ul");
  const children: MenuCategoryNode[] =
    level < 3 && nestedUl
      ? directChildLis(nestedUl)
          .map((childLi, index) => parseMenuLi(childLi, (level + 1) as 1 | 2 | 3, sallaId, index))
          .filter((node): node is MenuCategoryNode => node !== null)
      : [];

  return { sallaId, name, href, iconUrl: iconUrl && iconUrl.length > 0 ? iconUrl : null, level, sortOrder, parentSallaId, children };
}

/**
 * Parses the full category tree from a home page's `#mobile-menu ul.main-menu`.
 * Non-category entries (the menu slider placeholder, the "blog" link) have no
 * numeric `id` and are dropped. Returns the top-level nodes; each carries its
 * `children` recursively.
 */
function _parseCategoryMenu(html: string): MenuCategoryNode[] {
  const root = parse(html);
  const nav = root.querySelector("#mobile-menu");
  const mainMenu = nav?.querySelector("ul.main-menu");
  if (!mainMenu) return [];

  return directChildLis(mainMenu)
    .map((li, index) => parseMenuLi(li, 1, null, index))
    .filter((node): node is MenuCategoryNode => node !== null);
}

/** Flattens a parsed tree (depth-first) — convenient for building the id → node map. */
export function flattenMenuTree(nodes: MenuCategoryNode[]): MenuCategoryNode[] {
  const flat: MenuCategoryNode[] = [];
  for (const node of nodes) {
    flat.push(node);
    flat.push(...flattenMenuTree(node.children));
  }
  return flat;
}

export function sallaIdFromCategoryHref(href: string): string | null {
  const parsed = extractSallaIdFromUrl(href);
  return parsed?.kind === "category" ? parsed.id : null;
}

export function parseCategoryMenu(html: string): MenuCategoryNode[] {
  return deepUnsliceStrings(_parseCategoryMenu(html));
}
