// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    nationalId: string;
    role: string;
  };
}

/**
 * Middleware สำหรับตรวจสอบว่าผู้ใช้ล็อกอินหรือยัง
 * ตรวจสอบ JWT Token จาก Authorization header
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // ดึง token จาก header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "กรุณาล็อกอินเข้าสู่ระบบ",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "กรุณาล็อกอินเข้าสู่ระบบ",
      });
    }

    // ตรวจสอบ JWT Secret
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: number;
      nationalId: string;
      role: string;
    };

    // เพิ่มข้อมูล user เข้าไปใน request object
    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token หมดอายุแล้ว กรุณาล็อกอินใหม่",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token ไม่ถูกต้อง",
      });
    }

    return res.status(401).json({
      success: false,
      message: "การยืนยันตัวตนล้มเหลว",
    });
  }
};
