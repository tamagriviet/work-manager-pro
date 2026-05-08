import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { MongoClient, Collection } from 'mongodb';

const DB_FILE = process.env.DB_FILE_PATH || path.join(process.cwd(), 'db.json');
const DEFAULT_AUTH = {
  id: 'root-admin',
  email: 'tam.agriviet@gmail.com',
  password: '123456789',
  fullName: 'Tam Agriviet',
  jobTitle: 'Hệ thống Quản trị',
  role: 'ADMIN',
  mustChangePassword: false,
  companies: ["Agriviet"]
};

// Initial state if db.json doesn't exist
const initialData = {
  users: [DEFAULT_AUTH],
  tasks: [],
  templates: [],
  settings: { language: 'vi', theme: 'light' }
};

let dbCache: any = null;
let mongoCollection: Collection | null = null;

async function initDb() {
  if (process.env.MONGODB_URI) {
    console.log('Connecting to MongoDB...');
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db('workmanager');
      mongoCollection = db.collection('state');
      
      const remoteState = await mongoCollection.findOne({ _id: 'global-state' });
      if (remoteState && remoteState.data) {
        dbCache = remoteState.data;
        console.log('Loaded state from MongoDB');
      } else {
        await mongoCollection.updateOne({ _id: 'global-state' }, { $set: { data: initialData } }, { upsert: true });
        dbCache = initialData;
        console.log('Initialized MongoDB with default data');
      }
    } catch (e) {
      console.error('Failed to connect to MongoDB', e);
      throw e;
    }
  } else {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    dbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    console.log('Loaded state from local db.json');
  }
}

const getDb = async () => {
  if (!dbCache) await initDb();
  return dbCache;
};

