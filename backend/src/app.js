import cors from "cors";
import express from "express";
import { uploadsDirectory } from "./config/paths.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

export const createApp = () => {
  const app = express();
  const allowedOrigin =
    process.env.CLIENT_URL || "https://web-based-attendence-system.vercel.app";
  const corsOptions = {
    origin(origin, callback) {
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS is not allowed for this origin."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.set("trust proxy", 1);
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(uploadsDirectory));

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ message: "Attendance API is running." });
  });

  app.use("/api/attendance", attendanceRoutes);

  app.use((error, _request, response, _next) => {
    const statusCode = error.statusCode || 500;

    response.status(statusCode).json({
      message: error.message || "Something went wrong.",
    });
  });

  return app;
};
