// src/controllers/vote.controller.ts
import { Response } from "express";
import { VoteService } from "../services/vote.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class VoteController {
  constructor(private voteService: VoteService = new VoteService()) {}

  /**
   * GET /api/votes/ballot
   * ดูบัตรเลือกตั้ง (Get Ballot) - userId from token
   */
  getBallot = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
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
   * ลงคะแนนเสียง (Cast Vote) - userId from token
   */
  vote = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { candidateId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      if (!candidateId) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุ candidateId",
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

  /**
   * GET /api/votes/my-vote
   * ดูคะแนนเสียงของตัวเอง (Get My Vote) - userId from token
   */
  getMyVote = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const result = await this.voteService.getMyVote(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/votes/my-results
   * ดูผลการเลือกตั้งในเขตของตัวเอง (Get My Constituency Results) - userId from token
   */
  getMyConstituencyResults = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const result = await this.voteService.getMyConstituencyResults(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}
