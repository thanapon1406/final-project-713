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
 * Includes user data since candidate inherits personal info from user
 */
export const findByConstituency = async (constituencyId: number) => {
  return await prisma.candidate.findMany({
    where: { constituencyId },
    include: {
      user: true,
      party: true,
      votes: true,
    },
    orderBy: {
      candidateNumber: "asc",
    },
  });
};

/**
 * Find all candidates with full user info
 */
export const findAllWithUserInfo = async () => {
  return await prisma.candidate.findMany({
    include: {
      user: true,
      party: true,
      constituency: true,
      votes: true,
    },
    orderBy: [
      { constituency: { province: "asc" } },
      { constituency: { districtNumber: "asc" } },
      { candidateNumber: "asc" },
    ],
  });
};

/**
 * Find candidates by constituency with full details
 */
export const findByConstituencyWithFullDetails = async (
  constituencyId: number,
) => {
  return await prisma.candidate.findMany({
    where: { constituencyId },
    include: {
      user: true,
      party: true,
      constituency: true,
      votes: true,
    },
    orderBy: { candidateNumber: "asc" },
  });
};

/**
 * Find candidate by user ID
 */
export const findByUserId = async (userId: number) => {
  return await prisma.candidate.findUnique({
    where: { userId },
    include: {
      party: true,
      constituency: true,
    },
  });
};

/**
 * Update candidate
 * Note: Personal info (title, firstName, lastName, imageUrl) is managed through User entity
 */
export const update = async (
  id: number,
  data: {
    candidateNumber?: number;
    policy?: string;
    partyId?: number;
  },
) => {
  return await prisma.candidate.update({
    where: { id },
    data,
    include: {
      user: true,
      party: true,
      constituency: true,
    },
  });
};

/**
 * Delete candidate
 */
export const remove = async (id: number) => {
  return await prisma.candidate.delete({
    where: { id },
  });
};

/**
 * Get next available candidate number in constituency
 */
export const getNextCandidateNumber = async (constituencyId: number) => {
  const lastCandidate = await prisma.candidate.findFirst({
    where: { constituencyId },
    orderBy: { candidateNumber: "desc" },
  });

  return lastCandidate ? lastCandidate.candidateNumber + 1 : 1;
};

/**
 * Check if candidate number is already used in constituency
 */
export const isCandidateNumberUsed = async (
  constituencyId: number,
  candidateNumber: number,
  excludeCandidateId?: number,
) => {
  const existing = await prisma.candidate.findFirst({
    where: {
      constituencyId,
      candidateNumber,
      ...(excludeCandidateId ? { NOT: { id: excludeCandidateId } } : {}),
    },
  });

  return !!existing;
};
