// src/routes/vote.routes.ts
import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";

const router = Router();
const voteController = new VoteController();

// GET /api/votes/ballot/:userId - Get ballot (list of candidates) for a user
router.get("/ballot/:userId", voteController.getBallot);

// POST /api/votes - Cast or update a vote
router.post("/", voteController.vote);

export default router;
