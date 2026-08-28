import { Router } from "express";
import multer from "multer";

import {
  analyzeCircularController,
  getAllCircularsController,
  deleteCircularController,
  getCircularPDFController,
} from "../controllers/circularController";

import { updateEvent } from "../controllers/eventController";

const router = Router();

// Il PDF viene tenuto in memoria come Buffer.
// In questo modo possiamo salvarlo direttamente nel database
// invece di dipendere dalla cartella /uploads di Render.
const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo file PDF sono ammessi"));
    }
  },

  limits: {
    fileSize: 20 * 1024 * 1024, // massimo 20 MB
  },
});

// Recupera tutte le circolari
router.get("/", getAllCircularsController);

// Recupera/apre il PDF dal database
router.get("/:id/pdf", getCircularPDFController);

// Analizza e salva una nuova circolare
router.post(
  "/analyze",
  upload.single("pdf"),
  analyzeCircularController
);

// Elimina una circolare
router.delete("/:id", deleteCircularController);

// Modifica un evento
router.patch(
  "/:circularId/events/:eventIndex",
  updateEvent
);

export default router;