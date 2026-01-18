import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";

const router = Router();
const voteController = new VoteController();

// POST /api/votes - Cast or update a vote
router.post("/", voteController.vote);

export default router;
