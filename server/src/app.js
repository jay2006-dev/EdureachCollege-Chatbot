import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.routes.js";
import errorHandler from "./middleware/error-handler.middleware.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.CLIENT_URL) {
        const allowed = process.env.CLIENT_URL.split(",").map((s) => s.trim());
        if (allowed.includes("*") || allowed.includes(origin)) {
          return callback(null, true);
        }
      }
      // Allow localhost and Vercel domains by default
      if (
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));

app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});
app.use(errorHandler);
export default app;
