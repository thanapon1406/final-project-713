// src/routes/admin.routes.ts
import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const adminController = new AdminController();

// ทุก route ใน admin ต้องล็อกอินและเป็น ADMIN เท่านั้น

// POST /api/admin/constituency - Admin creates a new constituency
router.post(
  "/constituency",
  authenticate,
  authorize("ADMIN"),
  adminController.createConstituency,
);

// PATCH /api/admin/promote-ec/:userId - Admin promotes a user to EC
router.patch(
  "/promote-ec/:userId",
  authenticate,
  authorize("ADMIN"),
  adminController.promoteUserToEC,
);

export default router;
