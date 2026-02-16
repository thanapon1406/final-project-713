// src/routes/vote.routes.ts
import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const voteController = new VoteController();

/**
 * @swagger
 * /api/votes/ballot:
 *   get:
 *     summary: Get ballot (list of candidates) for the logged-in user
 *     description: Returns the ballot for the user's constituency. User ID is taken from the JWT token.
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ballot retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     constituency:
 *                       $ref: '#/components/schemas/Constituency'
 *                     candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           candidateNumber:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           party:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       400:
 *         description: User not found or not assigned to a constituency
 *       401:
 *         description: Unauthorized - Please login
 *       403:
 *         description: Forbidden - VOTER or EC role required
 */
router.get(
  "/ballot",
  authenticate,
  authorize("VOTER", "EC"),
  voteController.getBallot,
);

/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Cast or update a vote
 *     description: Allows a voter or EC to cast a vote or change their existing vote (if constituency is still open). User ID is taken from the JWT token.
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateId
 *             properties:
 *               candidateId:
 *                 type: integer
 *                 example: 1
 *                 description: The ID of the candidate to vote for
 *     responses:
 *       200:
 *         description: Vote cast or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vote cast successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Vote'
 *       400:
 *         description: Invalid input, constituency closed, or candidate not in user's constituency
 *       401:
 *         description: Unauthorized - Please login
 *       403:
 *         description: Forbidden - VOTER or EC role required
 */
router.post("/", authenticate, authorize("VOTER", "EC"), voteController.vote);

/**
 * @swagger
 * /api/votes/my-vote:
 *   get:
 *     summary: Get voter's current vote status
 *     description: Returns whether the user has voted and details of their vote if they have. User ID is taken from the JWT token.
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vote status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasVoted:
 *                       type: boolean
 *                       example: true
 *                     constituency:
 *                       $ref: '#/components/schemas/Constituency'
 *                     vote:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         candidate:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             candidateNumber:
 *                               type: integer
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                             party:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *       400:
 *         description: User not found or not assigned to a constituency
 *       401:
 *         description: Unauthorized - Please login
 *       403:
 *         description: Forbidden - VOTER or EC role required
 */
router.get(
  "/my-vote",
  authenticate,
  authorize("VOTER", "EC"),
  voteController.getMyVote,
);

/**
 * @swagger
 * /api/votes/my-results:
 *   get:
 *     summary: Get election results for voter's constituency
 *     description: Returns election results for the user's constituency. Vote counts are only shown if the poll is closed. User ID is taken from the JWT token.
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     constituency:
 *                       $ref: '#/components/schemas/Constituency'
 *                     candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           candidateNumber:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           party:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           voteCount:
 *                             type: integer
 *                             nullable: true
 *                             description: Only present when poll is closed
 *                           isMyVote:
 *                             type: boolean
 *                             description: Indicates if this is the candidate the user voted for
 *                     winner:
 *                       type: object
 *                       nullable: true
 *                       description: Winner details, only present when poll is closed
 *                     myVoteStatus:
 *                       type: object
 *                       properties:
 *                         hasVoted:
 *                           type: boolean
 *                         votedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *       400:
 *         description: User not found or not assigned to a constituency
 *       401:
 *         description: Unauthorized - Please login
 *       403:
 *         description: Forbidden - VOTER or EC role required
 */
router.get(
  "/my-results",
  authenticate,
  authorize("VOTER", "EC"),
  voteController.getMyConstituencyResults,
);

export default router;
