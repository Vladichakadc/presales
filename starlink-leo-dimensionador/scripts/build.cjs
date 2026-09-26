const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8").replace(/<\/script>/gi, "<\\/script>");

const bundled = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="app.js"></script>', `<script>\n${js}\n</script>`);

fs.mkdirSync(dist, { recursive: true });
const output = path.join(dist, "dimensionador-starlink-leo-presales.html");
fs.writeFileSync(output, bundled, "utf8");
console.log(output);
