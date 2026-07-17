import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import circularRoutes from "./routes/circularRoutes";
import chatRoutes from "./routes/chatRoutes"; // <-- AGGIUNTA: Import delle rotte chat

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rotte esistenti
app.use("/api/circulars", circularRoutes);

// <-- AGGIUNTA: Rotte per la chat AI
app.use("/api/chat", chatRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend attivo su http://localhost:${PORT}`);
});