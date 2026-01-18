// src/repositories/userRepository.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

// ฟังก์ชันสร้าง User
export const createUser = async (data: Prisma.UserCreateInput) => {
  return await prisma.user.create({
    data,
    include: { constituency: true }, // ให้ Return ข้อมูลเขตกลับมาด้วย
  });
};

// ฟังก์ชันหาเขตเลือกตั้ง
export const findConstituencyByLocation = async (
  province: string,
  districtNumber: number,
) => {
  return await prisma.constituency.findUnique({
    where: {
      province_districtNumber: {
        province: province,
        districtNumber: districtNumber,
      },
    },
  });
};
