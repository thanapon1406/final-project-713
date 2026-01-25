// src/server.ts
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import voteRoutes from "./routes/vote.routes";
import electionRoutes from "./routes/election.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";

// Import Routes

// 1. Initialize Configuration
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware Setup
app.use(cors()); // Allow Cross-Origin requests
app.use(express.json()); // Parse JSON bodies

// 3. Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 4. Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.send({
    status: "OK",
    message: "Election System API is running",
    documentation: `http://localhost:${PORT}/api-docs`,
  });
});

// 5. API Routes
// Mount the routes defined in your Route layers
app.use("/api/votes", voteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/election", electionRoutes);
app.use("/api/admin", adminRoutes);

// 6. Global Error Handling Middleware
// This catches any errors thrown in your Services/Controllers
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${err.message}`);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// 7. Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  console.log(
    `📚 API Documentation available at http://localhost:${PORT}/api-docs`,
  );
  console.log(`⭐️ Environment: ${process.env.NODE_ENV || "development"}`);
});
