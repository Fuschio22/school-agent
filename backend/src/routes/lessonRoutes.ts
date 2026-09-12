import { Router } from "express";
import {
  getLessonsController,
  createLessonController,
  updateLessonController,
  deleteLessonController,
} from "../controllers/lessonController";

const router = Router();

router.get("/", getLessonsController);
router.post("/", createLessonController);
router.patch("/:id", updateLessonController);
router.delete("/:id", deleteLessonController);

export default router;