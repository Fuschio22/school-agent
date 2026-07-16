import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import circularRoutes from "./routes/circularRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Abbiamo cambiato la porta qui!

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// QUESTA RIGA È FONDAMENTALE:
app.use("/api/circulars", circularRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend attivo su http://localhost:${PORT}`);
});