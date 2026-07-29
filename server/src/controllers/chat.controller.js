import { answerQuestion } from "../services/rag.service.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({
        success: false,
        message: "Message is required and must be a non-empty string.",
      });
      return;
    }

    const answer = await answerQuestion(message.trim());
    console.log("Chat controller answer:", answer);

    res.json({
      success: true,
      data: { message: answer },
    });
  } catch (error) {
    next(error);
  }
};
