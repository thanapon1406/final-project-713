// src/controllers/election.controller.ts
import { Request, Response } from "express";
import { ElectionService } from "../services/election.service";

export class ElectionController {
  constructor(
    private electionService: ElectionService = new ElectionService(),
  ) {}

  // ==================== EC FEATURES ====================

  /**
   * POST /api/election/party
   * สร้างพรรคการเมืองใหม่ (EC only)
   */
  createParty = async (req: Request, res: Response) => {
    try {
      const { name, logoUrl, policy } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุชื่อพรรค",
        });
      }

      const party = await this.electionService.createParty(
        name,
        logoUrl,
        policy,
      );

      res.status(201).json({
        success: true,
        message: "สร้างพรรคสำเร็จ",
        data: party,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /api/election/candidate
   * เพิ่มผู้สมัคร (EC only)
   */
  addCandidate = async (req: Request, res: Response) => {
    try {
      const {
        candidateNumber,
        title,
        firstName,
        lastName,
        imageUrl,
        policy,
        partyId,
        constituencyId,
        userId,
      } = req.body;

      // Validation
      if (
        !candidateNumber ||
        !firstName ||
        !lastName ||
        !partyId ||
        !constituencyId ||
        !userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "กรุณากระบุข้อมูลที่จำเป็น: candidateNumber, firstName, lastName, partyId, constituencyId, userId",
        });
      }

      const candidate = await this.electionService.addCandidate(
        candidateNumber,
        title || null,
        firstName,
        lastName,
        imageUrl || null,
        policy || null,
        partyId,
        constituencyId,
        userId,
      );

      res.status(201).json({
        success: true,
        message: "เพิ่มผู้สมัครสำเร็จ",
        data: candidate,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * PATCH /api/election/close/:id
   * ปิดการลงคะแนนในเขต (EC only)
   */
  closePoll = async (req: Request, res: Response) => {
    try {
      const constituencyId = parseInt(req.params.id as string);

      if (isNaN(constituencyId)) {
        return res.status(400).json({
          success: false,
          message: "Constituency ID ไม่ถูกต้อง",
        });
      }

      const constituency = await this.electionService.closePoll(constituencyId);

      res.status(200).json({
        success: true,
        message: "ปิดการลงคะแนนสำเร็จ",
        data: constituency,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  // ==================== PUBLIC RESULTS ====================

  /**
   * GET /api/election/constituency/:id
   * ดูผลการเลือกตั้งในเขต
   */
  getConstituencyData = async (req: Request, res: Response) => {
    try {
      const constituencyId = parseInt(req.params.id as string);

      if (isNaN(constituencyId)) {
        return res.status(400).json({
          success: false,
          message: "Constituency ID ไม่ถูกต้อง",
        });
      }

      const data =
        await this.electionService.getConstituencyResults(constituencyId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/election/party-overview
   * ดูภาพรวมพรรคทั้งหมดพร้อมจำนวน MPs
   */
  getPartyOverview = async (req: Request, res: Response) => {
    try {
      const parties = await this.electionService.getPartyOverview();

      res.status(200).json({
        success: true,
        data: parties,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/election/constituencies
   * ดูรายการเขตเลือกตั้งทั้งหมด (Public)
   */
  getAllConstituencies = async (req: Request, res: Response) => {
    try {
      const { province } = req.query;

      let constituencies;
      if (province && typeof province === "string") {
        // ถ้ามีระบุจังหวัด ให้กรองตามจังหวัด
        constituencies =
          await this.electionService.getConstituenciesByProvince(province);
      } else {
        // ถ้าไม่มี ให้แสดงทั้งหมด
        constituencies = await this.electionService.getAllConstituencies();
      }

      res.status(200).json({
        success: true,
        data: constituencies,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}
