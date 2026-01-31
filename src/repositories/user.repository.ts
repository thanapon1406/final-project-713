// src/repositories/user.repository.ts
import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

/**
 * Create a new user
 */
export const create = async (data: Prisma.UserCreateInput) => {
  return await prisma.user.create({
    data,
    include: { constituency: true },
  });
};

/**
 * Find user by ID
 */
export const findById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
    include: { constituency: true },
  });
};

/**
 * Find user by National ID
 */
export const findByNationalId = async (nationalId: string) => {
  return await prisma.user.findUnique({
    where: { nationalId },
    include: { constituency: true },
  });
};

/**
 * Update user role
 */
export const updateRole = async (
  id: number,
  role: Prisma.EnumRoleFieldUpdateOperationsInput | any,
) => {
  return await prisma.user.update({
    where: { id },
    data: { role },
    include: { constituency: true },
  });
};

/**
 * Get all users (for admin)
 */
export const findAll = async () => {
  return await prisma.user.findMany({
    include: { constituency: true },
    orderBy: { id: "asc" },
  });
};
