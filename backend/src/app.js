import cors from "cors";
import express from "express";
import path from "path";
import attendanceRoutes from "./routes/attendanceRoutes.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "*",
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.resolve("uploads")));

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
