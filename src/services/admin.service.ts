// src/services/admin.service.ts
import { $Enums } from "../generated/prisma";
import * as userRepo from "../repositories/user.repository";
import * as electionRepo from "../repositories/election.repository";

export class AdminService {
  /**
   * สร้างเขตเลือกตั้งใหม่ (Admin only)
   */
  public createConstituency = async (
    province: string,
    districtNumber: number,
  ) => {
    // ตรวจสอบว่ามีเขตนี้อยู่แล้วหรือไม่
    const existing = await userRepo.findConstituencyByLocation(
      province,
      districtNumber,
    );

    if (existing) {
      throw new Error(
        `เขตเลือกตั้ง ${province} เขตที่ ${districtNumber} มีอยู่แล้ว`,
      );
    }

    const constituency = await electionRepo.createConstituency({
      province,
      districtNumber,
      isClosed: false,
    });

    return constituency;
  };

  /**
   * เปลี่ยน Role ของ User จาก Voter เป็น EC (Admin only)
   */
  public promoteUserToEC = async (userId: number) => {
    const user = await userRepo.findUserById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (user.role === $Enums.Role.EC) {
      throw new Error(`ผู้ใช้นี้เป็น EC อยู่แล้ว`);
    }

    if (user.role === $Enums.Role.ADMIN) {
      throw new Error(`ไม่สามารถเปลี่ยน Admin เป็น EC ได้`);
    }

    const updatedUser = await userRepo.updateUserRole(userId, $Enums.Role.EC);

    return updatedUser;
  };
}
