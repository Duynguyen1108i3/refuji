import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root of refuji-system if not found locally
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'refuji-api', timestamp: new Date().toISOString() });
});

// GET /api/models - Lấy toàn bộ danh sách thiết bị kèm ProductItems
app.get('/api/models', async (req, res) => {
  try {
    const { category } = req.query;
    const whereClause: any = { is_active: true };

    if (category && typeof category === 'string') {
      whereClause.category = category.toUpperCase();
    }

    const models = await prisma.productModel.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    res.json(models);
  } catch (error) {
    console.error('❌ Error fetching models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/models/:id - Chi tiết mẫu máy kèm danh sách ProductItems
app.get('/api/models/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const model = await prisma.productModel.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!model) {
      return res.status(404).json({ error: 'Product model not found' });
    }

    res.json(model);
  } catch (error) {
    console.error(`❌ Error fetching model ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start API server
const server = app.listen(PORT, () => {
  console.log(`🚀 REFUJI API Server running at http://localhost:${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   - GET http://localhost:${PORT}/api/models`);
  console.log(`   - GET http://localhost:${PORT}/api/models/:id`);
  console.log(`   - GET http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed & Prisma disconnected');
  });
});
