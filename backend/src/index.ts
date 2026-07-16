import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import circularRoutes from "./routes/circularRoutes";

// Carica le variabili d'ambiente dal file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: abilita le chiamate dal frontend e parsing del JSON
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// NUOVO: Rende pubblica la cartella uploads per permettere il download dei PDF
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes: collega le rotte delle circolari
app.use("/api/circulars", circularRoutes);

// Avvio del server
app.listen(PORT, () => {
  console.log(`✅ Backend attivo su http://localhost:${PORT}`);
});