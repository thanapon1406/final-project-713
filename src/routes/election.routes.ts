import { Router } from "express";
import { ElectionController } from "../controllers/election.controller";

const router = Router();
const electionController = new ElectionController();

// --- ADMIN / EC SETUP ---

// POST /api/election/constituency - Admin creates a new zone
router.post("/constituency", electionController.createConstituency);

// POST /api/election/party - EC creates a party
router.post("/party", electionController.createParty);

// POST /api/election/candidate - EC registers a candidate
router.post("/candidate", electionController.addCandidate);

// PATCH /api/election/close/:id - EC closes a poll
router.patch("/close/:id", electionController.closePoll);

// --- PUBLIC DATA ---

// GET /api/election/constituency/:id - View candidates in a specific zone
// (If poll open: shows list. If closed: shows list + scores)
router.get("/constituency/:id", electionController.getConstituencyData);

// GET /api/election/party-overview - View all parties and their elected MP count
router.get("/party-overview", electionController.getPartyOverview);

export default router;
