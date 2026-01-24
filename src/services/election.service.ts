// src/services/election.service.ts
import { $Enums } from "../generated/prisma";
import * as electionRepo from "../repositories/election.repository";
import * as userRepo from "../repositories/user.repository";
import { prisma } from "../lib/prisma";

export class ElectionService {
  // ==================== ADMIN FEATURES ====================

  /**
   * สร้างเขตเลือกตั้งใหม่ (Admin only)
   */
  public createConstituency = async (
    province: string,
    districtNumber: number,
  ) => {
    // ตรวจสอบว่ามีเขตนี้อยู่แล้วหรือไม่
    const existing = await userRepo.findConstituencyByLocation(
      province,
      districtNumber,
    );

    if (existing) {
      throw new Error(
        `เขตเลือกตั้ง ${province} เขตที่ ${districtNumber} มีอยู่แล้ว`,
      );
    }

    const constituency = await electionRepo.createConstituency({
      province,
      districtNumber,
      isClosed: false,
    });

    return constituency;
  };

  /**
   * เปลี่ยน Role ของ User จาก Voter เป็น EC (Admin only)
   */
  public promoteUserToEC = async (userId: number) => {
    const user = await userRepo.findUserById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (user.role === $Enums.Role.EC) {
      throw new Error(`ผู้ใช้นี้เป็น EC อยู่แล้ว`);
    }

    if (user.role === $Enums.Role.ADMIN) {
      throw new Error(`ไม่สามารถเปลี่ยน Admin เป็น EC ได้`);
    }

    const updatedUser = await userRepo.updateUserRole(userId, $Enums.Role.EC);

    return updatedUser;
  };

  // ==================== EC FEATURES ====================

  /**
   * สร้างพรรคการเมืองใหม่ (EC only)
   */
  public createParty = async (
    name: string,
    logoUrl?: string,
    policy?: string,
  ) => {
    const party = await electionRepo.createParty({
      name,
      logoUrl,
      policy,
    });

    return party;
  };

  /**
   * เพิ่มผู้สมัคร (EC only)
   */
  public addCandidate = async (
    candidateNumber: number,
    title: string | null,
    firstName: string,
    lastName: string,
    imageUrl: string | null,
    policy: string | null,
    partyId: number,
    constituencyId: number,
  ) => {
    // 1. ตรวจสอบว่าพรรคมีอยู่จริง
    const party = await electionRepo.findPartyById(partyId);
    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${partyId}`);
    }

    // 2. ตรวจสอบว่าเขตเลือกตั้งมีอยู่จริง
    const constituency =
      await electionRepo.findConstituencyById(constituencyId);
    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    // 3. สร้างผู้สมัคร
    const candidate = await electionRepo.createCandidate({
      candidateNumber,
      title,
      firstName,
      lastName,
      imageUrl,
      policy,
      party: {
        connect: { id: partyId },
      },
      constituency: {
        connect: { id: constituencyId },
      },
    });

    return candidate;
  };

  /**
   * ปิดการลงคะแนนในเขต (EC only)
   */
  public closePoll = async (constituencyId: number) => {
    const constituency =
      await electionRepo.findConstituencyById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    if (constituency.isClosed) {
      throw new Error(`เขตเลือกตั้งนี้ปิดการลงคะแนนไปแล้ว`);
    }

    const updated = await electionRepo.closeConstituency(constituencyId);
    return updated;
  };

  // ==================== PUBLIC RESULTS ====================

  /**
   * ดูผลการเลือกตั้งในเขต
   * - ถ้าเปิดอยู่: แสดงรายชื่อผู้สมัคร แต่ซ่อนคะแนน
   * - ถ้าปิดแล้ว: แสดงรายชื่อผู้สมัครพร้อมคะแนน
   */
  public getConstituencyResults = async (constituencyId: number) => {
    const data = await electionRepo.getConstituencyResults(constituencyId);

    if (!data) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    const candidatesWithVotes = data.candidates.map((candidate) => {
      const voteCount = candidate.votes.length;

      return {
        id: candidate.id,
        candidateNumber: candidate.candidateNumber,
        title: candidate.title,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        imageUrl: candidate.imageUrl,
        policy: candidate.policy,
        party: {
          id: candidate.party.id,
          name: candidate.party.name,
          logoUrl: candidate.party.logoUrl,
        },
        // ถ้าเปิดอยู่ให้ซ่อนคะแนน
        voteCount: data.isClosed ? voteCount : null,
      };
    });

    return {
      constituency: {
        id: data.id,
        province: data.province,
        districtNumber: data.districtNumber,
        isClosed: data.isClosed,
      },
      candidates: candidatesWithVotes,
    };
  };

  /**
   * ดูภาพรวมพรรคทั้งหมด พร้อมจำนวน MPs
   * - นับเฉพาะเขตที่ปิดแล้ว
   * - แต่ละเขตเอาคนที่ได้คะแนนสูงสุด
   */
  public getPartyOverview = async () => {
    // ดึงพรรคทั้งหมด
    const parties = await prisma.party.findMany({
      include: {
        candidates: {
          include: {
            constituency: true,
            votes: true,
          },
        },
      },
    });

    // สำหรับแต่ละพรรค คำนวณจำนวน MPs
    const partiesWithMPs = await Promise.all(
      parties.map(async (party) => {
        // หาเขตที่ปิดแล้วทั้งหมด
        const closedConstituencies = await prisma.constituency.findMany({
          where: { isClosed: true },
          include: {
            candidates: {
              include: {
                votes: true,
                party: true,
              },
            },
          },
        });

        // นับจำนวนเขตที่พรรคนี้ชนะ
        let totalElectedMPs = 0;

        for (const constituency of closedConstituencies) {
          // หาผู้สมัครที่ได้คะแนนสูงสุดในเขตนี้
          let maxVotes = -1;
          let winnerPartyId = null;

          for (const candidate of constituency.candidates) {
            const voteCount = candidate.votes.length;
            if (voteCount > maxVotes) {
              maxVotes = voteCount;
              winnerPartyId = candidate.partyId;
            }
          }

          // ถ้าพรรคนี้ชนะในเขตนี้
          if (winnerPartyId === party.id) {
            totalElectedMPs++;
          }
        }

        return {
          id: party.id,
          name: party.name,
          logoUrl: party.logoUrl,
          policy: party.policy,
          totalElectedMPs,
        };
      }),
    );

    return partiesWithMPs;
  };
}
