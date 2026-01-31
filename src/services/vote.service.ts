// src/services/vote.service.ts
import * as voteRepo from "../repositories/vote.repository";
import * as userRepo from "../repositories/user.repository";
import * as candidateRepo from "../repositories/candidate.repository";

export class VoteService {
  /**
   * ดูบัตรเลือกตั้ง (Get Ballot)
   */
  public getBallot = async (userId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (!user.constituencyId) {
      throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
    }

    const candidates = await candidateRepo.findByConstituency(
      user.constituencyId,
    );

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
   */
  public castVote = async (userId: number, candidateId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (!user.constituencyId) {
      throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
    }

    if (user.constituency.isClosed) {
      throw new Error(
        `การลงคะแนนในเขต ${user.constituency.province} เขตที่ ${user.constituency.districtNumber} ปิดแล้ว`,
      );
    }

    const candidate = await candidateRepo.findById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    if (candidate.constituencyId !== user.constituencyId) {
      throw new Error(`ผู้สมัครนี้ไม่ได้อยู่ในเขตเลือกตั้งของคุณ`);
    }

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
