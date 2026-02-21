// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadImage, handleMulterError } from "../middlewares/upload.middleware";

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nationalId
 *               - laserCode
 *               - firstName
 *               - lastName
 *               - province
 *               - districtNumber
 *             properties:
 *               nationalId:
 *                 type: string
 *                 example: "1234567890123"
 *                 description: 13-digit Thai National ID
 *               laserCode:
 *                 type: string
 *                 example: "JT1234567890"
 *                 description: Laser code from the back of Thai ID card
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               address:
 *                 type: string
 *                 example: "123 Main Street"
 *               province:
 *                 type: string
 *                 example: "Bangkok"
 *               districtNumber:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: "User registered successfully"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with national ID and laser code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nationalId
 *               - laserCode
 *             properties:
 *               nationalId:
 *                 type: string
 *                 example: "1234567890123"
 *                 description: 13-digit Thai National ID
 *               laserCode:
 *                 type: string
 *                 example: "JT1234567890"
 *                 description: Laser code from the back of Thai ID card
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", authenticate, authController.getProfile);

/**
 * @swagger
 * /api/auth/upload-profile-image:
 *   post:
 *     summary: Upload user profile image
 *     description: Upload a profile image for the logged-in user. Image is stored in Supabase Storage. Max file size is 5MB. Accepted formats are jpg, jpeg, png, gif, webp.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB, jpg/png/gif/webp)
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
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
 *                   example: "อัปโหลดรูปโปรไฟล์สำเร็จ"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://xxx.supabase.co/storage/v1/object/public/image/users/uuid.jpg"
 *       400:
 *         description: Invalid file or no file uploaded
 *       401:
 *         description: Unauthorized - Please login
 */
router.post(
  "/upload-profile-image",
  authenticate,
  uploadImage,
  handleMulterError,
  authController.uploadProfileImage,
);

export default router;
