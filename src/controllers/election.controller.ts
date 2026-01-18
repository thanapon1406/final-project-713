import { Request, Response } from "express";
// import { ElectionService } from '../services/election.service';

export class ElectionController {
  createConstituency = async (req: Request, res: Response) => {
    /* Logic */
  };
  createParty = async (req: Request, res: Response) => {
    /* Logic */
  };
  addCandidate = async (req: Request, res: Response) => {
    /* Logic */
  };
  closePoll = async (req: Request, res: Response) => {
    /* Logic */
  };

  getConstituencyData = async (req: Request, res: Response) => {
    // Logic: Check if closed -> if yes, include scores. if no, hide scores.
  };

  getPartyOverview = async (req: Request, res: Response) => {
    /* Logic */
  };
}
