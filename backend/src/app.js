import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import clientRoutes from './routes/client.routes.js';
import reportRoutes from './routes/report.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de __dirname para módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(cookieParser());

// Configuración de archivos estáticos
const staticPath = path.join(__dirname, 'public');
app.use('/static', express.static(staticPath)); 

app.use("/api", authRoutes);
app.use(clientRoutes);
app.use('/api/reports', reportRoutes);

export default app;
