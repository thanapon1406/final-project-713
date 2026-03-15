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

const logPrefix = "[API]";

type ExpressLayer = {
  route?: {
    path: string | string[];
    methods: Record<string, boolean>;
  };
  name?: string;
  handle?: {
    stack?: ExpressLayer[];
  };
};

const joinPaths = (basePath: string, routePath: string) => {
  const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const route = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${base}${route}`;
};

const listRoutesFromStack = (basePath: string, stack: ExpressLayer[] = []) => {
  const entries: string[] = [];

  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .filter((method) => layer.route?.methods[method])
        .map((method) => method.toUpperCase());

      const paths = Array.isArray(layer.route.path)
        ? layer.route.path
        : [layer.route.path];

      for (const method of methods) {
        for (const routePath of paths) {
          entries.push(`${method.padEnd(6)} ${joinPaths(basePath, routePath)}`);
        }
      }
    } else if (layer.name === "router" && layer.handle?.stack) {
      entries.push(...listRoutesFromStack(basePath, layer.handle.stack));
    }
  }

  return entries;
};

const logMountedRoutes = () => {
  const voteStack = ((voteRoutes as any).stack as ExpressLayer[]) || [];
  const authStack = ((authRoutes as any).stack as ExpressLayer[]) || [];
  const electionStack = ((electionRoutes as any).stack as ExpressLayer[]) || [];
  const adminStack = ((adminRoutes as any).stack as ExpressLayer[]) || [];

  const allRoutes = [
    "GET    /",
    "GET    /api-docs",
    ...listRoutesFromStack("/api/votes", voteStack),
    ...listRoutesFromStack("/api/auth", authStack),
    ...listRoutesFromStack("/api/election", electionStack),
    ...listRoutesFromStack("/api/admin", adminStack),
  ].sort((a, b) => a.localeCompare(b));

  console.log(`${logPrefix} Registered endpoints (${allRoutes.length}):`);
  for (const route of allRoutes) {
    console.log(`${logPrefix} ${route}`);
  }
};

// 2. Middleware Setup
app.use(cors()); // Allow Cross-Origin requests
app.use(express.json()); // Parse JSON bodies

app.use((req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `${logPrefix} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`,
    );
  });

  next();
});

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

app.use((req: Request, res: Response) => {
  console.warn(`${logPrefix} 404 ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

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
  logMountedRoutes();
});
