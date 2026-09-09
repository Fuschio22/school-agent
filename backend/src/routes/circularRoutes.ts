import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  analyzeCircularController,
  getAllCircularsController,
  deleteCircularController
} from "../controllers/circularController";

import {
  updateEvent,
  deleteEvent
} from "../controllers/eventController";

const router = Router();

// Cartella dove vengono salvati i PDF
const uploadDir = path.join(process.cwd(), "uploads");

// Crea la cartella se non esiste
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1E9);

    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage,

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo file PDF sono ammessi"));
    }
  }
});

router.get("/", getAllCircularsController);

router.post("/analyze", upload.single("pdf"), analyzeCircularController);

router.delete("/:id", deleteCircularController);

// Modifica un singolo evento
router.patch("/:circularId/events/:eventIndex", updateEvent);

// Elimina un singolo evento
router.delete("/:circularId/events/:eventIndex", deleteEvent);

export default router;