// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import jwt from "jsonwebtoken";

export class AuthController {
  constructor(private authService: AuthService = new AuthService()) {}

  /**
   * POST /api/auth/register
   * ลงทะเบียนผู้ใช้ใหม่ในระบบ
   */
  public register = async (req: Request, res: Response) => {
    try {
      // รับค่าจาก Body
      const {
        nationalId,
        laserCode,
        title,
        firstName,
        lastName,
        address,
        imageUrl,
        province,
        districtNumber,
      } = req.body;

      // Validate required fields
      if (
        !nationalId ||
        !laserCode ||
        !firstName ||
        !lastName ||
        !province ||
        !districtNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            "กรุณาระบุข้อมูลให้ครบถ้วน (nationalId, laserCode, firstName, lastName, province, districtNumber)",
        });
      }

      // เรียก Service เพื่อทำงาน
      const newUser = await this.authService.registerUser(
        nationalId,
        laserCode,
        title,
        firstName,
        lastName,
        address,
        imageUrl,
        province,
        parseInt(districtNumber),
      );

      // สร้าง JWT Token
      const token = jwt.sign(
        {
          id: newUser.id,
          nationalId: newUser.nationalId,
          role: newUser.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }, // Token มีอายุ 7 วัน
      );

      // ส่งผลลัพธ์กลับพร้อม Token
      res.status(201).json({
        success: true,
        message: "ลงทะเบียนสำเร็จ",
        data: {
          user: {
            id: newUser.id,
            nationalId: newUser.nationalId,
            title: newUser.title,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            imageUrl: newUser.imageUrl,
            role: newUser.role,
            constituency: newUser.constituency,
          },
          token,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /api/auth/login
   * เข้าสู่ระบบด้วยเลขบัตรประชาชน
   */
  public login = async (req: Request, res: Response) => {
    try {
      const { nationalId, laserCode } = req.body;

      if (!nationalId || !laserCode) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุเลขบัตรประชาชนและ Laser Code",
        });
      }

      // เรียก Service เพื่อหาผู้ใช้
      const user = await this.authService.loginUser(nationalId, laserCode);

      // สร้าง JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          nationalId: user.nationalId,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" },
      );

      res.status(200).json({
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        data: {
          user: {
            id: user.id,
            nationalId: user.nationalId,
            title: user.title,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            constituency: user.constituency,
          },
          token,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/auth/me
   * ดูข้อมูลผู้ใช้ที่ล็อกอินอยู่
   * ต้องใช้ authenticate middleware
   */
  public getProfile = async (req: Request, res: Response) => {
    try {
      // req.user มาจาก authenticate middleware
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const user = await this.authService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          nationalId: user.nationalId,
          title: user.title,
          firstName: user.firstName,
          lastName: user.lastName,
          address: user.address,
          imageUrl: user.imageUrl,
          role: user.role,
          constituency: user.constituency,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * PUT /api/auth/profile
   * แก้ไขข้อมูลส่วนตัว
   */
  public updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const { title, firstName, lastName, address, imageUrl } = req.body;

      const user = await this.authService.updateProfile(userId, {
        title,
        firstName,
        lastName,
        address,
        imageUrl,
      });

      res.status(200).json({
        success: true,
        message: "อัปเดตข้อมูลสำเร็จ",
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /api/auth/upload-profile-image
   * อัปโหลดรูปโปรไฟล์ผู้ใช้
   */
  public uploadProfileImage = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "กรุณาเลือกไฟล์รูปภาพ",
        });
      }

      const result = await this.authService.uploadProfileImage(userId, req.file);

      res.status(200).json({
        success: true,
        message: "อัปโหลดรูปโปรไฟล์สำเร็จ",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}
