// src/repositories/candidate.repository.ts
import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

/**
 * Create a new candidate
 */
export const create = async (data: Prisma.CandidateCreateInput) => {
  return await prisma.candidate.create({
    data,
    include: {
      user: true,
      party: true,
      constituency: true,
    },
  });
};

/**
 * Find candidate by ID
 */
export const findById = async (id: number) => {
  return await prisma.candidate.findUnique({
    where: { id },
    include: {
      party: true,
      constituency: true,
    },
  });
};

/**
 * Find all candidates in a constituency
 */
export const findByConstituency = async (constituencyId: number) => {
  return await prisma.candidate.findMany({
    where: { constituencyId },
    include: {
      party: true,
      votes: true,
    },
    orderBy: {
      candidateNumber: "asc",
    },
  });
};
