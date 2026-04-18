// server.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import cors from "cors";
var DB_FILE = process.env.DB_FILE_PATH || path.join(process.cwd(), "db.json");
var DEFAULT_AUTH = {
  id: "root-admin",
  email: "tam.agriviet@gmail.com",
  password: "123456789",
  fullName: "Tam Agriviet",
  jobTitle: "H\u1EC7 th\u1ED1ng Qu\u1EA3n tr\u1ECB",
  role: "ADMIN",
  mustChangePassword: false,
  companies: ["Agriviet"]
};
var initialData = {
  users: [DEFAULT_AUTH],
  tasks: [],
  templates: [],
  settings: { language: "vi", theme: "light" }
};
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  app.use(cors());
  app.use(express.json());
  const getDb = () => JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  const saveDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const db = getDb();
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (user) {
      res.json({
        success: true,
        state: { ...db, currentUser: user }
      });
    } else {
      res.status(401).json({ success: false, message: "Th\xF4ng tin \u0111\u0103ng nh\u1EADp kh\xF4ng ch\xEDnh x\xE1c" });
    }
  });
  app.get("/api/state", (req, res) => {
    res.json(getDb());
  });
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("sync-state", (newState) => {
      const db = getDb();
      const updatedDb = {
        users: newState.users,
        tasks: newState.tasks,
        templates: newState.templates || [],
        settings: newState.settings
      };
      saveDb(updatedDb);
      socket.broadcast.emit("state-updated", updatedDb);
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const appRoot = process.env.APP_ROOT || process.cwd();
    const distPath = path.join(appRoot, "dist");
    app.use(express.static(distPath));
    app.get(/(.*)/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  const PORT = 3e3;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
