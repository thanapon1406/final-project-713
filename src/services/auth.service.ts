// src/services/auth.service.ts
import { $Enums } from "../generated/prisma";
import * as userRepo from "../repositories/user.repository";

export class AuthService {
  /**
   * ลงทะเบียนผู้ใช้ใหม่
   */
  public registerUser = async (
    nationalId: string,
    name: string,
    surname: string,
    address: string,
    province: string,
    districtNumber: number,
  ) => {
    // 1. ตรวจสอบว่ามี nationalId นี้ในระบบแล้วหรือยัง
    const existingUser = await userRepo.findUserByNationalId(nationalId);

    if (existingUser) {
      throw new Error(`เลขบัตรประชาชน ${nationalId} ถูกใช้งานแล้ว`);
    }

    // 2. หาเขตเลือกตั้งจาก จังหวัด + เขต
    const constituency = await userRepo.findConstituencyByLocation(
      province,
      districtNumber,
    );

    if (!constituency) {
      throw new Error(
        `ไม่พบเขตเลือกตั้ง: จ.${province} เขตที่ ${districtNumber}`,
      );
    }

    // 3. สร้าง User โดยผูกกับ constituency.id ที่หาได้
    const user = await userRepo.createUser({
      nationalId,
      firstName: name,
      lastName: surname,
      address,
      role: $Enums.Role.VOTER, // Default Role
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
    const user = await userRepo.findUserByNationalId(nationalId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้งานที่มีเลขบัตรประชาชน ${nationalId}`);
    }

    return user;
  };

  /**
   * ดึงข้อมูลโปรไฟล์ผู้ใช้
   */
  public getUserProfile = async (userId: number) => {
    const user = await userRepo.findUserById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    return user;
  };
}
