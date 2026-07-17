import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import circularRoutes from "./routes/circularRoutes";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes"; // <-- AGGIUNTA

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/circulars", circularRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes); // <-- AGGIUNTA

app.listen(PORT, () => {
  console.log(`✅ Backend attivo su http://localhost:${PORT}`);
});