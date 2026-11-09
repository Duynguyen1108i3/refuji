import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đảm bảo thư mục data/ tồn tại
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'refuji.sqlite');
export const db = new Database(dbPath);

// Bật Foreign Keys & WAL mode (Write-Ahead Logging) cho tốc độ cao và an toàn giao dịch
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Khởi tạo Schema CSDL ReFuji v1.1
 */
export function initDatabase() {
  db.exec(`
    -- 1. Bảng MembershipTiers
    CREATE TABLE IF NOT EXISTS membership_tiers (
      tier_code VARCHAR(50) PRIMARY KEY,
      tier_name VARCHAR(100) NOT NULL,
      discount_percent REAL NOT NULL DEFAULT 0.0,
      min_rentals INTEGER NOT NULL DEFAULT 0,
      min_score INTEGER NOT NULL DEFAULT 0,
      description TEXT
    );

    -- 2. Bảng Users (Chuẩn ReFuji v1.1)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(191) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
      membership_tier VARCHAR(50) NOT NULL DEFAULT 'BRONZE',
      reputation_score INTEGER NOT NULL DEFAULT 100,
      total_completed_rentals INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      privacy_consent_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (membership_tier) REFERENCES membership_tiers(tier_code)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- 3. Bảng UserKyc (Bảo vệ DLCN 2025)
    CREATE TABLE IF NOT EXISTS user_kyc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      id_card_encrypted TEXT,
      id_card_hash VARCHAR(64),
      id_card_last4 VARCHAR(4),
      full_name_id VARCHAR(150),
      privacy_consent INTEGER NOT NULL DEFAULT 1,
      privacy_consent_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 4. Bảng RentalOrders
    CREATE TABLE IF NOT EXISTS rental_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      model_id VARCHAR(100) NOT NULL,
      model_name VARCHAR(200) NOT NULL,
      start_date TEXT NOT NULL,
      expected_return_date TEXT NOT NULL,
      total_rent REAL NOT NULL,
      deposit_amount REAL NOT NULL,
      order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
      payment_deadline TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 5. Bảng ProductModels (139 thiết bị: Thân máy, Ống kính, Phụ kiện)
    CREATE TABLE IF NOT EXISTS product_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name VARCHAR(200) NOT NULL,
      category VARCHAR(50) NOT NULL,
      mount_type VARCHAR(50) DEFAULT 'NONE',
      brand VARCHAR(100) DEFAULT 'Fujifilm',
      base_rental_price_per_day REAL NOT NULL,
      deposit_amount REAL NOT NULL,
      description TEXT,
      specs_json TEXT,
      image_url VARCHAR(255),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_product_models_category ON product_models(category);

    -- 6. Bảng ProductItems (Cá thể theo Serial Number thực tế)
    CREATE TABLE IF NOT EXISTS product_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL,
      serial_number VARCHAR(100) UNIQUE NOT NULL,
      shutter_count INTEGER NOT NULL DEFAULT 0,
      condition_percent INTEGER NOT NULL DEFAULT 100,
      status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
      purchase_date TEXT,
      purchase_price REAL,
      total_rental_count INTEGER NOT NULL DEFAULT 0,
      last_maintenance_date TEXT,
      next_maintenance_date TEXT,
      note TEXT,
      FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_product_items_model_id ON product_items(model_id);
  `);

  // Bổ sung các cột lưu trữ serial và chi tiết kho vào rental_orders nếu chưa có
  try {
    db.exec('ALTER TABLE rental_orders ADD COLUMN assigned_serials TEXT');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE rental_orders ADD COLUMN quantity INTEGER DEFAULT 1');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE rental_orders ADD COLUMN items_detail TEXT');
  } catch (_) {}

  // 1. Seed Membership Tiers nếu chưa có
  const tierCount = db.prepare('SELECT COUNT(*) as count FROM membership_tiers').get() as { count: number };
  if (tierCount.count === 0) {
    const insertTier = db.prepare(`
      INSERT INTO membership_tiers (tier_code, tier_name, discount_percent, min_rentals, min_score, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertTier.run('BRONZE', 'Hạng Đồng', 0, 0, 0, 'Hạng mặc định cho thành viên mới');
    insertTier.run('SILVER', 'Hạng Bạc', 5, 3, 80, 'Giảm 5% tiền cọc');
    insertTier.run('GOLD', 'Hạng Vàng', 10, 10, 90, 'Giảm 10% tiền cọc, ưu tiên giữ chỗ');
    insertTier.run('PLATINUM', 'Bạch Kim', 15, 25, 95, 'Giảm 15% tiền cọc, thủ tục Fast-track');
    console.log('✅ [Database] Đã seed 4 hạng thành viên: BRONZE, SILVER, GOLD, PLATINUM');
  }

  // 2. Seed & Tự động đồng bộ tài khoản mẫu ban đầu
  const saltRounds = 12;
  const defaultPassword = 'Test@1188'; // Mật khẩu quản trị chuẩn mạnh (hỗ trợ cả test@123)
  const hash = bcrypt.hashSync(defaultPassword, saltRounds);
  const now = new Date().toISOString();

  const existingUser = db.prepare('SELECT id, role FROM users WHERE email = ?').get('fuji@refuji.vn') as { id: number; role: string } | undefined;
  if (!existingUser) {
    const insertUser = db.prepare(`
      INSERT INTO users (full_name, email, password_hash, phone, role, membership_tier, reputation_score, total_completed_rentals, is_active, privacy_consent_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertUser.run(
      'Admin Fuji',
      'fuji@refuji.vn',
      hash,
      '0901234567',
      'ADMIN',
      'GOLD',
      100,
      8,
      1,
      now,
      now,
      now
    );

    db.prepare(`
      INSERT INTO user_kyc (user_id, id_card_last4, full_name_id, privacy_consent, privacy_consent_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(result.lastInsertRowid, '6789', 'Admin Fuji', 1, now);

    console.log(`✅ [Database] Đã tạo tài khoản mặc định: fuji@refuji.vn (Mật khẩu: ${defaultPassword})`);
  } else {
    // Tự động đồng bộ mã băm mật khẩu mới & vai trò ADMIN & tên khi chỉnh sửa trong db.ts
    db.prepare(`
      UPDATE users SET full_name = ?, role = 'ADMIN', password_hash = ?, updated_at = ? WHERE email = ?
    `).run('Admin Fuji', hash, now, 'fuji@refuji.vn');
    console.log(`🔄 [Database] Đã đồng bộ mật khẩu mã băm mới cho fuji@refuji.vn (Mật khẩu: ${defaultPassword})`);
  }

  // 3. Seed Danh mục 139 Thiết bị (ProductModels & ProductItems) từ fujifilm-catalog.json
  const modelCount = db.prepare('SELECT COUNT(*) as count FROM product_models').get() as { count: number };
  if (modelCount.count === 0) {
    try {
      let catalogPath = path.resolve(__dirname, '../prisma/seed-data/fujifilm-catalog.json');
      if (!fs.existsSync(catalogPath)) {
        catalogPath = path.resolve(__dirname, '../../../../public/fujifilm-catalog.json');
      }

      if (fs.existsSync(catalogPath)) {
        const catalogRaw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        const modelsList = catalogRaw.productModels || (Array.isArray(catalogRaw) ? catalogRaw : []);

        const insertModel = db.prepare(`
          INSERT INTO product_models (
            model_name, category, mount_type, brand,
            base_rental_price_per_day, deposit_amount, description,
            specs_json, image_url, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertItem = db.prepare(`
          INSERT OR IGNORE INTO product_items (
            model_id, serial_number, shutter_count, condition_percent,
            status, purchase_date, purchase_price, total_rental_count,
            last_maintenance_date, next_maintenance_date, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const seedAll = db.transaction(() => {
          const nowStr = new Date().toISOString();
          for (const m of modelsList) {
            const modelRes = insertModel.run(
              m.model_name || m.name,
              m.category || 'BODY',
              m.mount_type || 'NONE',
              m.brand || 'Fujifilm',
              Number(m.base_rental_price_per_day || m.dailyRate || 0),
              Number(m.deposit_amount || m.depositRate || 0),
              m.description || '',
              JSON.stringify(m.specs_json || m.specs || {}),
              m.image_url || m.image || '',
              1,
              nowStr
            );

            const modelId = modelRes.lastInsertRowid;
            if (Array.isArray(m.items) && m.items.length > 0) {
              for (const it of m.items) {
                insertItem.run(
                  modelId,
                  it.serial_number || `SN-${modelId}-${Date.now()}`,
                  it.shutter_count || 0,
                  it.condition_percent || 100,
                  it.status || 'AVAILABLE',
                  it.purchase_date || null,
                  it.purchase_price ? Number(it.purchase_price) : null,
                  it.total_rental_count || 0,
                  it.last_maintenance_date || null,
                  it.next_maintenance_date || null,
                  it.note || null
                );
              }
            } else {
              // Tạo ít nhất 1 cá thể vật lý mẫu
              insertItem.run(
                modelId,
                `SN-FUJI-${String(modelId).padStart(4, '0')}`,
                2150,
                98,
                'AVAILABLE',
                '2025-10-01',
                null,
                3,
                null,
                null,
                'Thiết bị kiểm định tiêu chuẩn'
              );
            }
          }
        });

        seedAll();
        console.log(`✅ [Database] Đã seed thành công ${modelsList.length} thiết bị vào bảng product_models & product_items!`);
      }
    } catch (seedErr) {
      console.error('❌ Lỗi khi seed ProductModels:', seedErr);
    }
  } else {
    // Nếu bảng đã có dữ liệu, tự động đồng bộ lại các thiết bị và số lượng từ fujifilm-catalog.json
    let catalogPath = path.resolve(__dirname, '../../../../public/fujifilm-catalog.json');
    if (!fs.existsSync(catalogPath)) {
      catalogPath = path.resolve(__dirname, '../prisma/seed-data/fujifilm-catalog.json');
    }
    syncCatalogItems(catalogPath);
  }

  // Tự động lắng nghe thay đổi file fujifilm-catalog.json khi người dùng sửa trong VS Code
  setupCatalogWatcher();

  console.log(`🚀 [Database] SQLite Database hoạt động tại: ${dbPath}`);
}

let watcherInitialized = false;
let watchDebounceTimer: NodeJS.Timeout | null = null;

function setupCatalogWatcher() {
  if (watcherInitialized) return;
  let catalogPath = path.resolve(__dirname, '../../../../public/fujifilm-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    catalogPath = path.resolve(__dirname, '../prisma/seed-data/fujifilm-catalog.json');
  }
  if (!fs.existsSync(catalogPath)) return;

  try {
    fs.watch(catalogPath, () => {
      if (watchDebounceTimer) clearTimeout(watchDebounceTimer);
      watchDebounceTimer = setTimeout(() => {
        console.log('📝 [VS Code Watcher] Phát hiện thay đổi trong fujifilm-catalog.json! Đang tự động cập nhật số lượng kho...');
        syncCatalogItems(catalogPath);
      }, 350);
    });
    watcherInitialized = true;
    console.log('👀 [Watcher] Đang theo dõi file public/fujifilm-catalog.json - Mọi sửa đổi số lượng trong VS Code sẽ được tự động đồng bộ ngay lập tức!');
  } catch (err) {
    console.warn('⚠️ Không thể khởi tạo watcher cho fujifilm-catalog.json:', err);
  }
}

/**
 * Đồng bộ danh sách máy và số lượng kho từ file fujifilm-catalog.json vào CSDL SQLite
 */
export function syncCatalogItems(catalogPath?: string) {
  try {
    let resolvedPath = catalogPath;
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      resolvedPath = path.resolve(__dirname, '../../../../public/fujifilm-catalog.json');
    }
    if (!fs.existsSync(resolvedPath)) {
      resolvedPath = path.resolve(__dirname, '../prisma/seed-data/fujifilm-catalog.json');
    }
    if (!fs.existsSync(resolvedPath)) return;

    const catalogRaw = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    const modelsList = catalogRaw.productModels || (Array.isArray(catalogRaw) ? catalogRaw : []);
    if (!modelsList || modelsList.length === 0) return;

    const findModel = db.prepare('SELECT id FROM product_models WHERE model_name = ?');

    const upsertItem = db.prepare(`
      INSERT INTO product_items (
        model_id, serial_number, shutter_count, condition_percent,
        status, purchase_date, purchase_price, total_rental_count,
        last_maintenance_date, next_maintenance_date, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(serial_number) DO UPDATE SET
        model_id = excluded.model_id,
        shutter_count = excluded.shutter_count,
        condition_percent = excluded.condition_percent,
        status = excluded.status,
        note = excluded.note
    `);

    let count = 0;
    const syncTx = db.transaction(() => {
      for (const m of modelsList) {
        const row = findModel.get(m.model_name || m.name) as { id: number } | undefined;
        if (!row) continue;
        const modelId = row.id;

        if (Array.isArray(m.items) && m.items.length > 0) {
          for (const it of m.items) {
            upsertItem.run(
              modelId,
              it.serial_number || `SN-${modelId}-${Date.now()}`,
              it.shutter_count || 0,
              it.condition_percent || 100,
              it.status || 'AVAILABLE',
              it.purchase_date || null,
              it.purchase_price ? Number(it.purchase_price) : null,
              it.total_rental_count || 0,
              it.last_maintenance_date || null,
              it.next_maintenance_date || null,
              it.note || null
            );
            count++;
          }
        }
      }
    });

    syncTx();
    console.log(`✅ [Database] Đã tự động đồng bộ ${count} thiết bị từ catalog JSON vào SQLite!`);
  } catch (err) {
    console.error('❌ Lỗi khi đồng bộ catalog items:', err);
  }
}
