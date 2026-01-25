// src/routes/admin.routes.ts
import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const adminController = new AdminController();

// ทุก route ใน admin ต้องล็อกอินและเป็น ADMIN เท่านั้น

/**
 * @swagger
 * /api/admin/constituency:
 *   post:
 *     summary: Create a new constituency
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - province
 *               - districtNumber
 *             properties:
 *               province:
 *                 type: string
 *                 example: "Bangkok"
 *               districtNumber:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Constituency created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Constituency created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Constituency'
 *       400:
 *         description: Invalid input or constituency already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post(
  "/constituency",
  authenticate,
  authorize("ADMIN"),
  adminController.createConstituency,
);

/**
 * @swagger
 * /api/admin/promote-ec/{userId}:
 *   patch:
 *     summary: Promote a user to EC (Election Commissioner) role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to promote
 *     responses:
 *       200:
 *         description: User promoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User promoted to EC successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.patch(
  "/promote-ec/:userId",
  authenticate,
  authorize("ADMIN"),
  adminController.promoteUserToEC,
);

export default router;
