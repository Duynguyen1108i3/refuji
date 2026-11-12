import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, db } from './db.js';
import { authRouter, meRouter } from './modules/auth/auth.routes.js';
import { ordersRouter, adminOrdersRouter } from './modules/orders/orders.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { adminRouter } from './modules/admin/index.js';
import { startBackgroundCronScheduler } from './modules/admin/cron.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));

// Khởi tạo Database SQLite ReFuji v1.1
initDatabase();
startBackgroundCronScheduler();

// 1. Health check
app.get(['/api/health', '/api/v1/health'], (_req, res) => {
  res.json({ status: 'ok', service: 'refuji-api', timestamp: new Date().toISOString() });
});

// 2. Định tuyến các phân hệ (Hỗ trợ cả /api và /api/v1)
app.use(['/api/auth', '/api/v1/auth'], authRouter);
app.use(['/api/users', '/api/v1/users'], meRouter);
app.use(['/api/orders', '/api/v1/orders'], ordersRouter);
app.use(['/api/admin/orders', '/api/v1/admin/orders'], adminOrdersRouter);
app.use(['/api/admin', '/api/v1/admin'], adminRouter);
app.use(['/api/models', '/api/v1/models'], catalogRouter);
app.use(['/api/cart', '/api/v1/cart'], cartRouter);

// Start API server
const server = app.listen(PORT, () => {
  console.log(`🚀 REFUJI API Server running at http://localhost:${PORT}`);
  console.log(`📡 Endpoints ready:`);
  console.log(`   - Auth:   http://localhost:${PORT}/api/auth`);
  console.log(`   - Users:  http://localhost:${PORT}/api/users/me`);
  console.log(`   - Orders: http://localhost:${PORT}/api/orders`);
  console.log(`   - Models: http://localhost:${PORT}/api/models`);
  console.log(`   - Cart:   http://localhost:${PORT}/api/cart`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    db.close();
    console.log('HTTP server closed');
  });
});
