// src/services/auth.service.ts
import { $Enums } from "../generated/prisma";
import * as userRepo from "../repositories/user.repository";
import * as constituencyRepo from "../repositories/constituency.repository";

export class AuthService {
  /**
   * ลงทะเบียนผู้ใช้ใหม่
   */
  public registerUser = async (
    nationalId: string,
    firstName: string,
    lastName: string,
    address: string,
    province: string,
    districtNumber: number,
  ) => {
    // 1. ตรวจสอบว่ามี nationalId นี้ในระบบแล้วหรือยัง
    const existingUser = await userRepo.findByNationalId(nationalId);

    if (existingUser) {
      throw new Error(`เลขบัตรประชาชน ${nationalId} ถูกใช้งานแล้ว`);
    }

    // 2. หาเขตเลือกตั้งจาก province + districtNumber
    const constituency = await constituencyRepo.findByLocation(
      province,
      districtNumber,
    );

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง: ${province} เขต ${districtNumber}`);
    }

    // 3. สร้าง User โดยผูกกับ constituency.id ที่หาได้
    const user = await userRepo.create({
      nationalId,
      firstName,
      lastName,
      address,
      role: $Enums.Role.VOTER,
      constituency: {
        connect: { id: constituency.id },
      },
    });

    return user;
  };

  /**
   * เข้าสู่ระบบด้วยเลขบัตรประชาชน
   */
  public loginUser = async (nationalId: string) => {
    const user = await userRepo.findByNationalId(nationalId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้งานที่มีเลขบัตรประชาชน ${nationalId}`);
    }

    return user;
  };

  /**
   * ดึงข้อมูลโปรไฟล์ผู้ใช้
   */
  public getUserProfile = async (userId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    return user;
  };
}
