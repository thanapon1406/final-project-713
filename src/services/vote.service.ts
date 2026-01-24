// src/services/vote.service.ts
import * as voteRepo from "../repositories/vote.repository";
import * as userRepo from "../repositories/user.repository";
import * as electionRepo from "../repositories/election.repository";

export class VoteService {
  /**
   * ดูบัตรเลือกตั้ง (Get Ballot)
   * - แสดงรายชื่อผู้สมัครในเขตของผู้ใช้
   */
  public getBallot = async (userId: number) => {
    // 1. หาข้อมูลผู้ใช้
    const user = await userRepo.findUserById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (!user.constituencyId) {
      throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
    }

    // 2. ดึงผู้สมัครทั้งหมดในเขตนั้น
    const candidates = await electionRepo.findCandidatesByConstituency(
      user.constituencyId,
    );

    // 3. แปลงข้อมูลเป็นรูปแบบบัตรเลือกตั้ง
    const ballot = candidates.map((candidate) => ({
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
    }));

    return {
      constituency: {
        id: user.constituency.id,
        province: user.constituency.province,
        districtNumber: user.constituency.districtNumber,
        isClosed: user.constituency.isClosed,
      },
      candidates: ballot,
    };
  };

  /**
   * ลงคะแนนเสียง (Cast Vote)
   * - ตรวจสอบว่าเขตปิดแล้วหรือยัง
   * - ตรวจสอบว่าผู้สมัครอยู่ในเขตเดียวกับผู้ใช้
   * - ใช้ upsert เพื่ออนุญาตให้เปลี่ยนคะแนนได้ถ้ายังไม่ปิด
   */
  public castVote = async (userId: number, candidateId: number) => {
    // 1. หาข้อมูลผู้ใช้
    const user = await userRepo.findUserById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (!user.constituencyId) {
      throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
    }

    // 2. ตรวจสอบว่าเขตปิดแล้วหรือยัง
    if (user.constituency.isClosed) {
      throw new Error(
        `การลงคะแนนในเขต ${user.constituency.province} เขตที่ ${user.constituency.districtNumber} ปิดแล้ว`,
      );
    }

    // 3. หาข้อมูลผู้สมัคร
    const candidate = await electionRepo.findCandidateById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    // 4. ตรวจสอบว่าผู้สมัครอยู่ในเขตเดียวกับผู้ใช้
    if (candidate.constituencyId !== user.constituencyId) {
      throw new Error(`ผู้สมัครนี้ไม่ได้อยู่ในเขตเลือกตั้งของคุณ`);
    }

    // 5. บันทึกหรืออัพเดทคะแนนเสียง
    const vote = await voteRepo.upsertVote(userId, candidateId);

    return {
      message: "ลงคะแนนสำเร็จ",
      vote: {
        id: vote.id,
        timestamp: vote.timestamp,
        candidate: {
          id: vote.candidate.id,
          candidateNumber: vote.candidate.candidateNumber,
          firstName: vote.candidate.firstName,
          lastName: vote.candidate.lastName,
          party: {
            id: vote.candidate.party.id,
            name: vote.candidate.party.name,
          },
        },
      },
    };
  };
}
