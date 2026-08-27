import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import circularRoutes from "./routes/circularRoutes";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Cartella dove vengono salvati i PDF
const uploadsDir = path.join(process.cwd(), "uploads");

// Crea la cartella se non esiste
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log("📁 Directory uploads:", uploadsDir);
console.log("📁 Directory uploads esiste:", fs.existsSync(uploadsDir));

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Rende i PDF accessibili dal browser
app.use("/uploads", express.static(uploadsDir));

app.use("/api/circulars", circularRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend attivo su http://localhost:${PORT}`);
  console.log(`📂 PDF disponibili tramite /uploads`);
});