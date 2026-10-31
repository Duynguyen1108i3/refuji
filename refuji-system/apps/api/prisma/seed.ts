import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '/Users/tx/Documents/refuji/refuji-system/.env' });

const prisma = new PrismaClient();

// Load crawled accessories
const rawAccessories = JSON.parse(fs.readFileSync('/tmp/all_crawled_accessories_detailed.json', 'utf-8'));

// Load existing catalog for reference
const oldCatalogPath = '/Users/tx/Documents/refuji/refuji-system/apps/api/prisma/seed-data/fujifilm-catalog.json';
const oldCatalog = JSON.parse(fs.readFileSync(oldCatalogPath, 'utf-8'));

// 1. Prepare Camera Models
const cameraSpecsMap = {
  'gfx100-ii': {
    name: 'FUJIFILM GFX100 II',
    mount_type: 'G_MOUNT',
    base_price: 950000,
    deposit: 14000000,
    image_url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2023/09/wfqs_gfx100-ii_thum.jpg',
    specs: {
      sensor: '102MP High-Speed Large Format CMOS II HS',
      megapixels: 102.0,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 8.0 stops',
      video: '8K/30p, 4K/60p 4:2:2 10-bit nội bộ, Apple ProRes',
      burst_rate: '8.0fps cơ học',
      battery: 'NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/gfx100-ii/'
    },
    description: 'Chiếc máy ảnh Medium Format đỉnh cao tích hợp cảm biến thế hệ mới 102MP CMOS II HS, tốc độ đọc dữ liệu tăng gấp đôi, quay video chuẩn điện ảnh 8K/30p Apple ProRes và chống rung 8.0 stops.'
  },
  'gfx100s-ii': {
    name: 'FUJIFILM GFX100S II',
    mount_type: 'G_MOUNT',
    base_price: 850000,
    deposit: 12000000,
    image_url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2024/05/gfx_100s_ii_small.jpg',
    specs: {
      sensor: '102MP Large Format CMOS II',
      megapixels: 102.0,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 8.0 stops',
      video: '4K/30p 4:2:2 10-bit',
      burst_rate: '7.0fps',
      battery: 'NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/gfx100s-ii/'
    },
    description: 'Thân máy Large Format 102MP siêu gọn nhẹ chỉ 883g với lớp da hoa văn BISHAMON-TEX™ độc quyền, hệ thống chống rung 8.0 stops và 20 giả lập màu phim bao gồm REALA ACE.'
  },
  'gfx100rf': {
    name: 'FUJIFILM GFX100RF',
    mount_type: 'G_MOUNT',
    base_price: 800000,
    deposit: 11000000,
    image_url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2025/03/product-list_gfx100rf.jpg',
    specs: {
      sensor: '102MP Large Format CMOS II',
      megapixels: 102.0,
      processor: 'X-Processor 5',
      ibis: '7.5 stops',
      video: '4K/30p HQ',
      burst_rate: '6.0fps',
      battery: 'NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/gfx100rf/'
    },
    description: 'Dòng Medium Format phong cách Rangefinder thanh lịch và cơ động nhất từ trước tới nay, cảm biến 102 triệu điểm ảnh tái hiện chi tiết và dải tương phản động vô song.'
  },
  'gfx-eterna-55': {
    name: 'FUJIFILM GFX ETERNA 55 Cinema Camera',
    mount_type: 'G_MOUNT',
    base_price: 1200000,
    deposit: 18000000,
    image_url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2025/09/featured-img-ETERNA.jpg',
    specs: {
      sensor: '102MP Large Format Cinema CMOS II HS',
      megapixels: 102.0,
      processor: 'X-Processor 5',
      ibis: 'Cinema IS',
      video: '8K Open Gate, Apple ProRes RAW, F-Log2',
      burst_rate: 'Cinema 24/25/30/60fps',
      battery: 'V-Mount / NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/gfx-eterna-55/'
    },
    description: 'Máy quay phim điện ảnh Large Format định dạng thế hệ mới mang tên huyền thoại ETERNA, cảm biến 102MP tốc độ cao hỗ trợ ghi hình chuẩn Hollywood và chuyển màu mượt mà.'
  },
  'x-h2s': {
    name: 'FUJIFILM X-H2S Flagship',
    mount_type: 'X_MOUNT',
    base_price: 650000,
    deposit: 8000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 5 HS (Stacked BSI)',
      megapixels: 26.1,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 7.0 stops',
      video: '6.2K/30p, 4K/120p 4:2:2 10-bit Apple ProRes',
      burst_rate: '40fps Blackout-free',
      battery: 'NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-h2s/'
    },
    description: 'Flagship Mirrorless tốc độ cao cảm biến X-Trans CMOS 5 HS 26.1MP Stacked BSI, chụp liên tiếp 40fps không blackout, quay 6.2K/30p Apple ProRes.'
  },
  'x-h2': {
    name: 'FUJIFILM X-H2',
    mount_type: 'X_MOUNT',
    base_price: 550000,
    deposit: 7000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 5 HR',
      megapixels: 40.2,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 7.0 stops',
      video: '8K/30p, 4K/60p HQ',
      burst_rate: '20fps điện tử / 15fps cơ học',
      battery: 'NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-h2/'
    },
    description: 'Thân máy độ phân giải siêu cao 40.2MP X-Trans CMOS 5 HR, hỗ trợ Pixel Shift 160MP và quay video chuẩn 8K/30p nội bộ.'
  },
  'x-pro3': {
    name: 'FUJIFILM X-Pro3 Dura Black',
    mount_type: 'X_MOUNT',
    base_price: 400000,
    deposit: 5000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 4',
      megapixels: 26.1,
      processor: 'X-Processor 4',
      ibis: 'Không có',
      video: '4K/30p',
      burst_rate: '11fps cơ học',
      battery: 'NP-W126S',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-pro3/'
    },
    description: 'Kiệt tác khung Titanium với lớp phủ Duratect siêu cứng chống trầy xước, kính ngắm lai OVF/EVF và màn hình ẩn kích thích cảm hứng sáng tác.'
  },
  'x-t5': {
    name: 'FUJIFILM X-T5 Body Silver',
    mount_type: 'X_MOUNT',
    base_price: 450000,
    deposit: 5000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 5 HR',
      megapixels: 40.2,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 7.0 stops',
      video: '6.2K/30p 4:2:2 10-bit',
      burst_rate: '15fps cơ học',
      battery: 'NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-t5/'
    },
    description: 'Biểu tượng nhiếp ảnh cổ điển với 3 vòng xoay cơ học, cảm biến 40.2MP X-Trans CMOS 5 HR, chống rung 7.0 stops và màn hình lật 3 chiều.'
  },
  'x-s20': {
    name: 'FUJIFILM X-S20',
    mount_type: 'X_MOUNT',
    base_price: 320000,
    deposit: 3500000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 4',
      megapixels: 26.1,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 7.0 stops',
      video: '6.2K/30p Open Gate, 4K/60p',
      burst_rate: '20fps điện tử / 8fps cơ học',
      battery: 'NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-s20/'
    },
    description: 'Dòng máy đa năng hoàn hảo cho cả chụp ảnh và sáng tạo nội dung Vlog với pin NP-W235 dung lượng lớn, chế độ Vlog chuyên biệt và chống rung 7.0 stops.'
  },
  'x-t50': {
    name: 'FUJIFILM X-T50',
    mount_type: 'X_MOUNT',
    base_price: 380000,
    deposit: 4500000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 5 HR',
      megapixels: 40.2,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 7.0 stops',
      video: '6.2K/30p 4:2:2 10-bit',
      burst_rate: '13fps điện tử',
      battery: 'NP-W126S',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-t50/'
    },
    description: 'Máy ảnh nhỏ gọn đầu tiên trang bị vòng xoay Giả lập màu phim (Film Simulation Dial) chuyên dụng, cảm biến 40.2MP và chống rung IBIS 7.0 stops.'
  },
  'x-t30-iii': {
    name: 'FUJIFILM X-T30 III',
    mount_type: 'X_MOUNT',
    base_price: 280000,
    deposit: 3000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 5',
      megapixels: 26.1,
      processor: 'X-Processor 5',
      ibis: 'Chống rung điện tử',
      video: '4K/60p 10-bit',
      burst_rate: '20fps điện tử',
      battery: 'NP-W126S',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-t30-iii/'
    },
    description: 'Phiên bản kế nhiệm dòng X-T30 nổi tiếng với thuật toán lấy nét AI nhận diện chủ thể tự động, kiểu dáng hoài cổ và trọng lượng nhẹ bỏ túi.'
  },
  'x-e5': {
    name: 'FUJIFILM X-E5',
    mount_type: 'X_MOUNT',
    base_price: 340000,
    deposit: 4000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 5 HR',
      megapixels: 40.2,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 7.0 stops',
      video: '6.2K/30p',
      burst_rate: '13fps',
      battery: 'NP-W126S',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-e5/'
    },
    description: 'Dòng máy Rangefinder tối giản thế hệ mới mang cảm biến 40.2MP siêu nét, hỗ trợ IBIS bên trong thân máy phẳng siêu nhẹ cho nhiếp ảnh gia đường phố.'
  },
  'x-m5': {
    name: 'FUJIFILM X-M5',
    mount_type: 'X_MOUNT',
    base_price: 250000,
    deposit: 2800000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 4',
      megapixels: 26.1,
      processor: 'X-Processor 5',
      video: '6.2K/30p, chế độ 9:16 Short Movie',
      battery: 'NP-W126S',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-m5/'
    },
    description: 'Chiếc máy ảnh nhẹ nhất hệ thống Fujifilm X Series chỉ 355g, trang bị 3 micro định hướng tích hợp và khả năng quay video ngắn dọc 9:16 cho TikTok.'
  },
  'x100vi': {
    name: 'FUJIFILM X100VI Limited',
    mount_type: 'NONE',
    base_price: 500000,
    deposit: 6000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 5 HR (Fixed 23mm F2.0 II)',
      megapixels: 40.2,
      processor: 'X-Processor 5',
      ibis: '5 trục lên đến 6.0 stops',
      video: '6.2K/30p, 4K/60p',
      burst_rate: '11fps cơ học',
      battery: 'NP-W126S',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x100vi/'
    },
    description: 'Siêu phẩm Compact ống kính cố định Fujinon 23mm f/2 II, cảm biến 40.2MP, chống rung IBIS 6.0 stops và bộ lọc ND 4 stops tích hợp.'
  },
  'x-hf1': {
    name: 'FUJIFILM X half (X-HF1)',
    mount_type: 'NONE',
    base_price: 280000,
    deposit: 3000000,
    specs: {
      sensor: 'Khung ảnh dọc Half-Frame phong cách hoài cổ',
      megapixels: 24.0,
      processor: 'X-Processor 5',
      video: 'Full HD Vertical Movie',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-hf1/'
    },
    description: 'Máy ảnh kỹ thuật số định dạng nửa khung hình Half-frame độc đáo lấy cảm hứng từ máy ảnh phim chụp 72 kiểu, tối ưu cho nhiếp ảnh nghệ thuật sáng tạo.'
  },
  'x-t4': {
    name: 'FUJIFILM X-T4',
    mount_type: 'X_MOUNT',
    base_price: 350000,
    deposit: 4000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 4',
      megapixels: 26.1,
      processor: 'X-Processor 4',
      ibis: '5 trục lên đến 6.5 stops',
      video: 'DCI 4K/60p, Full HD 240p',
      battery: 'NP-W235',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-t4/'
    },
    description: 'Thân máy đa năng 26.1MP tích hợp chống rung IBIS 6.5 stops, màn hình xoay lật đa hướng và pin lớn NP-W235 bền bỉ.'
  },
  'x-e4': {
    name: 'FUJIFILM X-E4',
    mount_type: 'X_MOUNT',
    base_price: 260000,
    deposit: 3000000,
    specs: {
      sensor: 'APS-C X-Trans CMOS 4',
      megapixels: 26.1,
      processor: 'X-Processor 4',
      video: '4K/30p',
      battery: 'NP-W126S',
      official_url: 'https://www.fujifilm-x.com/vi-vn/products/cameras/x-e4/'
    },
    description: 'Thiết kế phẳng tối giản phong cách Rangefinder kinh điển, màn hình lật 180 độ hỗ trợ selfie và chất màu phim huyền thoại.'
  }
};

