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
