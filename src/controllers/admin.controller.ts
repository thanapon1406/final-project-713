// src/controllers/admin.controller.ts
import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

export class AdminController {
  constructor(private adminService: AdminService = new AdminService()) {}

  /**
   * POST /api/admin/constituency
   * สร้างเขตเลือกตั้งใหม่ (Admin only)
   */
  createConstituency = async (req: Request, res: Response) => {
    try {
      const { province, districtNumber } = req.body;

      if (!province || !districtNumber) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุ province และ districtNumber",
        });
      }

      const constituency = await this.adminService.createConstituency(
        province,
        districtNumber,
      );

      res.status(201).json({
        success: true,
        message: "สร้างเขตเลือกตั้งสำเร็จ",
        data: constituency,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * PATCH /api/admin/promote-ec/:userId
   * เปลี่ยน Role ของ User จาก Voter เป็น EC (Admin only)
   */
  promoteUserToEC = async (req: Request, res: Response) => {
    try {
      const userIdParam = req.params.userId;
      const userId = parseInt(
        Array.isArray(userIdParam) ? userIdParam[0] : userIdParam,
      );

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "User ID ไม่ถูกต้อง",
        });
      }

      const user = await this.adminService.promoteUserToEC(userId);

      res.status(200).json({
        success: true,
        message: "เปลี่ยน Role เป็น EC สำเร็จ",
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}
