import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/analyser', async (req: Request, res: Response) => {
  try {
    const { homeTeam, awayTeam, championnat, type } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Tu es un expert mondial en analyse statistique sportive et paris sportifs.
    Analyse ce match de ${type || 'Football'} :
    Championnat / Compétition : ${championnat}
    Équipe / Côté 1 (Domicile / Croupier) : ${homeTeam}
    Équipe / Côté 2 (Extérieur / Joueur) : ${awayTeam}

    RÈGLES D'ANALYSE STRICTES (CRUCIAL) :
    1. ÉLIMINE LE BIAIS DOMICILE AUTOMATIQUE : L'avantage du terrain ne doit PAS accorder de victoire injustifiée à une équipe nettement inférieure. Si l'équipe à l'extérieur est le grand favori, la prédiction DOIT refléter la victoire de l'équipe extérieure.
    2. RATIONALITÉ STATISTIQUE : Évalue la différence de niveau réelle, la forme récente, la qualité de l'effectif et la hiérarchie objective.
    3. PROBABILITÉS COHÉRENTES : La somme des probabilités Domicile, Nul, Extérieur doit être égale à 100%.

    Réponds STRICTEMENT sous forme de JSON valide avec exactement cette structure :
    {
      "type_match": "${type || 'Football'}",
      "championnat": "${championnat}",
      "equipe_domicile": "${homeTeam}",
      "equipe_exterieur": "${awayTeam}",
      "taux_de_confiance": "ex: 85%",
      "pronostic_principal": "ex: Victoire Extérieur (2) ou Over 2.5",
      "score_exact_predit": "ex: 0-3",
      "probabilites": {
        "domicile": "ex: 10%",
        "nul": "ex: 15%",
        "exterieur": "ex: 75%"
      },
      "statistiques_avancees": {
        "possession_attendue": "ex: 35% - 65%",
        "tirs_cadres_estimes": "ex: 2 vs 7",
        "conseil_paris": "ex: Victoire Extérieur avec Handicap -1"
      }
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Nettoyage JSON
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const analyseData = JSON.parse(cleanJson);

    res.json({ status: 'ok', analyse: analyseData });
  } catch (error: any) {
    console.error("Erreur Backend :", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur GSK Predict démarré sur le port ${PORT}`);
});
