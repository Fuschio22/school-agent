import { Router } from "express";
import { chatController } from "../controllers/chatController";

const router = Router();

// Rotta per inviare una domanda alla chat AI
router.post("/ask", chatController);

export default router;