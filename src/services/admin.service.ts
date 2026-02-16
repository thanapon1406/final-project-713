// src/services/admin.service.ts
import { $Enums } from "../generated/prisma";
import * as userRepo from "../repositories/user.repository";
import * as constituencyRepo from "../repositories/constituency.repository";

export class AdminService {
  /**
   * Get all users (Admin only)
   */
  public getAllUsers = async () => {
    return await userRepo.findAll();
  };

  /**
   * สร้างเขตเลือกตั้งใหม่ (Admin only)
   */
  public createConstituency = async (
    province: string,
    districtNumber: number,
  ) => {
    // ตรวจสอบว่ามีเขตนี้อยู่แล้วหรือไม่
    const existing = await constituencyRepo.findByLocation(
      province,
      districtNumber,
    );

    if (existing) {
      throw new Error(
        `เขตเลือกตั้ง ${province} เขตที่ ${districtNumber} มีอยู่แล้ว`,
      );
    }

    const constituency = await constituencyRepo.create({
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
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (user.role === $Enums.Role.EC) {
      throw new Error(`ผู้ใช้นี้เป็น EC อยู่แล้ว`);
    }

    if (user.role === $Enums.Role.ADMIN) {
      throw new Error(`ไม่สามารถเปลี่ยน Admin เป็น EC ได้`);
    }

    const updatedUser = await userRepo.updateRole(userId, $Enums.Role.EC);

    return updatedUser;
  };

  /**
   * ดึงรายการเขตเลือกตั้งทั้งหมด (Admin only)
   */
  public getAllConstituencies = async () => {
    return await constituencyRepo.findAllWithCandidateCount();
  };

  /**
   * ดึงเขตเลือกตั้งตาม ID (Admin only)
   */
  public getConstituencyById = async (id: number) => {
    const constituency = await constituencyRepo.findById(id);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${id}`);
    }

    return constituency;
  };

  /**
   * อัปเดตเขตเลือกตั้ง (Admin only)
   */
  public updateConstituency = async (
    id: number,
    data: { province?: string; districtNumber?: number; isClosed?: boolean },
  ) => {
    const constituency = await constituencyRepo.findById(id);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${id}`);
    }

    // ถ้ามีการเปลี่ยน province หรือ districtNumber ต้องตรวจสอบว่าไม่ซ้ำ
    if (data.province || data.districtNumber) {
      const newProvince = data.province || constituency.province;
      const newDistrictNumber =
        data.districtNumber || constituency.districtNumber;

      const existing = await constituencyRepo.findByLocation(
        newProvince,
        newDistrictNumber,
      );

      if (existing && existing.id !== id) {
        throw new Error(
          `เขตเลือกตั้ง ${newProvince} เขตที่ ${newDistrictNumber} มีอยู่แล้ว`,
        );
      }
    }

    return await constituencyRepo.update(id, data);
  };

  /**
   * ลบเขตเลือกตั้ง (Admin only)
   */
  public deleteConstituency = async (id: number) => {
    const constituency = await constituencyRepo.findById(id);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${id}`);
    }

    return await constituencyRepo.remove(id);
  };

  /**
   * เปิด/ปิดการลงคะแนนในเขต (Admin only)
   */
  public toggleConstituencyStatus = async (id: number) => {
    const constituency = await constituencyRepo.findById(id);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${id}`);
    }

    return await constituencyRepo.update(id, {
      isClosed: !constituency.isClosed,
    });
  };
}
