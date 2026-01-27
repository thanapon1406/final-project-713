// src/controllers/vote.controller.ts
import { Request, Response } from "express";
import { VoteService } from "../services/vote.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class VoteController {
  constructor(private voteService: VoteService = new VoteService()) {}

  /**
   * GET /api/votes/ballot/:userId
   * ดูบัตรเลือกตั้ง (Get Ballot)
   */
  getBallot = async (req: AuthRequest, res: Response) => {
    try {
      const userIdParam = req.params.userId;
      const userId = parseInt(
        Array.isArray(userIdParam) ? userIdParam[0] : userIdParam,
      );

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "User ID ไม่ถูกต้อง",
        });
      }

      // Security: Verify the logged-in user matches the userId in request
      if (req.user?.id !== userId) {
        return res.status(403).json({
          success: false,
          message: "คุณไม่สามารถดูบัตรเลือกตั้งของผู้อื่นได้",
        });
      }

      const ballot = await this.voteService.getBallot(userId);

      res.status(200).json({
        success: true,
        data: ballot,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /api/votes
   * ลงคะแนนเสียง (Cast Vote)
   */
  vote = async (req: AuthRequest, res: Response) => {
    try {
      const { userId, candidateId } = req.body;

      // Validation
      if (!userId || !candidateId) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุ userId และ candidateId",
        });
      }

      // Security: Verify the logged-in user matches the userId in request
      if (req.user?.id !== userId) {
        return res.status(403).json({
          success: false,
          message: "คุณไม่สามารถลงคะแนนแทนผู้อื่นได้",
        });
      }

      const result = await this.voteService.castVote(userId, candidateId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.vote,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}
