import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { backfillOperationalLedgerOnce } from './modules/admin/seed-operations.helper.js';

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

    -- 4. Bảng RentalOrders (Hỗ trợ cả Thành viên và Khách vãng lai với user_id nullable)
    CREATE TABLE IF NOT EXISTS rental_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER NULL,
      is_guest INTEGER NOT NULL DEFAULT 0,
      guest_name VARCHAR(150),
      guest_phone VARCHAR(20),
      guest_email VARCHAR(191),
      guest_note TEXT,
      payment_method VARCHAR(30) DEFAULT 'VIETQR',
      privacy_consent_at TEXT,
      ip_address VARCHAR(50),
      model_id VARCHAR(100) NOT NULL,
      model_name VARCHAR(200) NOT NULL,
      start_date TEXT NOT NULL,
      expected_return_date TEXT NOT NULL,
      total_rent REAL NOT NULL,
      deposit_amount REAL NOT NULL,
      order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
      payment_deadline TEXT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 5. Bảng ProductModels (Thân máy, Ống kính, Phụ kiện)
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

  // Tính năng: Migration bảng rental_orders cho phép user_id NULL và bổ sung đầy đủ trường Khách vãng lai + Index tra cứu/lịch thuê
  try {
    const tableCols = db.prepare('PRAGMA table_info(rental_orders)').all() as Array<{ name: string; notnull: number }>;
    const userIdCol = tableCols.find((c) => c.name === 'user_id');
    const deadlineCol = tableCols.find((c) => c.name === 'payment_deadline');

    if ((userIdCol && userIdCol.notnull === 1) || (deadlineCol && deadlineCol.notnull === 1)) {
      db.pragma('foreign_keys = OFF');
      const migrateGuestOrders = db.transaction(() => {
        db.exec(`
          CREATE TABLE rental_orders_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_code VARCHAR(50) UNIQUE NOT NULL,
            user_id INTEGER NULL,
            is_guest INTEGER NOT NULL DEFAULT 0,
            guest_name VARCHAR(150),
            guest_phone VARCHAR(20),
            guest_email VARCHAR(191),
            guest_note TEXT,
            payment_method VARCHAR(30) DEFAULT 'VIETQR',
            privacy_consent_at TEXT,
            ip_address VARCHAR(50),
            model_id VARCHAR(100) NOT NULL,
            model_name VARCHAR(200) NOT NULL,
            start_date TEXT NOT NULL,
            expected_return_date TEXT NOT NULL,
            total_rent REAL NOT NULL,
            deposit_amount REAL NOT NULL,
            order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
            payment_deadline TEXT NULL,
            created_at TEXT NOT NULL,
            assigned_serials TEXT,
            quantity INTEGER DEFAULT 1,
            items_detail TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );
          INSERT INTO rental_orders_new (
            id, order_code, user_id, model_id, model_name, start_date,
            expected_return_date, total_rent, deposit_amount, order_status,
            payment_deadline, created_at, assigned_serials, quantity, items_detail
          )
          SELECT
            id, order_code, user_id, model_id, model_name, start_date,
            expected_return_date, total_rent, deposit_amount, order_status,
            payment_deadline, created_at, assigned_serials, quantity, items_detail
          FROM rental_orders;
          DROP TABLE rental_orders;
          ALTER TABLE rental_orders_new RENAME TO rental_orders;
        `);
      });
      migrateGuestOrders();
      db.pragma('foreign_keys = ON');
      console.log('🔄 [Database] Đã nâng cấp bảng rental_orders: hỗ trợ Khách vãng lai (user_id nullable)');
    }
  } catch (migErr) {
    db.pragma('foreign_keys = ON');
    console.error('❌ Lỗi migration bảng rental_orders:', migErr);
  }

  const alterColumns = [
    'ALTER TABLE rental_orders ADD COLUMN assigned_serials TEXT',
    'ALTER TABLE rental_orders ADD COLUMN quantity INTEGER DEFAULT 1',
    'ALTER TABLE rental_orders ADD COLUMN items_detail TEXT',
    'ALTER TABLE rental_orders ADD COLUMN is_guest INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE rental_orders ADD COLUMN guest_name VARCHAR(150)',
    'ALTER TABLE rental_orders ADD COLUMN guest_phone VARCHAR(20)',
    'ALTER TABLE rental_orders ADD COLUMN guest_email VARCHAR(191)',
    'ALTER TABLE rental_orders ADD COLUMN guest_note TEXT',
    "ALTER TABLE rental_orders ADD COLUMN payment_method VARCHAR(30) DEFAULT 'VIETQR'",
    "ALTER TABLE rental_orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'UNPAID'",
    'ALTER TABLE rental_orders ADD COLUMN tier_discount_amount REAL DEFAULT 0',
    'ALTER TABLE rental_orders ADD COLUMN cancellation_reason TEXT',
    'ALTER TABLE rental_orders ADD COLUMN cancelled_by INTEGER',
    'ALTER TABLE rental_orders ADD COLUMN cancelled_at TEXT',
    'ALTER TABLE rental_orders ADD COLUMN privacy_consent_at TEXT',
    'ALTER TABLE rental_orders ADD COLUMN ip_address VARCHAR(50)',
  ];
  for (const sql of alterColumns) {
    try {
      db.exec(sql);
    } catch (_) {}
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_guest_lookup ON rental_orders(order_code, guest_phone);
    CREATE INDEX IF NOT EXISTS idx_orders_availability ON rental_orders(order_status, start_date, expected_return_date);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON rental_orders(user_id);

    -- 7. Bảng CheckoutRecords (Biên bản bàn giao thiết bị & KYC tại quầy)
    CREATE TABLE IF NOT EXISTS checkout_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      order_code VARCHAR(50) NOT NULL,
      staff_id INTEGER NULL,
      staff_name VARCHAR(150),
      checkout_date TEXT NOT NULL,
      kyc_verification_method VARCHAR(50) NOT NULL,
      kyc_document_last4 VARCHAR(4) NOT NULL,
      contract_signed INTEGER NOT NULL DEFAULT 1,
      accessories_json TEXT NOT NULL,
      shutter_snapshots_json TEXT,
      condition_notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES rental_orders(id) ON DELETE CASCADE
    );

    -- 8. Bảng ReturnRecords (Biên bản thu hồi & Quyết toán hoàn cọc)
    CREATE TABLE IF NOT EXISTS return_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      order_code VARCHAR(50) NOT NULL,
      staff_id INTEGER NULL,
      staff_name VARCHAR(150),
      actual_return_date TEXT NOT NULL,
      late_hours REAL NOT NULL DEFAULT 0,
      late_days INTEGER NOT NULL DEFAULT 0,
      total_late_fee REAL NOT NULL DEFAULT 0,
      total_damage_fee REAL NOT NULL DEFAULT 0,
      total_missing_acc_fee REAL NOT NULL DEFAULT 0,
      other_fee REAL NOT NULL DEFAULT 0,
      other_fee_description TEXT,
      deposit_held REAL NOT NULL,
      refund_amount REAL NOT NULL,
      additional_charge_amount REAL NOT NULL DEFAULT 0,
      staff_inspection_notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES rental_orders(id) ON DELETE CASCADE
    );

    -- 9. Bảng ReturnItemDetails (Chi tiết kiểm định từng Serial lúc Check-in)
    CREATE TABLE IF NOT EXISTS return_item_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_record_id INTEGER NOT NULL,
      order_code VARCHAR(50) NOT NULL,
      item_id INTEGER NULL,
      serial_number VARCHAR(100) NOT NULL,
      model_name VARCHAR(200),
      condition_after INTEGER NOT NULL,
      shutter_count_after INTEGER NOT NULL DEFAULT 0,
      damage_level VARCHAR(30) NOT NULL DEFAULT 'NONE',
      damage_description TEXT,
      damage_fee REAL NOT NULL DEFAULT 0,
      accessories_returned_json TEXT,
      missing_accessories_fee REAL NOT NULL DEFAULT 0,
      next_item_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
      created_at TEXT NOT NULL,
      FOREIGN KEY (return_record_id) REFERENCES return_records(id) ON DELETE CASCADE
    );

    -- 10. Bảng InspectionPhotos (Ảnh đối chứng kiểm tra 2 chiều CHECKOUT / CHECKIN)
    CREATE TABLE IF NOT EXISTS inspection_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      order_code VARCHAR(50) NOT NULL,
      serial_number VARCHAR(100),
      phase VARCHAR(20) NOT NULL,
      photo_data TEXT NOT NULL,
      caption VARCHAR(255),
      uploaded_by INTEGER NULL,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES rental_orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_inspection_photos_order ON inspection_photos(order_code, phase);

    -- 11. Bảng PaymentTransactions (Sổ cái giao dịch thanh toán & hoàn cọc)
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      order_code VARCHAR(50) NOT NULL,
      transaction_code VARCHAR(60) UNIQUE NOT NULL,
      amount REAL NOT NULL,
      payment_method VARCHAR(30) NOT NULL,
      transaction_type VARCHAR(30) NOT NULL,
      gateway_transaction_id VARCHAR(100),
      gateway_response_code VARCHAR(20),
      status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
      note TEXT,
      processed_by INTEGER NULL,
      processed_by_name VARCHAR(150),
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES rental_orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_payment_tx_order ON payment_transactions(order_code, status);

    -- 12. Bảng MaintenanceLogs (Phiếu bảo dưỡng, vệ sinh cảm biến & sửa chữa)
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      serial_number VARCHAR(100) NOT NULL,
      maintenance_type VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      cost REAL NOT NULL DEFAULT 0,
      performed_by INTEGER NULL,
      performed_by_name VARCHAR(150),
      external_vendor VARCHAR(150),
      shutter_at_service INTEGER DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT NULL,
      next_maintenance_date TEXT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES product_items(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_maint_item ON maintenance_logs(item_id, completed_at);

    -- 13. Bảng AuditLogs (Nhật ký kiểm toán bảo mật & tác vụ Cron ngầm)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NULL,
      actor_type VARCHAR(30) NOT NULL DEFAULT 'USER',
      actor_label VARCHAR(150),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(100) NOT NULL,
      old_value TEXT NULL,
      new_value TEXT NULL,
      description TEXT NULL,
      ip_address VARCHAR(50) NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(action, created_at);

    -- 14. Bảng CartItems (Giỏ hàng lưu trữ bền vững theo tài khoản thành viên)
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      model_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, model_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
  `);

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

  // 3. Seed Danh mục Thiết bị (ProductModels & ProductItems) từ fujifilm-catalog.json
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
          db.prepare(`
            INSERT INTO audit_logs (
              user_id, actor_type, actor_label, action, entity_type, entity_id,
              old_value, new_value, description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            null,
            'SYSTEM',
            'ReFuji Catalog Sync',
            'CATALOG_CURATED_ACCESSORIES_202611',
            'ProductModel',
            'ACCESSORY',
            null,
            JSON.stringify({ curatedCount: modelsList.filter((x: any) => x.category === 'ACCESSORY').length }),
            'Khởi tạo danh mục phụ kiện tinh gọn 6 nhóm (Pin & Sạc, Thẻ nhớ, Flash, Tripod, Microphone, Gimbal).',
            nowStr
          );
        });

        seedAll();
        console.log(`✅ [Database] Đã seed thành công ${modelsList.length} thiết bị vào bảng product_models & product_items!`);
      }
    } catch (seedErr) {
      console.error('❌ Lỗi khi seed ProductModels:', seedErr);
    }
  } else {
    // Chỉ bổ sung Serial mới chưa có trong SQLite, không ghi đè trạng thái vận hành (RENTED/MAINTENANCE/shutter) khi restart
    let catalogPath = path.resolve(__dirname, '../../../../public/fujifilm-catalog.json');
    if (!fs.existsSync(catalogPath)) {
      catalogPath = path.resolve(__dirname, '../prisma/seed-data/fujifilm-catalog.json');
    }
    curateAccessoriesCatalogOnce(catalogPath);
    syncCuratedAccessoryImages(catalogPath);
    syncCatalogItems(catalogPath, false);
  }

  // Bảo vệ đồng bộ hai chiều: mọi Serial thuộc đơn DELIVERED/OVERDUE phải mang trạng thái RENTED trong kho
  reconcileActiveOrderItemStatuses();

  // Đồng bộ bảng giao dịch, bảo dưỡng & nhật ký cho các bản ghi hiện hữu (chỉ chạy 1 lần khi bảng trống)
  backfillOperationalLedgerOnce();

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
        syncCatalogItems(catalogPath, true);
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
export function syncCatalogItems(catalogPath?: string, overwriteExisting = false) {
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

    const upsertItem = overwriteExisting
      ? db.prepare(`
          INSERT INTO product_items (
            model_id, serial_number, shutter_count, condition_percent,
            status, purchase_date, purchase_price, total_rental_count,
            last_maintenance_date, next_maintenance_date, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(serial_number) DO UPDATE SET
            model_id = excluded.model_id,
            shutter_count = CASE
              WHEN product_items.shutter_count > excluded.shutter_count THEN product_items.shutter_count
              ELSE excluded.shutter_count
            END,
            condition_percent = excluded.condition_percent,
            status = CASE
              WHEN product_items.status IN ('RENTED', 'MAINTENANCE', 'LOST') THEN product_items.status
              ELSE excluded.status
            END,
            note = COALESCE(NULLIF(product_items.note, ''), excluded.note)
        `)
      : db.prepare(`
          INSERT OR IGNORE INTO product_items (
            model_id, serial_number, shutter_count, condition_percent,
            status, purchase_date, purchase_price, total_rental_count,
            last_maintenance_date, next_maintenance_date, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    reconcileActiveOrderItemStatuses();
    console.log(`✅ [Database] Đã tự động đồng bộ ${count} thiết bị từ catalog JSON vào SQLite!`);
  } catch (err) {
    console.error('❌ Lỗi khi đồng bộ catalog items:', err);
  }
}

/**
 * Đối soát tự động: Mọi cá thể Serial đang thuộc đơn hàng DELIVERED / OVERDUE / OVERDUE_CRITICAL
 * bắt buộc phải giữ trạng thái RENTED trong product_items nếu trước đó bị chỉnh nhầm về AVAILABLE.
 */
export function reconcileActiveOrderItemStatuses(): number {
  try {
    const activeOrders = db
      .prepare(`
        SELECT assigned_serials, items_detail
        FROM rental_orders
        WHERE order_status IN ('DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL')
      `)
      .all() as Array<{ assigned_serials: string | null; items_detail: string | null }>;

    const deliveredSerials = new Set<string>();
    for (const ord of activeOrders) {
      if (ord.assigned_serials) {
        ord.assigned_serials
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => deliveredSerials.add(s));
      }
      if (ord.items_detail) {
        try {
          const parsed = JSON.parse(ord.items_detail);
          if (Array.isArray(parsed)) {
            for (const entry of parsed) {
              if (Array.isArray(entry?.assigned_serials)) {
                entry.assigned_serials
                  .map((s: any) => String(s || '').trim())
                  .filter(Boolean)
                  .forEach((s: string) => deliveredSerials.add(s));
              }
            }
          }
        } catch (_) {}
      }
    }

    if (deliveredSerials.size === 0) return 0;

    const markRented = db.prepare(`
      UPDATE product_items
      SET status = 'RENTED'
      WHERE serial_number = ? AND status = 'AVAILABLE'
    `);
    let repaired = 0;
    const tx = db.transaction(() => {
      for (const sn of deliveredSerials) {
        const res = markRented.run(sn);
        repaired += res.changes;
      }
    });
    tx();
    return repaired;
  } catch (err) {
    console.error('❌ Lỗi khi đối soát trạng thái Serial đang giao:', err);
    return 0;
  }
}

/**
 * Tinh gọn danh mục phụ kiện 1 lần duy nhất cho CSDL hiện hữu về đúng 6 nhóm tiêu chuẩn
 * (Pin & Sạc, Thẻ nhớ, Flash, Tripod, Microphone, Gimbal) mà không ảnh hưởng đơn hàng hoặc BODY/LENS.
 */
function curateAccessoriesCatalogOnce(catalogPath: string) {
  try {
    const alreadyDone = db
      .prepare("SELECT COUNT(*) as c FROM audit_logs WHERE action = 'CATALOG_CURATED_ACCESSORIES_202611'")
      .get() as { c: number };
    if (alreadyDone.c > 0) return;

    if (!fs.existsSync(catalogPath)) return;
    const catalogRaw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const modelsList = (catalogRaw.productModels || (Array.isArray(catalogRaw) ? catalogRaw : [])) as any[];
    const curatedAccessories = modelsList.filter((m) => m.category === 'ACCESSORY');
    if (curatedAccessories.length === 0) return;

    const existingAccessories = db
      .prepare("SELECT id, model_name FROM product_models WHERE category = 'ACCESSORY'")
      .all() as Array<{ id: number; model_name: string }>;

    const orders = db.prepare('SELECT model_id, items_detail FROM rental_orders').all() as Array<{
      model_id: string;
      items_detail: string | null;
    }>;

    const reservedIds = new Set<number>();
    for (const acc of existingAccessories) {
      for (const ord of orders) {
        const mIdStr = String(ord.model_id || '');
        if (mIdStr === String(acc.id) || mIdStr.endsWith(`-${acc.id}`)) {
          reservedIds.add(acc.id);
          continue;
        }
        if (ord.items_detail) {
          try {
            const parsed = JSON.parse(ord.items_detail);
            if (Array.isArray(parsed)) {
              for (const entry of parsed) {
                const eId = String(entry?.modelId ?? entry?.model_id ?? '');
                if (eId === String(acc.id) || eId.endsWith(`-${acc.id}`)) {
                  reservedIds.add(acc.id);
                }
              }
            }
          } catch (_) {}
        }
      }
    }

    const deleteModel = db.prepare('DELETE FROM product_models WHERE id = ?');
    const insertModel = db.prepare(`
      INSERT INTO product_models (
        model_name, category, mount_type, brand,
        base_rental_price_per_day, deposit_amount, description,
        specs_json, image_url, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateModel = db.prepare(`
      UPDATE product_models
      SET brand = ?, base_rental_price_per_day = ?, deposit_amount = ?, description = ?, specs_json = ?, image_url = ?, is_active = 1
      WHERE id = ?
    `);
    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO product_items (
        model_id, serial_number, shutter_count, condition_percent,
        status, purchase_date, purchase_price, total_rental_count,
        last_maintenance_date, next_maintenance_date, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const migrateTx = db.transaction(() => {
      const nowStr = new Date().toISOString();
      let removedCount = 0;

      for (const acc of existingAccessories) {
        if (!reservedIds.has(acc.id)) {
          deleteModel.run(acc.id);
          removedCount++;
        }
      }

      for (const m of curatedAccessories) {
        const existingReserved = db
          .prepare("SELECT id FROM product_models WHERE category = 'ACCESSORY' AND model_name = ?")
          .get(m.model_name) as { id: number } | undefined;

        let modelId: number;
        if (existingReserved) {
          updateModel.run(
            m.brand || 'Fujifilm',
            Number(m.base_rental_price_per_day || 0),
            Number(m.deposit_amount || 0),
            m.description || '',
            JSON.stringify(m.specs_json || {}),
            m.image_url || '',
            existingReserved.id
          );
          modelId = existingReserved.id;
        } else {
          const res = insertModel.run(
            m.model_name,
            'ACCESSORY',
            m.mount_type || 'NONE',
            m.brand || 'Fujifilm',
            Number(m.base_rental_price_per_day || 0),
            Number(m.deposit_amount || 0),
            m.description || '',
            JSON.stringify(m.specs_json || {}),
            m.image_url || '',
            1,
            nowStr
          );
          modelId = Number(res.lastInsertRowid);
        }

        if (Array.isArray(m.items)) {
          for (const it of m.items) {
            insertItem.run(
              modelId,
              it.serial_number,
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
        }
      }

      db.prepare(`
        INSERT INTO audit_logs (
          user_id, actor_type, actor_label, action, entity_type, entity_id,
          old_value, new_value, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        null,
        'SYSTEM',
        'ReFuji Catalog Sync',
        'CATALOG_CURATED_ACCESSORIES_202611',
        'ProductModel',
        'ACCESSORY',
        JSON.stringify({ previousAccessoryCount: existingAccessories.length, removedCount }),
        JSON.stringify({ curatedAccessoryCount: curatedAccessories.length }),
        `Đã tinh gọn danh mục phụ kiện từ ${existingAccessories.length} mẫu cũ xuống còn ${curatedAccessories.length} mẫu chuẩn thuộc 6 nhóm (Pin & Sạc, Thẻ nhớ, Flash, Tripod, Microphone, Gimbal).`,
        nowStr
      );
    });

    migrateTx();
    console.log(`✅ [Database] Đã tinh gọn danh mục phụ kiện còn ${curatedAccessories.length} mẫu thuộc 6 nhóm tiêu chuẩn!`);
  } catch (err) {
    console.error('❌ Lỗi khi tinh gọn danh mục phụ kiện:', err);
  }
}

/**
 * Cập nhật ảnh sản phẩm thật cho phụ kiện nếu bản ghi trong SQLite vẫn đang trỏ tới SVG cũ.
 */
function syncCuratedAccessoryImages(catalogPath: string) {
  try {
    const svgRowCount = db
      .prepare("SELECT COUNT(*) as c FROM product_models WHERE category = 'ACCESSORY' AND image_url LIKE '%.svg'")
      .get() as { c: number };
    const alreadyLogged = db
      .prepare("SELECT COUNT(*) as c FROM audit_logs WHERE action = 'CATALOG_ACCESSORY_REAL_IMAGES_202611'")
      .get() as { c: number };
    if (svgRowCount.c === 0 && alreadyLogged.c > 0) return;

    if (!fs.existsSync(catalogPath)) return;
    const catalogRaw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const modelsList = (catalogRaw.productModels || (Array.isArray(catalogRaw) ? catalogRaw : [])) as any[];
    const curatedAccessories = modelsList.filter((m) => m.category === 'ACCESSORY' && m.image_url);
    if (curatedAccessories.length === 0) return;

    const updateImage = db.prepare(`
      UPDATE product_models
      SET image_url = ?
      WHERE category = 'ACCESSORY' AND model_name = ? AND (image_url LIKE '%.svg' OR ? = 0)
    `);

    const nowStr = new Date().toISOString();
    let updatedCount = 0;

    const syncTx = db.transaction(() => {
      for (const m of curatedAccessories) {
        const res = updateImage.run(m.image_url, m.model_name, alreadyLogged.c);
        updatedCount += res.changes;
      }
      if (alreadyLogged.c === 0) {
        db.prepare(`
          INSERT INTO audit_logs (
            user_id, actor_type, actor_label, action, entity_type, entity_id,
            old_value, new_value, description, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          null,
          'SYSTEM',
          'ReFuji Catalog Sync',
          'CATALOG_ACCESSORY_REAL_IMAGES_202611',
          'ProductModel',
          'ACCESSORY',
          JSON.stringify({ previousSvgCount: svgRowCount.c }),
          JSON.stringify({ updatedCount }),
          'Cập nhật ảnh sản phẩm chụp thật cho 16 mẫu phụ kiện thay cho ảnh SVG.',
          nowStr
        );
      }
    });

    syncTx();
    if (updatedCount > 0) {
      console.log(`✅ [Database] Đã cập nhật ảnh chụp thật cho ${updatedCount} phụ kiện!`);
    }
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật ảnh thật cho phụ kiện:', err);
  }
}
