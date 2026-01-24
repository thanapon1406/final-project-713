// src/routes/vote.routes.ts
import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const voteController = new VoteController();

// ทุก route ต้องล็อกอินและเป็น VOTER เท่านั้น

// GET /api/votes/ballot/:userId - Get ballot (list of candidates) for a user
router.get(
  "/ballot/:userId",
  authenticate,
  authorize("VOTER"),
  voteController.getBallot,
);

// POST /api/votes - Cast or update a vote
router.post("/", authenticate, authorize("VOTER"), voteController.vote);

export default router;
