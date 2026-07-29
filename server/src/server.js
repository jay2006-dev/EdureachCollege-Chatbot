import app from "./app.js";
import connectDB from "./config/database.config.js";
import { initializeKnowledgeBase } from "./services/rag.service.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await initializeKnowledgeBase();
    console.log("Knowledge base initialized successfully.");
  } catch (error) {
    console.error("Server initialization failed:", error.message || error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