// Build productModels list
const newProductModels = [];

// 1. Add all bodies
for (const [slug, info] of Object.entries(cameraSpecsMap)) {
  const existing = oldCatalog.productModels.find(m => m.model_name.toLowerCase().includes(slug) || m.specs_json?.official_url?.includes(slug));
  const image = info.image_url || existing?.image_url || `https://fujifilm-x.b-cdn.net/wp-content/uploads/2024/05/product-list_${slug}.jpg`;
  
  newProductModels.push({
    model_name: info.name,
    category: 'BODY',
    mount_type: info.mount_type,
    brand: 'Fujifilm',
    base_rental_price_per_day: info.base_price,
    deposit_amount: info.deposit,
    description: info.description,
    specs_json: info.specs,
    image_url: image,
    items: existing?.items || [
      {
        serial_number: `FUJI-${slug.toUpperCase()}-01`,
        shutter_count: 3200,
        condition_percent: 98,
        status: 'AVAILABLE',
        purchase_date: '2025-10-01',
        purchase_price: info.deposit * 5
      }
    ]
  });
}

// 2. Add existing lenses from old catalog
const oldLenses = oldCatalog.productModels.filter(m => m.category === 'LENS');
newProductModels.push(...oldLenses);

// 3. Add all crawled accessories
for (const acc of rawAccessories) {
  let dailyRate = 40000;
  let depositRate = 500000;
  let categorySub = 'Phụ kiện';

  const lowerName = acc.name.toLowerCase();
  const lowerCat = acc.category.toLowerCase();

  if (lowerCat.includes('flash') || lowerName.includes('flash') || lowerName.includes('commander')) {
    dailyRate = 120000;
    depositRate = 1500000;
    categorySub = 'Đèn Flash';
  } else if (lowerCat.includes('grip') || lowerName.includes('grip')) {
    dailyRate = 80000;
    depositRate = 1200000;
    categorySub = 'Grip & Báng tay cầm';
  } else if (lowerCat.includes('power') || lowerName.includes('battery') || lowerName.includes('pin') || lowerName.includes('charger')) {
    dailyRate = 35000;
    depositRate = 450000;
    categorySub = 'Nguồn & Pin sạc';
  } else if (lowerName.includes('conversion') || lowerName.includes('adapter') || lowerName.includes('tube')) {
    dailyRate = 150000;
    depositRate = 2000000;
    categorySub = 'Ngàm chuyển đổi & Ống phụ';
  } else if (lowerCat.includes('finder') || lowerName.includes('evf') || lowerName.includes('viewfinder')) {
    dailyRate = 90000;
    depositRate = 1200000;
    categorySub = 'Kính ngắm Finder';
  } else if (lowerCat.includes('case') || lowerName.includes('case')) {
    dailyRate = 30000;
    depositRate = 400000;
    categorySub = 'Bao da & Case';
  } else if (lowerName.includes('filter') || lowerName.includes('hood') || lowerName.includes('cap')) {
    dailyRate = 20000;
    depositRate = 250000;
    categorySub = 'Kính lọc & Nắp che';
  }

  newProductModels.push({
    model_name: acc.name,
    category: 'ACCESSORY',
    mount_type: 'NONE',
    brand: 'Fujifilm',
    base_rental_price_per_day: dailyRate,
    deposit_amount: depositRate,
    description: acc.description || `Phụ kiện chính hãng Fujifilm ${acc.name} nguyên bản đạt chuẩn kiểm định.`,
    specs_json: {
      type: categorySub,
      official_url: acc.url,
      slug: acc.slug
    },
    image_url: acc.image,
    items: [
      {
        serial_number: `ACC-${acc.slug.toUpperCase()}-01`,
        shutter_count: 0,
        condition_percent: 98,
        status: 'AVAILABLE',
        purchase_date: '2026-01-10',
        purchase_price: depositRate * 2
      }
    ]
  });
}

