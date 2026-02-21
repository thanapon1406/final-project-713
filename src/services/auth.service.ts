// src/services/auth.service.ts
import { $Enums } from "../generated/prisma";
import * as userRepo from "../repositories/user.repository";
import * as constituencyRepo from "../repositories/constituency.repository";
import { uploadToSupabase, deleteFromSupabase } from "./upload.service";

export class AuthService {
  /**
   * ลงทะเบียนผู้ใช้ใหม่
   */
  public registerUser = async (
    nationalId: string,
    laserCode: string,
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
      laserCode,
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
   * เข้าสู่ระบบด้วยเลขบัตรประชาชนและ Laser Code
   */
  public loginUser = async (nationalId: string, laserCode: string) => {
    const user = await userRepo.findByNationalId(nationalId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้งานที่มีเลขบัตรประชาชน ${nationalId}`);
    }

    // Verify laser code
    if (user.laserCode !== laserCode) {
      throw new Error(`Laser Code ไม่ถูกต้อง`);
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

  /**
   * อัปโหลดรูปโปรไฟล์ผู้ใช้
   */
  public uploadProfileImage = async (
    userId: number,
    file: Express.Multer.File,
  ) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    // Delete old image if exists
    if (user.imageUrl) {
      await deleteFromSupabase(user.imageUrl);
    }

    // Upload new image
    const imageUrl = await uploadToSupabase(file, "users");

    // Update user with new image URL
    const updatedUser = await userRepo.update(userId, { imageUrl });

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      imageUrl: updatedUser.imageUrl,
    };
  };
}
