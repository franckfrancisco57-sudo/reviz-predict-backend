import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

app.post('/api/analyser', async (req: Request, res: Response) => {
  try {
    const { homeTeam, awayTeam, championnat, type, numPartie } = req.body;

    let consignesSpecifiques = "";

    if (type === 'Jeu 21') {
      consignesSpecifiques = `
        - Tu es un expert en analyse statistique du Jeu 21 (21 Points / Blackjack eSport).
        - Le Joueur (Côté 1) est : ${homeTeam}
        - Le Croupier (Côté 2) est : ${awayTeam}
        - N° de Partie / Heure : ${numPartie || 'N/A'}
        - Donne des probabilités claires, le score exact de points estimé (ex: Joueur 20 - Croupier 17) et un conseil de mise précis.
      `;
    } else {
      consignesSpecifiques = `
        - Compétition : ${championnat || 'Général'}
        - Équipe/Joueur Domicile : ${homeTeam}
        - Équipe/Joueur Extérieur : ${awayTeam}
        - Type de sport/eSport : ${type}
        - Fournis une analyse détaillée, les tendances récentes et un pronostic précis.
      `;
    }

    const prompt = `
      Analyse cette rencontre eSport / Football avec la plus haute précision :
      ${consignesSpecifiques}

      Rédige la réponse en français avec un ton professionnel, clair et structuré.
    `;

    // Appel direct via la nouvelle SDK Interactions
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      status: 'ok',
      analyse: response.text
    });

  } catch (error: any) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      status: 'error',
      message: error.message || "Erreur lors de la génération de l'analyse."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
