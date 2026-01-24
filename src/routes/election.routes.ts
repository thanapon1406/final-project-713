import { Router } from "express";
import { ElectionController } from "../controllers/election.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const electionController = new ElectionController();

// --- ADMIN SETUP ---
// POST /api/election/constituency - Admin creates a new zone
router.post(
  "/constituency",
  authenticate,
  authorize("ADMIN"),
  electionController.createConstituency,
);

// --- EC SETUP ---
// POST /api/election/party - EC creates a party
router.post(
  "/party",
  authenticate,
  authorize("EC"),
  electionController.createParty,
);

// POST /api/election/candidate - EC registers a candidate
router.post(
  "/candidate",
  authenticate,
  authorize("EC"),
  electionController.addCandidate,
);

// PATCH /api/election/close/:id - EC closes a poll
router.patch(
  "/close/:id",
  authenticate,
  authorize("EC"),
  electionController.closePoll,
);

// --- PUBLIC DATA (ไม่ต้องล็อกอิน) ---

// GET /api/election/constituency/:id - View candidates in a specific zone
// (If poll open: shows list. If closed: shows list + scores)
router.get("/constituency/:id", electionController.getConstituencyData);

// GET /api/election/party-overview - View all parties and their elected MP count
router.get("/party-overview", electionController.getPartyOverview);

export default router;
