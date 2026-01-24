// src/repositories/vote.repository.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

// ตรวจสอบว่า User ลงคะแนนไปแล้วหรือยัง
export const findVoteByUserId = async (userId: number) => {
  return await prisma.vote.findUnique({
    where: { userId },
    include: {
      candidate: {
        include: {
          party: true,
        },
      },
    },
  });
};

// สร้างหรืออัพเดทคะแนนเสียง (upsert)
export const upsertVote = async (userId: number, candidateId: number) => {
  return await prisma.vote.upsert({
    where: { userId },
    update: {
      candidateId,
      timestamp: new Date(),
    },
    create: {
      userId,
      candidateId,
    },
    include: {
      candidate: {
        include: {
          party: true,
          constituency: true,
        },
      },
      user: {
        include: {
          constituency: true,
        },
      },
    },
  });
};

// นับจำนวนคะแนนของผู้สมัครแต่ละคน
export const countVotesByCandidate = async (candidateId: number) => {
  return await prisma.vote.count({
    where: { candidateId },
  });
};
