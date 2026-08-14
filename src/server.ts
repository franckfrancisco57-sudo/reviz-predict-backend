import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Liste des modèles reconnus par les clés Google AI Studio
const MODEL_NAMES = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
  'gemini-2.0-flash-exp'
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
    let lastError = null;

    // Essaie chaque modèle jusqu'à ce que Google accepte la requête
    for (const modelName of MODEL_NAMES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        if (responseText) {
          console.log(`Analyse générée avec succès via : ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`Modèle ${modelName} indisponible, essai du suivant...`);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error("Aucun modèle Gemini n'est accessible avec cette clé API.");
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
