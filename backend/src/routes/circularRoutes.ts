import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  analyzeCircularController, 
  getAllCircularsController,
  deleteCircularController // <-- AGGIUNTO: import per l'eliminazione
} from "../controllers/circularController";

const router = Router();

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo file PDF sono ammessi'));
  }
});

// Recupera tutte le circolari
router.get("/", getAllCircularsController);

// Analizza e salva una nuova circolare
router.post("/analyze", upload.single('pdf'), analyzeCircularController);

// ELIMINA una circolare specifica per ID
router.delete("/:id", deleteCircularController);

export default router;