// src/routes/admin.routes.ts
import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";

const router = Router();
const adminController = new AdminController();

// POST /api/admin/constituency - Admin creates a new constituency
router.post("/constituency", adminController.createConstituency);

// PATCH /api/admin/promote-ec/:userId - Admin promotes a user to EC
router.patch("/promote-ec/:userId", adminController.promoteUserToEC);

export default router;
