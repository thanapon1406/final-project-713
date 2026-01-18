// src/services/authService.ts
import { $Enums } from "../generated/prisma";
import * as userRepo from "../repositories/user.repository";

export class AuthService {
  public registerUser = async (
    nationalId: string,
    name: string,
    surname: string,
    address: string,
    province: string,
    districtNumber: number,
  ) => {
    // 1. หาเขตเลือกตั้งจาก จังหวัด + เขต
    const constituency = await userRepo.findConstituencyByLocation(
      province,
      districtNumber,
    );

    if (!constituency) {
      throw new Error(
        `ไม่พบเขตเลือกตั้ง: จ.${province} เขตที่ ${districtNumber}`,
      );
    }

    // 2. สร้าง User โดยผูกกับ constituency.id ที่หาได้
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
}
