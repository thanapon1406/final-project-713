// src/repositories/party.repository.ts
import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

/**
 * Create a new party
 */
export const create = async (data: Prisma.PartyCreateInput) => {
  return await prisma.party.create({
    data,
  });
};

/**
 * Find party by ID
 */
export const findById = async (id: number) => {
  return await prisma.party.findUnique({
    where: { id },
  });
};

/**
 * Get all parties
 */
export const findAll = async () => {
  return await prisma.party.findMany({
    orderBy: { name: "asc" },
  });
};

/**
 * Get all parties with candidates and votes (for MP counting)
 */
export const findAllWithCandidates = async () => {
  return await prisma.party.findMany({
    include: {
      candidates: {
        include: {
          votes: true,
          constituency: true,
        },
      },
    },
  });
};

/**
 * Update a party
 */
export const update = async (
  id: number,
  data: { name?: string; logoUrl?: string; policy?: string },
) => {
  return await prisma.party.update({
    where: { id },
    data,
  });
};

/**
 * Delete a party
 */
export const remove = async (id: number) => {
  return await prisma.party.delete({
    where: { id },
  });
};

/**
 * Find party by name
 */
export const findByName = async (name: string) => {
  return await prisma.party.findFirst({
    where: { name },
  });
};

/**
 * Get all parties with candidate count
 */
export const findAllWithCandidateCount = async () => {
  return await prisma.party.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });
};

/**
 * Find party by ID with all candidates (for public viewing)
 * Includes user data since candidate inherits personal info from user
 */
export const findByIdWithCandidates = async (id: number) => {
  return await prisma.party.findUnique({
    where: { id },
    include: {
      candidates: {
        include: {
          user: true,
          constituency: true,
          votes: true,
        },
        orderBy: [
          { constituency: { province: "asc" } },
          { constituency: { districtNumber: "asc" } },
          { candidateNumber: "asc" },
        ],
      },
    },
  });
};
