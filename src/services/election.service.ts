// src/services/election.service.ts
import * as userRepo from "../repositories/user.repository";
import * as constituencyRepo from "../repositories/constituency.repository";
import * as partyRepo from "../repositories/party.repository";
import * as candidateRepo from "../repositories/candidate.repository";

export class ElectionService {
  /**
   * สร้างพรรคการเมืองใหม่ (EC only)
   */
  public createParty = async (
    name: string,
    logoUrl?: string,
    policy?: string,
  ) => {
    return await partyRepo.create({ name, logoUrl, policy });
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
    userId: number,
  ) => {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (user.constituencyId !== constituencyId) {
      throw new Error(
        `ผู้ใช้ไม่ได้อาศัยอยู่ในเขตเลือกตั้ง ID: ${constituencyId} ไม่สามารถลงสมัครในเขตนี้ได้`,
      );
    }

    const party = await partyRepo.findById(partyId);
    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${partyId}`);
    }

    const constituency = await constituencyRepo.findById(constituencyId);
    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    return await candidateRepo.create({
      candidateNumber,
      title,
      firstName,
      lastName,
      imageUrl,
      policy,
      user: { connect: { id: userId } },
      party: { connect: { id: partyId } },
      constituency: { connect: { id: constituencyId } },
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
   * ดึงรายการเขตเลือกตั้งทั้งหมด
   */
  public getAllConstituencies = async () => {
    return await constituencyRepo.findAll();
  };

  /**
   * ดึงรายการเขตเลือกตั้งตามจังหวัด
   */
  public getConstituenciesByProvince = async (province: string) => {
    if (!province) {
      throw new Error("กรุณาระบุชื่อจังหวัด");
    }
    return await constituencyRepo.findByProvince(province);
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
}
