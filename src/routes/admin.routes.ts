// src/routes/admin.routes.ts
import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const adminController = new AdminController();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  "/users",
  authenticate,
  authorize("ADMIN"),
  adminController.getAllUsers,
);

/**
 * @swagger
 * /api/admin/user/{id}:
 *   get:
 *     summary: Get a user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  "/user/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.getUserById,
);

/**
 * @swagger
 * /api/admin/user/{id}:
 *   put:
 *     summary: Update a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               address:
 *                 type: string
 *               constituencyId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.put(
  "/user/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.updateUser,
);

/**
 * @swagger
 * /api/admin/demote-voter/{userId}:
 *   patch:
 *     summary: Demote EC to Voter role (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to demote
 *     responses:
 *       200:
 *         description: User demoted successfully
 *       400:
 *         description: Invalid input or user not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.patch(
  "/demote-voter/:userId",
  authenticate,
  authorize("ADMIN"),
  adminController.demoteECToVoter,
);

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

/**
 * @swagger
 * /api/admin/constituencies:
 *   get:
 *     summary: Get all constituencies (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Constituencies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Constituency'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  "/constituencies",
  authenticate,
  authorize("ADMIN"),
  adminController.getAllConstituencies,
);

/**
 * @swagger
 * /api/admin/constituency/{id}:
 *   get:
 *     summary: Get a constituency by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Constituency ID
 *     responses:
 *       200:
 *         description: Constituency retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Constituency'
 *       400:
 *         description: Invalid constituency ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  "/constituency/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.getConstituencyById,
);

/**
 * @swagger
 * /api/admin/constituency/{id}:
 *   put:
 *     summary: Update a constituency (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Constituency ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               province:
 *                 type: string
 *                 example: "Bangkok"
 *               districtNumber:
 *                 type: integer
 *                 example: 1
 *               isClosed:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Constituency updated successfully
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
 *                   example: "อัปเดตเขตเลือกตั้งสำเร็จ"
 *                 data:
 *                   $ref: '#/components/schemas/Constituency'
 *       400:
 *         description: Invalid input or constituency not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.put(
  "/constituency/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.updateConstituency,
);

/**
 * @swagger
 * /api/admin/constituency/{id}:
 *   delete:
 *     summary: Delete a constituency (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Constituency ID
 *     responses:
 *       200:
 *         description: Constituency deleted successfully
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
 *                   example: "ลบเขตเลือกตั้งสำเร็จ"
 *       400:
 *         description: Invalid constituency ID or constituency not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.delete(
  "/constituency/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.deleteConstituency,
);

/**
 * @swagger
 * /api/admin/constituency/{id}/toggle-status:
 *   patch:
 *     summary: Toggle constituency voting status (open/close) (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Constituency ID
 *     responses:
 *       200:
 *         description: Constituency status toggled successfully
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
 *                   example: "ปิดการลงคะแนนสำเร็จ"
 *                 data:
 *                   $ref: '#/components/schemas/Constituency'
 *       400:
 *         description: Invalid constituency ID or constituency not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.patch(
  "/constituency/:id/toggle-status",
  authenticate,
  authorize("ADMIN"),
  adminController.toggleConstituencyStatus,
);

export default router;
