// Tính năng: Router tổng hợp phân hệ Quản trị Admin / Staff POS tách biệt, áp dụng RBAC guard thống nhất
import { Router } from 'express';
import { requireStaffOrAdmin } from './admin.middleware.js';
import { adminReportsRouter } from './reports.routes.js';
import { adminOperationsRouter } from './operations.routes.js';
import { adminInventoryRouter } from './inventory.routes.js';
import { adminFinanceRouter } from './finance.routes.js';
import { adminCustomersRouter } from './customers.routes.js';

export const adminRouter = Router();

adminRouter.use(requireStaffOrAdmin);
adminRouter.use('/', adminReportsRouter);
adminRouter.use('/', adminOperationsRouter);
adminRouter.use('/', adminInventoryRouter);
adminRouter.use('/', adminFinanceRouter);
adminRouter.use('/', adminCustomersRouter);
