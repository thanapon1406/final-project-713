// src/services/election.service.ts
import * as userRepo from "../repositories/user.repository";
import * as constituencyRepo from "../repositories/constituency.repository";
import * as partyRepo from "../repositories/party.repository";
import * as candidateRepo from "../repositories/candidate.repository";

export class ElectionService {
  /**
   * สร้างพรรคการเมืองใหม่ (EC only)
   */
  public createParty = async (data: {
    name: string;
    logoUrl?: string;
    policy?: string;
  }) => {
    if (!data.name || data.name.trim() === "") {
      throw new Error("กรุณาระบุชื่อพรรค");
    }

    // ตรวจสอบชื่อพรรคซ้ำ
    const existing = await partyRepo.findByName(data.name.trim());
    if (existing) {
      throw new Error(`พรรค "${data.name}" มีอยู่แล้ว`);
    }

    return await partyRepo.create({
      name: data.name.trim(),
      logoUrl: data.logoUrl,
      policy: data.policy,
    });
  };

  /**
   * เพิ่มผู้สมัคร (EC only)
   */
  public addCandidate = async (data: {
    candidateNumber: number;
    title?: string | null;
    firstName: string;
    lastName: string;
    imageUrl?: string | null;
    policy?: string | null;
    partyId: number;
    constituencyId: number;
    userId: number;
  }) => {
    // Validation
    if (
      !data.candidateNumber ||
      !data.firstName ||
      !data.lastName ||
      !data.partyId ||
      !data.constituencyId ||
      !data.userId
    ) {
      throw new Error(
        "กรุณากระบุข้อมูลที่จำเป็น: candidateNumber, firstName, lastName, partyId, constituencyId, userId",
      );
    }

    const user = await userRepo.findById(data.userId);
    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${data.userId}`);
    }

    if (user.constituencyId !== data.constituencyId) {
      throw new Error(
        `ผู้ใช้ไม่ได้อาศัยอยู่ในเขตเลือกตั้ง ID: ${data.constituencyId} ไม่สามารถลงสมัครในเขตนี้ได้`,
      );
    }

    // ตรวจสอบว่า user นี้เป็นผู้สมัครอยู่แล้วหรือไม่
    const existingCandidate = await candidateRepo.findByUserId(data.userId);
    if (existingCandidate) {
      throw new Error(`ผู้ใช้นี้เป็นผู้สมัครอยู่แล้ว`);
    }

    const party = await partyRepo.findById(data.partyId);
    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${data.partyId}`);
    }

    const constituency = await constituencyRepo.findById(data.constituencyId);
    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${data.constituencyId}`);
    }

    // ตรวจสอบหมายเลขผู้สมัครไม่ซ้ำในเขต
    const isNumberUsed = await candidateRepo.isCandidateNumberUsed(
      data.constituencyId,
      data.candidateNumber,
    );
    if (isNumberUsed) {
      throw new Error(
        `หมายเลขผู้สมัคร ${data.candidateNumber} ถูกใช้ในเขตนี้แล้ว`,
      );
    }

    return await candidateRepo.create({
      candidateNumber: data.candidateNumber,
      title: data.title || null,
      firstName: data.firstName,
      lastName: data.lastName,
      imageUrl: data.imageUrl || null,
      policy: data.policy || null,
      user: { connect: { id: data.userId } },
      party: { connect: { id: data.partyId } },
      constituency: { connect: { id: data.constituencyId } },
    });
  };

  /**
   * ปิดการลงคะแนนในเขต (EC only)
   */
  public closePoll = async (constituencyId: number) => {
    const constituency = await constituencyRepo.findById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    if (constituency.isClosed) {
      throw new Error(`เขตเลือกตั้งนี้ปิดการลงคะแนนไปแล้ว`);
    }

    return await constituencyRepo.close(constituencyId);
  };

  /**
   * ดึงรายการเขตเลือกตั้งทั้งหมด หรือกรองตามจังหวัด
   */
  public getConstituencies = async (filters?: { province?: string }) => {
    if (filters?.province) {
      return await constituencyRepo.findByProvince(filters.province);
    }
    return await constituencyRepo.findAll();
  };

  /**
   * ดูผลการเลือกตั้งในเขต
   */
  public getConstituencyResults = async (constituencyId: number) => {
    const data = await constituencyRepo.findWithResults(constituencyId);

    if (!data) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    const candidatesWithVotes = data.candidates.map((candidate) => ({
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
      voteCount: data.isClosed ? candidate.votes.length : null,
    }));

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
   */
  public getPartyOverview = async () => {
    const parties = await partyRepo.findAllWithCandidates();
    const allConstituencies = await constituencyRepo.findAll();
    const closedConstituencyIds = allConstituencies
      .filter((c) => c.isClosed)
      .map((c) => c.id);

    // Get closed constituencies with full data
    const closedConstituenciesData = await Promise.all(
      closedConstituencyIds.map((id) => constituencyRepo.findWithResults(id)),
    );

    return parties.map((party) => {
      let totalElectedMPs = 0;

      for (const constituency of closedConstituenciesData) {
        if (!constituency) continue;

        let maxVotes = -1;
        let winnerPartyId: number | null = null;

        for (const candidate of constituency.candidates) {
          const voteCount = candidate.votes.length;
          if (voteCount > maxVotes) {
            maxVotes = voteCount;
            winnerPartyId = candidate.partyId;
          }
        }

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
    });
  };

  /**
   * ดึงรายการพรรคทั้งหมด (EC only)
   */
  public getAllParties = async () => {
    return await partyRepo.findAllWithCandidateCount();
  };

  /**
   * ดึงพรรคตาม ID (EC only)
   */
  public getPartyById = async (id: number) => {
    const party = await partyRepo.findById(id);

    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${id}`);
    }

    return party;
  };

  /**
   * อัปเดตพรรค (EC only)
   */
  public updateParty = async (
    id: number,
    data: { name?: string; logoUrl?: string; policy?: string },
  ) => {
    const party = await partyRepo.findById(id);

    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${id}`);
    }

    // ถ้ามีการเปลี่ยนชื่อพรรค ต้องตรวจสอบว่าไม่ซ้ำ
    if (data.name && data.name !== party.name) {
      const existing = await partyRepo.findByName(data.name);

      if (existing) {
        throw new Error(`พรรค "${data.name}" มีอยู่แล้ว`);
      }
    }

    return await partyRepo.update(id, data);
  };

  /**
   * ลบพรรค (EC only)
   */
  public deleteParty = async (id: number) => {
    const party = await partyRepo.findById(id);

    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${id}`);
    }

    return await partyRepo.remove(id);
  };

  // ==================== EC CANDIDATE MANAGEMENT ====================

  /**
   * ดึงรายชื่อผู้มีสิทธิ์เลือกตั้ง พร้อมข้อมูลผู้สมัคร (EC only)
   * @param filters - ต้องระบุ constituencyId หรือ province
   */
  public getEligibleVoters = async (filters: {
    constituencyId?: number;
    province?: string;
  }) => {
    if (!filters.constituencyId && !filters.province) {
      throw new Error("กรุณาระบุ constituencyId หรือ province");
    }

    if (filters.constituencyId) {
      return await this.getEligibleVotersByConstituency(filters.constituencyId);
    }

    return await this.getEligibleVotersByProvince(filters.province!);
  };

  /**
   * ดึงรายชื่อผู้มีสิทธิ์เลือกตั้งในเขต พร้อมข้อมูลผู้สมัคร (EC only)
   */
  public getEligibleVotersByConstituency = async (constituencyId: number) => {
    const constituency = await constituencyRepo.findById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    const users =
      await userRepo.findByConstituencyWithCandidateInfo(constituencyId);

    return {
      constituency: {
        id: constituency.id,
        province: constituency.province,
        districtNumber: constituency.districtNumber,
        isClosed: constituency.isClosed,
      },
      voters: users.map((user) => ({
        id: user.id,
        nationalId: user.nationalId,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        role: user.role,
        isCandidate: !!user.candidateProfile,
        candidateInfo: user.candidateProfile
          ? {
              id: user.candidateProfile.id,
              candidateNumber: user.candidateProfile.candidateNumber,
              title: user.candidateProfile.title,
              imageUrl: user.candidateProfile.imageUrl,
              policy: user.candidateProfile.policy,
              party: user.candidateProfile.party,
            }
          : null,
      })),
    };
  };

  /**
   * ดึงรายชื่อผู้มีสิทธิ์เลือกตั้งตามจังหวัด พร้อมข้อมูลผู้สมัคร (EC only)
   */
  public getEligibleVotersByProvince = async (province: string) => {
    const users = await userRepo.findByProvince(province);

    return users.map((user) => ({
      id: user.id,
      nationalId: user.nationalId,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      role: user.role,
      constituency: user.constituency,
      isCandidate: !!user.candidateProfile,
      candidateInfo: user.candidateProfile
        ? {
            id: user.candidateProfile.id,
            candidateNumber: user.candidateProfile.candidateNumber,
            title: user.candidateProfile.title,
            imageUrl: user.candidateProfile.imageUrl,
            policy: user.candidateProfile.policy,
            party: user.candidateProfile.party,
          }
        : null,
    }));
  };

  /**
   * ดึงรายการผู้สมัคร หรือกรองตามเขต (EC only)
   */
  public getCandidates = async (filters?: { constituencyId?: number }) => {
    if (filters?.constituencyId) {
      return await this.getCandidatesByConstituency(filters.constituencyId);
    }
    return await candidateRepo.findAllWithUserInfo();
  };

  /**
   * ดึงรายการผู้สมัครทั้งหมดพร้อมข้อมูลผู้ใช้ (EC only)
   */
  public getAllCandidates = async () => {
    return await candidateRepo.findAllWithUserInfo();
  };

  /**
   * ดึงรายการผู้สมัครในเขตพร้อมข้อมูลผู้ใช้ (EC only)
   */
  public getCandidatesByConstituency = async (constituencyId: number) => {
    const constituency = await constituencyRepo.findById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    const candidates =
      await candidateRepo.findByConstituencyWithFullDetails(constituencyId);

    return {
      constituency: {
        id: constituency.id,
        province: constituency.province,
        districtNumber: constituency.districtNumber,
        isClosed: constituency.isClosed,
      },
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        candidateNumber: candidate.candidateNumber,
        title: candidate.title,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        imageUrl: candidate.imageUrl,
        policy: candidate.policy,
        party: candidate.party,
        user: {
          id: candidate.user.id,
          nationalId: candidate.user.nationalId,
          firstName: candidate.user.firstName,
          lastName: candidate.user.lastName,
        },
        voteCount: candidate.votes.length,
      })),
    };
  };

  /**
   * ดึงข้อมูลผู้สมัครตาม ID (EC only)
   */
  public getCandidateById = async (candidateId: number) => {
    const candidate = await candidateRepo.findById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    return candidate;
  };

  /**
   * อัปเดตผู้สมัคร (EC only)
   */
  public updateCandidate = async (
    candidateId: number,
    data: {
      candidateNumber?: number;
      title?: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
      policy?: string;
      partyId?: number;
    },
  ) => {
    const candidate = await candidateRepo.findById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    // ตรวจสอบว่าหมายเลขผู้สมัครไม่ซ้ำในเขต
    if (data.candidateNumber && data.candidateNumber !== candidate.candidateNumber) {
      const isUsed = await candidateRepo.isCandidateNumberUsed(
        candidate.constituencyId,
        data.candidateNumber,
        candidateId,
      );

      if (isUsed) {
        throw new Error(
          `หมายเลขผู้สมัคร ${data.candidateNumber} ถูกใช้ในเขตนี้แล้ว`,
        );
      }
    }

    // ตรวจสอบว่าพรรคมีอยู่จริง
    if (data.partyId) {
      const party = await partyRepo.findById(data.partyId);
      if (!party) {
        throw new Error(`ไม่พบพรรค ID: ${data.partyId}`);
      }
    }

    return await candidateRepo.update(candidateId, data);
  };

  /**
   * ลบผู้สมัคร (EC only)
   */
  public deleteCandidate = async (candidateId: number) => {
    const candidate = await candidateRepo.findById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    return await candidateRepo.remove(candidateId);
  };

  /**
   * ดึงหมายเลขผู้สมัครถัดไปในเขต (EC only)
   */
  public getNextCandidateNumber = async (constituencyId: number) => {
    const constituency = await constituencyRepo.findById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    return await candidateRepo.getNextCandidateNumber(constituencyId);
  };

  /**
   * ดึงรายการจังหวัดทั้งหมดที่มีเขตเลือกตั้ง (EC only)
   */
  public getAllProvinces = async () => {
    const constituencies = await constituencyRepo.findAll();
    const provinces = [...new Set(constituencies.map((c) => c.province))];
    return provinces.sort();
  };
}
