// src/repositories/election.repository.ts
import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

// ==================== CONSTITUENCY ====================

// สร้างเขตเลือกตั้งใหม่
export const createConstituency = async (
  data: Prisma.ConstituencyCreateInput,
) => {
  return await prisma.constituency.create({
    data,
  });
};

// หาเขตเลือกตั้งโดย ID
export const findConstituencyById = async (id: number) => {
  return await prisma.constituency.findUnique({
    where: { id },
  });
};

// ปิดการลงคะแนนในเขตเลือกตั้ง
export const closeConstituency = async (id: number) => {
  return await prisma.constituency.update({
    where: { id },
    data: { isClosed: true },
  });
};

// ดึงรายการเขตเลือกตั้งทั้งหมด
export const findAllConstituencies = async () => {
  return await prisma.constituency.findMany({
    orderBy: [{ province: "asc" }, { districtNumber: "asc" }],
  });
};

// ดึงรายการเขตเลือกตั้งตามจังหวัด
export const findConstituenciesByProvince = async (province: string) => {
  return await prisma.constituency.findMany({
    where: { province },
    orderBy: { districtNumber: "asc" },
  });
};

// ==================== PARTY ====================

// สร้างพรรคการเมืองใหม่
export const createParty = async (data: Prisma.PartyCreateInput) => {
  return await prisma.party.create({
    data,
  });
};

// หาพรรคโดย ID
export const findPartyById = async (id: number) => {
  return await prisma.party.findUnique({
    where: { id },
  });
};

// ดึงข้อมูลพรรคทั้งหมดพร้อมนับ MPs
export const getAllPartiesWithMPCount = async () => {
  // ดึงข้อมูลพรรคทั้งหมด
  const parties = await prisma.party.findMany({
    include: {
      candidates: {
        include: {
          votes: true,
          constituency: true,
        },
      },
    },
  });

  // คำนวณจำนวน MPs ของแต่ละพรรค
  const partiesWithMPCount = parties.map((party) => {
    // หาเขตที่ปิดแล้ว
    const closedConstituencies = new Set<number>();
    party.candidates.forEach((candidate) => {
      if (candidate.constituency.isClosed) {
        closedConstituencies.add(candidate.constituencyId);
      }
    });

    // นับ MPs (ผู้ชนะในแต่ละเขตที่ปิดแล้ว)
    let totalElectedMPs = 0;
    closedConstituencies.forEach((constituencyId) => {
      // หาผู้สมัครทั้งหมดในเขตนั้น
      const candidatesInConstituency = party.candidates.filter(
        (c) => c.constituencyId === constituencyId,
      );

      // นับคะแนนของแต่ละคน
      candidatesInConstituency.forEach((candidate) => {
        const voteCount = candidate.votes.length;

        // ถ้าคนนี้มีคะแนนสูงสุดในเขตนี้ก็ได้เป็น MP
        // (ในความเป็นจริงต้องเช็คว่าเป็นคนที่มีคะแนนสูงสุดจริงๆ)
        // ที่นี่เราจะทำใน service layer แทน
      });
    });

    return {
      id: party.id,
      name: party.name,
      logoUrl: party.logoUrl,
      policy: party.policy,
      totalElectedMPs,
    };
  });

  return partiesWithMPCount;
};

// ==================== CANDIDATE ====================

// สร้างผู้สมัครใหม่
export const createCandidate = async (data: Prisma.CandidateCreateInput) => {
  return await prisma.candidate.create({
    data,
    include: {
      user: true,
      party: true,
      constituency: true,
    },
  });
};

// หาผู้สมัครทั้งหมดในเขตเลือกตั้ง (พร้อมข้อมูลพรรค)
export const findCandidatesByConstituency = async (constituencyId: number) => {
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

// หาผู้สมัครโดย ID
export const findCandidateById = async (id: number) => {
  return await prisma.candidate.findUnique({
    where: { id },
    include: {
      party: true,
      constituency: true,
    },
  });
};

// ==================== RESULTS ====================

// ดึงผลการเลือกตั้งในเขต (พร้อมนับคะแนน)
export const getConstituencyResults = async (constituencyId: number) => {
  const constituency = await prisma.constituency.findUnique({
    where: { id: constituencyId },
    include: {
      candidates: {
        include: {
          party: true,
          votes: true,
        },
        orderBy: {
          candidateNumber: "asc",
        },
      },
    },
  });

  return constituency;
};