const saveDb = async (data: any) => {
  dbCache = data;
  if (mongoCollection) {
    await mongoCollection.updateOne({ _id: 'global-state' }, { $set: { data } }, { upsert: true });
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

  // --- API Routes ---

  app.get('/api/settings', async (req, res) => {
    const db = await getDb();
    res.json(db.settings || { language: 'vi', theme: 'light' });
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const db = await getDb();
    const user = db.users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      // Return state with current user
      res.json({ 
        success: true, 
        state: { ...db, currentUser: user } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' });
    }
  });

  app.get('/api/state', async (req, res) => {
    res.json(await getDb());
  });


  // --- API Sync (Robust HTTP Dispatch) ---
  app.post('/api/dispatch', async (req, res) => {
    const action = req.body;
    if (!action || !action.type) {
      return res.status(400).json({ success: false });
    }
    
    const db = await getDb();
    switch (action.type) {
      case 'ADD_TASK':
        if (!db.tasks.find((t: any) => t.id === action.payload.id)) {
          db.tasks.unshift(action.payload);
        }
        break;
      case 'UPDATE_TASK_STATUS':
        db.tasks = db.tasks.map((t: any) => t.id === action.payload.id ? { ...t, status: action.payload.status, updatedAt: action.payload.updatedAt } : t);
        break;
      case 'UPDATE_TASK_CONTENT':
        db.tasks = db.tasks.map((t: any) => t.id === action.payload.id ? { ...t, content: action.payload.content, updatedAt: action.payload.updatedAt } : t);
        break;
      case 'DELETE_TASK':
        db.tasks = db.tasks.map((t: any) => t.id === action.payload.id ? { ...t, deletedAt: action.payload.deletedAt } : t);
        break;
      case 'UPDATE_USER_COMPANIES':
        db.users = db.users.map((u: any) => u.id === action.payload.id ? { ...u, companies: action.payload.companies } : u);
        break;
      case 'UPDATE_USER_PASSWORD':
        db.users = db.users.map((u: any) => u.id === action.payload.id ? { ...u, password: action.payload.password } : u);
        break;
      case 'ADD_DEPARTMENT':
        if (!(db.departments || []).find((d: any) => d.id === action.payload.id)) {
          db.departments = [...(db.departments || []), action.payload];
        }
        break;
      case 'UPDATE_DEPARTMENT':
        db.departments = (db.departments || []).map((d: any) => d.id === action.payload.id ? { ...d, name: action.payload.name } : d);
        break;
      case 'DELETE_DEPARTMENT':
        db.departments = (db.departments || []).filter((d: any) => d.id !== action.payload.id);
        db.users = db.users.map((u: any) => u.departmentId === action.payload.id ? { ...u, departmentId: undefined } : u);
        break;
      case 'ADD_USER':
        if (!db.users.find((u: any) => u.id === action.payload.id)) {
          db.users.push(action.payload);
        }
        break;
      case 'UPDATE_USER':
        db.users = db.users.map((u: any) => u.id === action.payload.id ? action.payload : u);
        break;
      case 'DELETE_USER':
        db.users = db.users.filter((u: any) => u.id !== action.payload.id);
        break;
      case 'SETUP_USER':
        db.users = db.users.map((u: any) => u.id === action.payload.id ? { ...u, fullName: action.payload.fullName, jobTitle: action.payload.jobTitle, companies: action.payload.companies } : u);
        break;
      case 'UPDATE_SETTINGS':
        db.settings = action.payload;
        break;
      case 'ADD_TEMPLATE':
        if (!(db.templates || []).find((t: any) => t.id === action.payload.id)) {
          db.templates = [...(db.templates || []), action.payload];
        }
        break;
      case 'DELETE_TEMPLATE':
        db.templates = (db.templates || []).filter((t: any) => t.id !== action.payload.id);
        break;
    }
    await saveDb(db);
    io.emit('state-updated', db);
    res.json({ success: true, db });
  });

  // --- WebSockets ---

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('dispatch', async (action) => {
      const db = await getDb();
      switch (action.type) {
        case 'ADD_TASK':
          if (!db.tasks.find((t: any) => t.id === action.payload.id)) {
            db.tasks.unshift(action.payload);
          }
          break;
        case 'UPDATE_TASK_STATUS':
          db.tasks = db.tasks.map((t: any) => t.id === action.payload.id ? { ...t, status: action.payload.status, updatedAt: action.payload.updatedAt } : t);
          break;
        case 'UPDATE_TASK_CONTENT':
          db.tasks = db.tasks.map((t: any) => t.id === action.payload.id ? { ...t, content: action.payload.content, updatedAt: action.payload.updatedAt } : t);
          break;
        case 'DELETE_TASK':
          db.tasks = db.tasks.map((t: any) => t.id === action.payload.id ? { ...t, deletedAt: action.payload.deletedAt } : t);
          break;
        case 'UPDATE_USER_COMPANIES':
          db.users = db.users.map((u: any) => u.id === action.payload.id ? { ...u, companies: action.payload.companies } : u);
          break;
        case 'UPDATE_USER_PASSWORD':
          db.users = db.users.map((u: any) => u.id === action.payload.id ? { ...u, password: action.payload.password } : u);
          break;
        case 'ADD_DEPARTMENT':
          if (!(db.departments || []).find((d: any) => d.id === action.payload.id)) {
            db.departments = [...(db.departments || []), action.payload];
          }
          break;
        case 'UPDATE_DEPARTMENT':
          db.departments = (db.departments || []).map((d: any) => d.id === action.payload.id ? { ...d, name: action.payload.name } : d);
          break;
        case 'DELETE_DEPARTMENT':
          db.departments = (db.departments || []).filter((d: any) => d.id !== action.payload.id);
          db.users = db.users.map((u: any) => u.departmentId === action.payload.id ? { ...u, departmentId: undefined } : u);
          break;
        case 'ADD_USER':
          if (!db.users.find((u: any) => u.id === action.payload.id)) {
            db.users.push(action.payload);
          }
          break;
        case 'UPDATE_USER':
          db.users = db.users.map((u: any) => u.id === action.payload.id ? action.payload : u);
          break;
        case 'DELETE_USER':
          db.users = db.users.filter((u: any) => u.id !== action.payload.id);
          break;
        case 'SETUP_USER':
          db.users = db.users.map((u: any) => u.id === action.payload.id ? { ...u, fullName: action.payload.fullName, jobTitle: action.payload.jobTitle, companies: action.payload.companies } : u);
          break;
        case 'UPDATE_SETTINGS':
          db.settings = action.payload;
          break;
        case 'ADD_TEMPLATE':
          if (!(db.templates || []).find((t: any) => t.id === action.payload.id)) {
            db.templates = [...(db.templates || []), action.payload];
          }
          break;
        case 'DELETE_TEMPLATE':
          db.templates = (db.templates || []).filter((t: any) => t.id !== action.payload.id);
          break;
      }
      await saveDb(db);
      io.emit('state-updated', db);
    });

    socket.on('user-login', (userId) => {
      // Broadcast force-logout to all OTHER clients
      socket.broadcast.emit('force-logout', userId);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const appRoot = process.env.APP_ROOT || process.cwd();
    const distPath = path.join(appRoot, 'dist');
    app.use(express.static(distPath));
    app.get(/(.*)/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 45001;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
