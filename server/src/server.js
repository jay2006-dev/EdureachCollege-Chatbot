import app from "./app.js";
import { initializeKnowledgeBase } from "./services/rag.service.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeKnowledgeBase();
    console.log("Knowledge base initialized successfully.");
  } catch (error) {
    console.error(
      "Knowledge base initialization failed:",
      error.message || error,
    );
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
