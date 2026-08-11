import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import footballRoutes from "./routes/football.js";
import esportRoutes from "./routes/esport.js";

dotenv.config();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
