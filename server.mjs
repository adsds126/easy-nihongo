import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

createServer(async (req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const requested = normalize(join(root, relative));
  const fallback = join(root, "index.html");

  try {
    const target = requested.startsWith(root) && (await stat(requested)).isFile() ? requested : fallback;
    const data = await readFile(target);
    res.writeHead(200, { "Content-Type": mime[extname(target)] || "application/octet-stream" });
    res.end(data);
  } catch {
    try {
      const data = await readFile(fallback);
      res.writeHead(200, { "Content-Type": mime[".html"] });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Easy Nihongo is running at http://127.0.0.1:${port}`);
});
