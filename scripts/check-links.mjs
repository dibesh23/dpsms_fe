import { readFile, readdir } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = resolve(projectRoot, "src", "app");
const navigationSources = [
  resolve(projectRoot, "src", "shared", "components", "layout", "Sidebar.tsx"),
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return paths.flat();
}

function toRoute(pagePath) {
  const segments = relative(appRoot, dirname(pagePath))
    .split(sep)
    .filter((segment) => segment && !(segment.startsWith("(") && segment.endsWith(")")));

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function routePattern(route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withCatchAll = escaped
    .replace(/\\\[\\\[\\\.\\\.\\\.[^\]]+\\\]\\\]/g, "(?:/.*)?")
    .replace(/\\\[\\\.\\\.\\\.[^\]]+\\\]/g, ".+")
    .replace(/\\\[[^\]]+\\\]/g, "[^/]+");
  return new RegExp(`^${withCatchAll}$`);
}

function collectInternalLinks(source) {
  const links = new Set();
  const patterns = [
    /\bhref\s*(?:=|:)\s*\{?\s*(["'`])(\/[^"'`]*)\1/g,
    /\b(?:push|replace|redirect)\s*\(\s*(["'`])(\/[^"'`]*)\1/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const path = match[2].split(/[?#]/, 1)[0];
      if (!path.includes("${")) links.add(path.replace(/\/$/, "") || "/");
    }
  }

  return links;
}

const appFiles = await walk(appRoot);
const pageFiles = appFiles.filter((path) => path.endsWith(`${sep}page.tsx`));
const routePatterns = pageFiles.map((path) => routePattern(toRoute(path)));
const sourceFiles = [...pageFiles, ...navigationSources];
const checkedLinks = new Map();

for (const sourceFile of sourceFiles) {
  const source = await readFile(sourceFile, "utf8");
  for (const link of collectInternalLinks(source)) {
    const locations = checkedLinks.get(link) ?? [];
    locations.push(relative(projectRoot, sourceFile).split(sep).join("/"));
    checkedLinks.set(link, locations);
  }
}

const brokenLinks = [...checkedLinks.entries()].filter(
  ([link]) => !routePatterns.some((pattern) => pattern.test(link)),
);

if (brokenLinks.length > 0) {
  console.error("Broken internal links found:");
  for (const [link, locations] of brokenLinks) {
    console.error(`  ${link} (${locations.join(", ")})`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${checkedLinks.size} internal links against ${pageFiles.length} application routes.`,
  );
}
