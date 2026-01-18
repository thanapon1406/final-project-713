// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();
const authController = new AuthController();

// POST /api/auths - Cast or update a auth
router.post("/register", authController.register);

export default router;
