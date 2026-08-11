import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initSchema } from "./database/db";
import footballRoutes from "./routes/football";
import esportRoutes from "./routes/esport";

dotenv.config();
initSchema();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    demoMode: process.env.DEMO_MODE === "true" || !process.env.API_FOOTBALL_KEY,
  });
});

app.use("/api/football", footballRoutes);
app.use("/api/esport", esportRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`RevizPredict backend en ecoute sur http://localhost:${PORT}`);
  console.log(
    process.env.API_FOOTBALL_KEY
      ? "Mode : donnees reelles (API-Football)"
      : "Mode : DEMO (aucune cle API detectee)"
  );
});
