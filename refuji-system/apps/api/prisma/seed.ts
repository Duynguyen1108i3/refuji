import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();
const catalogPath = path.resolve(__dirname, 'seed-data/fujifilm-catalog.json');

async function seedDatabase() {
  const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const productModels = Array.isArray(catalogData)
    ? catalogData
    : catalogData.productModels || [];

  console.log('Clearing existing product models and items from MySQL...');
  await prisma.productItem.deleteMany({});
  await prisma.productModel.deleteMany({});

  let serialCounter = 1000;
  const usedSerials = new Set<string>();

  console.log(`Inserting ${productModels.length} curated models into MySQL...`);
  for (const model of productModels) {
    const createdModel = await prisma.productModel.create({
      data: {
        model_name: model.model_name,
        category: model.category,
        mount_type: model.mount_type || 'NONE',
        brand: model.brand || 'Fujifilm',
        base_rental_price_per_day: model.base_rental_price_per_day,
        deposit_amount: model.deposit_amount,
        description: model.description || '',
        specs_json: model.specs_json || {},
        image_url: model.image_url || '',
        is_active: true,
      },
    });

    if (Array.isArray(model.items)) {
      for (const item of model.items) {
        let serial = String(item.serial_number);
        if (usedSerials.has(serial)) {
          serialCounter++;
          serial = `${serial}-${serialCounter}`;
        }
        usedSerials.add(serial);

        await prisma.productItem.create({
          data: {
            model_id: createdModel.id,
            serial_number: serial,
            shutter_count: item.shutter_count || 0,
            condition_percent: item.condition_percent || 98,
            status: item.status || 'AVAILABLE',
            purchase_date: item.purchase_date ? new Date(item.purchase_date) : null,
            purchase_price: item.purchase_price || null,
          },
        });
      }
    }
  }

  const countModels = await prisma.productModel.count();
  const countItems = await prisma.productItem.count();
  console.log(`\n✅ MySQL Seeding Complete! Models: ${countModels}, Items: ${countItems}`);
}

seedDatabase()
  .catch((err) => {
    console.error('Database seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
