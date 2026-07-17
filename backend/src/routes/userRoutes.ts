import { Router } from "express";
import { getUserClassesController, updateUserClassesController } from "../controllers/userController";

const router = Router();

// Rotta per ottenere le classi
router.get("/classes", getUserClassesController);

// Rotta per aggiornare le classi
router.put("/classes", updateUserClassesController);

export default router;