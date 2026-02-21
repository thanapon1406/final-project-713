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

      const party = await this.electionService.createParty({
        name,
        logoUrl,
        policy,
      });

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
   * Note: Personal info (title, firstName, lastName, imageUrl) is inherited from User entity
   */
  addCandidate = async (req: Request, res: Response) => {
    try {
      const {
        candidateNumber,
        policy,
        partyId,
        constituencyId,
        userId,
      } = req.body;

      const candidate = await this.electionService.addCandidate({
        candidateNumber,
        policy,
        partyId,
        constituencyId,
        userId,
      });

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

      const constituencies = await this.electionService.getConstituencies({
        province: typeof province === "string" ? province : undefined,
      });

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

  /**
   * GET /api/election/public/parties
   * ดูรายการพรรคทั้งหมดแบบสาธารณะ (Public)
   */
  getPublicPartyList = async (req: Request, res: Response) => {
    try {
      const parties = await this.electionService.getPublicPartyList();

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
   * GET /api/election/public/party/:id
   * ดูรายละเอียดพรรคพร้อมรายชื่อผู้สมัคร (Public)
   */
  getPublicPartyDetails = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      const party = await this.electionService.getPublicPartyDetails(id);

      res.status(200).json({
        success: true,
        data: party,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  // ==================== EC PARTY MANAGEMENT ====================

  /**
   * GET /api/election/parties
   * ดูรายการพรรคทั้งหมด (EC only)
   */
  getAllParties = async (req: Request, res: Response) => {
    try {
      const parties = await this.electionService.getAllParties();

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
   * GET /api/election/party/:id
   * ดูพรรคตาม ID (EC only)
   */
  getPartyById = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      const party = await this.electionService.getPartyById(id);

      res.status(200).json({
        success: true,
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
   * PUT /api/election/party/:id
   * อัปเดตพรรค (EC only)
   */
  updateParty = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { name, logoUrl, policy } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      const party = await this.electionService.updateParty(id, {
        name,
        logoUrl,
        policy,
      });

      res.status(200).json({
        success: true,
        message: "อัปเดตพรรคสำเร็จ",
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
   * DELETE /api/election/party/:id
   * ลบพรรค (EC only)
   */
  deleteParty = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      await this.electionService.deleteParty(id);

      res.status(200).json({
        success: true,
        message: "ลบพรรคสำเร็จ",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  // ==================== EC CANDIDATE MANAGEMENT ====================

  /**
   * GET /api/election/voters
   * ดูรายชื่อผู้มีสิทธิ์เลือกตั้งพร้อมข้อมูลผู้สมัคร (EC only)
   */
  getEligibleVoters = async (req: Request, res: Response) => {
    try {
      const { constituencyId, province } = req.query;

      const data = await this.electionService.getEligibleVoters({
        constituencyId:
          typeof constituencyId === "string"
            ? parseInt(constituencyId)
            : undefined,
        province: typeof province === "string" ? province : undefined,
      });

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
   * GET /api/election/candidates
   * ดูรายการผู้สมัครทั้งหมดหรือตามเขต (EC only)
   */
  getCandidates = async (req: Request, res: Response) => {
    try {
      const { constituencyId } = req.query;

      const data = await this.electionService.getCandidates({
        constituencyId:
          typeof constituencyId === "string"
            ? parseInt(constituencyId)
            : undefined,
      });

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
   * GET /api/election/candidate/:id
   * ดูข้อมูลผู้สมัครตาม ID (EC only)
   */
  getCandidateById = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID ไม่ถูกต้อง",
        });
      }

      const candidate = await this.electionService.getCandidateById(id);

      res.status(200).json({
        success: true,
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
   * PUT /api/election/candidate/:id
   * อัปเดตผู้สมัคร (EC only)
   * Note: Personal info (title, firstName, lastName, imageUrl) is managed through User entity
   */
  updateCandidate = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { candidateNumber, policy, partyId } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID ไม่ถูกต้อง",
        });
      }

      const candidate = await this.electionService.updateCandidate(id, {
        candidateNumber,
        policy,
        partyId,
      });

      res.status(200).json({
        success: true,
        message: "อัปเดตผู้สมัครสำเร็จ",
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
   * DELETE /api/election/candidate/:id
   * ลบผู้สมัคร (EC only)
   */
  deleteCandidate = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID ไม่ถูกต้อง",
        });
      }

      await this.electionService.deleteCandidate(id);

      res.status(200).json({
        success: true,
        message: "ลบผู้สมัครสำเร็จ",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/election/next-candidate-number/:constituencyId
   * ดูหมายเลขผู้สมัครถัดไปในเขต (EC only)
   */
  getNextCandidateNumber = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.constituencyId;
      const constituencyId = parseInt(
        Array.isArray(idParam) ? idParam[0] : idParam,
      );

      if (isNaN(constituencyId)) {
        return res.status(400).json({
          success: false,
          message: "Constituency ID ไม่ถูกต้อง",
        });
      }

      const nextNumber =
        await this.electionService.getNextCandidateNumber(constituencyId);

      res.status(200).json({
        success: true,
        data: { nextCandidateNumber: nextNumber },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/election/provinces
   * ดูรายการจังหวัดทั้งหมดที่มีเขตเลือกตั้ง (EC only)
   */
  getAllProvinces = async (req: Request, res: Response) => {
    try {
      const provinces = await this.electionService.getAllProvinces();

      res.status(200).json({
        success: true,
        data: provinces,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  // ==================== EC UPLOAD ====================

  /**
   * POST /api/election/party/:id/logo
   * อัปโหลดโลโก้พรรค (EC only)
   */
  uploadPartyLogo = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const partyId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(partyId)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "กรุณาเลือกไฟล์รูปภาพ",
        });
      }

      const result = await this.electionService.uploadPartyLogo(partyId, req.file);

      res.status(200).json({
        success: true,
        message: "อัปโหลดโลโก้พรรคสำเร็จ",
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
