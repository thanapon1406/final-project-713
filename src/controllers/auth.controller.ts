// src/controllers/authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private authService: AuthService = new AuthService()) {}
  public register = async (req: Request, res: Response) => {
    try {
      // รับค่าจาก Body
      const { nationalId, name, surname, address, province, districtNumber } =
        req.body;

      // เรียก Service เพื่อทำงาน
      const newUser = await this.authService.registerUser(
        nationalId,
        name,
        surname,
        address,
        province,
        districtNumber,
      );

      // ส่งผลลัพธ์กลับ
      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: newUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}
