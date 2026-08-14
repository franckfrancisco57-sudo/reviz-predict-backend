import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Nouveaux identifiants officiels de l'API Google
const MODEL_NAMES = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite'
];

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

    let responseText = "";
    let errorsLog: string[] = [];

    for (const modelName of MODEL_NAMES) {
      try {
        console.log(`Essai avec : ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        
        if (result && result.response) {
          responseText = result.response.text();
          if (responseText) break;
        }
      } catch (err: any) {
        errorsLog.push(`${modelName}: ${err.message || 'Error'}`);
      }
    }

    if (!responseText) {
      return res.status(500).json({
        status: 'error',
        message: `Erreur API Gemini. Détails : ${errorsLog.join(' | ')}`
      });
    }

    res.json({
      status: 'ok',
      analyse: responseText
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message || "Erreur interne lors de la génération."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
