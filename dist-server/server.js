// server.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import cors from "cors";
import { MongoClient } from "mongodb";
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
var dbCache = null;
var mongoCollection = null;
async function initDb() {
  if (process.env.MONGODB_URI) {
    console.log("Connecting to MongoDB...");
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db("workmanager");
      mongoCollection = db.collection("state");
      const remoteState = await mongoCollection.findOne({ _id: "global-state" });
      if (remoteState && remoteState.data) {
        dbCache = remoteState.data;
        console.log("Loaded state from MongoDB");
      } else {
        await mongoCollection.updateOne({ _id: "global-state" }, { $set: { data: initialData } }, { upsert: true });
        dbCache = initialData;
        console.log("Initialized MongoDB with default data");
      }
    } catch (e) {
      console.error("Failed to connect to MongoDB", e);
      throw e;
    }
  } else {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    dbCache = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    console.log("Loaded state from local db.json");
  }
}
var getDb = async () => {
  if (!dbCache) await initDb();
  return dbCache;
};
var saveDb = async (data) => {
  dbCache = data;
  if (mongoCollection) {
    await mongoCollection.updateOne({ _id: "global-state" }, { $set: { data } }, { upsert: true });
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  }
};
async function startServer() {
  await initDb();
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
  app.get("/api/settings", async (req, res) => {
    const db = await getDb();
    res.json(db.settings || { language: "vi", theme: "light" });
  });
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const db = await getDb();
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
  app.get("/api/state", async (req, res) => {
    res.json(await getDb());
  });
  app.post("/api/dispatch", async (req, res) => {
    const action = req.body;
    if (!action || !action.type) {
      return res.status(400).json({ success: false });
    }
    const db = await getDb();
    switch (action.type) {
      case "ADD_TASK":
        if (!db.tasks.find((t) => t.id === action.payload.id)) {
          db.tasks.unshift(action.payload);
        }
        break;
      case "UPDATE_TASK_STATUS":
        db.tasks = db.tasks.map((t) => t.id === action.payload.id ? { ...t, status: action.payload.status, updatedAt: action.payload.updatedAt } : t);
        break;
      case "UPDATE_TASK_CONTENT":
        db.tasks = db.tasks.map((t) => t.id === action.payload.id ? { ...t, content: action.payload.content, updatedAt: action.payload.updatedAt } : t);
        break;
      case "UPDATE_TASK_DEADLINE":
        db.tasks = db.tasks.map((t) => t.id === action.payload.id ? { ...t, deadline: action.payload.deadline, updatedAt: action.payload.updatedAt } : t);
        break;
      case "DELETE_TASK":
        db.tasks = db.tasks.map((t) => t.id === action.payload.id ? { ...t, deletedAt: action.payload.deletedAt } : t);
        break;
      case "UPDATE_USER_COMPANIES":
        db.users = db.users.map((u) => u.id === action.payload.id ? { ...u, companies: action.payload.companies } : u);
        break;
      case "UPDATE_USER_PASSWORD":
        db.users = db.users.map((u) => u.id === action.payload.id ? { ...u, password: action.payload.password } : u);
        break;
      case "ADD_DEPARTMENT":
        if (!(db.departments || []).find((d) => d.id === action.payload.id)) {
          db.departments = [...db.departments || [], action.payload];
        }
        break;
      case "UPDATE_DEPARTMENT":
        db.departments = (db.departments || []).map((d) => d.id === action.payload.id ? { ...d, name: action.payload.name } : d);
        break;
      case "DELETE_DEPARTMENT":
        db.departments = (db.departments || []).filter((d) => d.id !== action.payload.id);
        db.users = db.users.map((u) => u.departmentId === action.payload.id ? { ...u, departmentId: void 0 } : u);
        break;
      case "ADD_USER":
        if (!db.users.find((u) => u.id === action.payload.id)) {
          db.users.push(action.payload);
        }
        break;
      case "UPDATE_USER":
        db.users = db.users.map((u) => u.id === action.payload.id ? action.payload : u);
        break;
      case "DELETE_USER":
        db.users = db.users.filter((u) => u.id !== action.payload.id);
        break;
      case "SETUP_USER":
        db.users = db.users.map((u) => u.id === action.payload.id ? { ...u, fullName: action.payload.fullName, jobTitle: action.payload.jobTitle, companies: action.payload.companies } : u);
        break;
      case "UPDATE_SETTINGS":
        db.settings = action.payload;
        break;
      case "ADD_TEMPLATE":
        if (!(db.templates || []).find((t) => t.id === action.payload.id)) {
          db.templates = [...db.templates || [], action.payload];
        }
        break;
      case "DELETE_TEMPLATE":
        db.templates = (db.templates || []).filter((t) => t.id !== action.payload.id);
        break;
    }
    await saveDb(db);
    io.emit("state-updated", db);
    res.json({ success: true, db });
  });
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("dispatch", async (action) => {
      const db = await getDb();
      switch (action.type) {
        case "ADD_TASK":
          if (!db.tasks.find((t) => t.id === action.payload.id)) {
            db.tasks.unshift(action.payload);
          }
          break;
        case "UPDATE_TASK_STATUS":
          db.tasks = db.tasks.map((t) => t.id === action.payload.id ? { ...t, status: action.payload.status, updatedAt: action.payload.updatedAt } : t);
          break;
        case "UPDATE_TASK_CONTENT":
          db.tasks = db.tasks.map((t) => t.id === action.payload.id ? { ...t, content: action.payload.content, updatedAt: action.payload.updatedAt } : t);
          break;
        case "UPDATE_TASK_DEADLINE":
          db.tasks = db.tasks.map((t) => t.id === action.payload.id ? { ...t, deadline: action.payload.deadline, updatedAt: action.payload.updatedAt } : t);
          break;
        case "DELETE_TASK":
          db.tasks = db.tasks.map((t) => t.id === action.payload.id ? { ...t, deletedAt: action.payload.deletedAt } : t);
          break;
        case "UPDATE_USER_COMPANIES":
          db.users = db.users.map((u) => u.id === action.payload.id ? { ...u, companies: action.payload.companies } : u);
          break;
        case "UPDATE_USER_PASSWORD":
          db.users = db.users.map((u) => u.id === action.payload.id ? { ...u, password: action.payload.password } : u);
          break;
        case "ADD_DEPARTMENT":
          if (!(db.departments || []).find((d) => d.id === action.payload.id)) {
            db.departments = [...db.departments || [], action.payload];
          }
          break;
        case "UPDATE_DEPARTMENT":
          db.departments = (db.departments || []).map((d) => d.id === action.payload.id ? { ...d, name: action.payload.name } : d);
          break;
        case "DELETE_DEPARTMENT":
          db.departments = (db.departments || []).filter((d) => d.id !== action.payload.id);
          db.users = db.users.map((u) => u.departmentId === action.payload.id ? { ...u, departmentId: void 0 } : u);
          break;
        case "ADD_USER":
          if (!db.users.find((u) => u.id === action.payload.id)) {
            db.users.push(action.payload);
          }
          break;
        case "UPDATE_USER":
          db.users = db.users.map((u) => u.id === action.payload.id ? action.payload : u);
          break;
        case "DELETE_USER":
          db.users = db.users.filter((u) => u.id !== action.payload.id);
          break;
        case "SETUP_USER":
          db.users = db.users.map((u) => u.id === action.payload.id ? { ...u, fullName: action.payload.fullName, jobTitle: action.payload.jobTitle, companies: action.payload.companies } : u);
          break;
        case "UPDATE_SETTINGS":
          db.settings = action.payload;
          break;
        case "ADD_TEMPLATE":
          if (!(db.templates || []).find((t) => t.id === action.payload.id)) {
            db.templates = [...db.templates || [], action.payload];
          }
          break;
        case "DELETE_TEMPLATE":
          db.templates = (db.templates || []).filter((t) => t.id !== action.payload.id);
          break;
      }
      await saveDb(db);
      io.emit("state-updated", db);
    });
    socket.on("user-login", (userId) => {
      socket.broadcast.emit("force-logout", userId);
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
  const PORT = process.env.PORT || 45001;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
