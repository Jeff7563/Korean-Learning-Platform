import { createServer } from "node:http";
const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") { res.writeHead(200).end("mock ready"); return; }
  if (req.method !== "POST" || req.url !== "/api/chat") { res.writeHead(404).end(); return; }
  req.resume();
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: { content: "คำตอบทดสอบจาก Ollama-compatible mock: 한글 ประกอบจากพยัญชนะและสระที่จัดเป็นบล็อกพยางค์" } }));
});
server.listen(11435, "127.0.0.1");