console.log(`\n================================`);
console.log(`Summary of new catalog:`);
console.log(`- Bodies: ${newProductModels.filter(m => m.category === 'BODY').length}`);
console.log(`- Lenses: ${newProductModels.filter(m => m.category === 'LENS').length}`);
console.log(`- Accessories: ${newProductModels.filter(m => m.category === 'ACCESSORY').length}`);
console.log(`- Total Models: ${newProductModels.length}`);
console.log(`================================\n`);

// Save to JSON
const completeCatalogData = {
  membershipTiers: oldCatalog.membershipTiers,
  productModels: newProductModels
};

fs.writeFileSync(oldCatalogPath, JSON.stringify(completeCatalogData, null, 2));
console.log(`Saved updated catalog to ${oldCatalogPath}`);

// Seed into MySQL
async function seedDatabase() {
  console.log('Clearing existing product models and items from MySQL...');
  await prisma.productItem.deleteMany({});
  await prisma.productModel.deleteMany({});

  let serialCounter = 1000;
  const usedSerials = new Set();

  console.log(`Inserting ${newProductModels.length} models into MySQL...`);
  for (const model of newProductModels) {
    const createdModel = await prisma.productModel.create({
      data: {
        model_name: model.model_name,
        category: model.category,
        mount_type: model.mount_type,
        brand: model.brand,
        base_rental_price_per_day: model.base_rental_price_per_day,
        deposit_amount: model.deposit_amount,
        description: model.description,
        specs_json: model.specs_json,
        image_url: model.image_url,
        is_active: true
      }
    });

    if (model.items && model.items.length > 0) {
      for (const item of model.items) {
        let serial = item.serial_number;
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
            purchase_price: item.purchase_price || null
          }
        });
      }
    }
  }

  const countModels = await prisma.productModel.count();
  const countItems = await prisma.productItem.count();
  console.log(`\n✅ MySQL Seeding Complete!`);
  console.log(`Total ProductModels in MySQL: ${countModels}`);
  console.log(`Total ProductItems in MySQL: ${countItems}`);
}

seedDatabase()
  .catch(err => {
    console.error('Database seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
