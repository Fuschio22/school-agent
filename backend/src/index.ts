import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import circularRoutes from "./routes/circularRoutes";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
import lessonRoutes from "./routes/lessonRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log("📁 Directory uploads:", uploadsDir);
console.log("📁 Directory uploads esiste:", fs.existsSync(uploadsDir));

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/debug/uploads/:filename", (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);

  console.log("🔎 DEBUG PDF:", filePath);
  console.log("🔎 FILE ESISTE:", fs.existsSync(filePath));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      exists: false,
      path: filePath,
      files: fs.existsSync(uploadsDir)
        ? fs.readdirSync(uploadsDir)
        : []
    });
  }

  return res.json({
    exists: true,
    path: filePath
  });
});

app.use("/api/circulars", circularRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/lessons", lessonRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend attivo su http://localhost:${PORT}`);
  console.log(`📂 PDF disponibili tramite /uploads`);
});