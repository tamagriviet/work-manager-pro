
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

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

  // Helper to read DB
  const getDb = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  // Helper to write DB
  const saveDb = (data: any) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

  // --- API Routes ---

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDb();
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

  app.get('/api/state', (req, res) => {
    res.json(getDb());
  });

  // --- WebSockets ---

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('sync-state', (newState) => {
      // In a real app, we'd validate the user or only sync specific parts
      // But for this request, we'll implement a simple broadcast sync
      const db = getDb();
      
      // Update global state parts (excluding currentUser as that's client-specific)
      const updatedDb = {
        users: newState.users,
        tasks: newState.tasks,
        templates: newState.templates || [],
        settings: newState.settings
      };

      saveDb(updatedDb);
      
      // Broadcast to all other clients
      socket.broadcast.emit('state-updated', updatedDb);
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

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
