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

    let consignesSpecifiques = "";

    // REGLES PAR TYPE DE JEU
    if (type === 'FIFA Volta') {
      consignesSpecifiques = `
      C'est un match VOLTA / REDUCED (3x3, 4x4, 5x5). Le nombre de buts est TRÈS ÉLEVÉ.
      - Génère un score par mi-temps (Mi-temps 1 et Mi-temps 2).
      - Le score final doit être élevé (ex: 6-4, 8-5, 7-6).
      - Donne un conseil du type "Plus de 9.5 buts dans le match" ou "Plus de 4.5 buts en MT1".
      `;
    } else if (type === 'Jeu de Dés Virtuels') {
      consignesSpecifiques = `
      C'est un JEU DE DÉS VIRTUELS entre Joueur 1 (${homeTeam}) et Joueur 2 (${awayTeam}).
      - IL N'Y A PAS DE CROUPIER NI DE BUTS DE FOOTBALL !
      - Analyse uniquement sous forme de POINTS DE DÉS et LANCERS.
      - Génère le score pour : Lancer 1 (ex: 9-11) et Lancer 2 (ex: 12-8).
      - Donne le Total de Points prédit et le Gagnant du Tour.
      `;
    } else if (type && type.includes('Jeu 21')) {
      consignesSpecifiques = `
      C'est une partie de JEU 21 / BLACKJACK : Croupier (${homeTeam}) vs Joueur (${awayTeam}).
      - Analyse équilibrée des deux côtés (Croupier et Joueur).
      - Prédiction des points/cartes (ex: Croupier 18 - Joueur 21).
      - Indique la probabilité de victoire de chaque côté.
      `;
    } else if (type === 'FIFA Penalty') {
      consignesSpecifiques = `
      C'est une séance de PENALTIES FIFA.
      - Pas de mi-temps !
      - Génère un score de séance de tirs au but (ex: 4-3, 5-4).
      - Indique le nombre total de penalties réussis.
      `;
    } else {
      consignesSpecifiques = `
      C'est un match de Football (Réel ou Cyberleague 11v11).
      - Génère le score à la Mi-temps et le Score Final.
      - ÉLIMINE LE BIAIS DOMICILE AUTOMATIQUE : L'avantage du terrain ne doit PAS accorder de victoire injustifiée à une équipe nettement inférieure. Si l'équipe à l'extérieur est le grand favori, la prédiction DOIT refléter la victoire de l'équipe extérieure.
      `;
    }

    const prompt = `
    Tu es un expert mondial en paris sportifs (type 1XBet).
    Type de Jeu : ${type}
    Compétition / Contexte : ${championnat}
    Côté 1 (Domicile / Lanceur 1 / Croupier) : ${homeTeam}
    Côté 2 (Extérieur / Lanceur 2 / Joueur) : ${awayTeam}

    ${consignesSpecifiques}

    Réponds STRICTEMENT au format JSON avec cette structure exacte :
    {
      "type_match": "${type}",
      "championnat": "${championnat}",
      "equipe_domicile": "${homeTeam}",
      "equipe_exterieur": "${awayTeam}",
      "taux_de_confiance": "ex: 88%",
      "pronostic_principal": "ex: Plus de 8.5 Buts / Gagnant Lancer 1",
      "score_exact_predit": "ex: MT1: 3-2 | MT2: 4-3 (Score Total: 7-5) ou Lancer 1: 10-8",
      "probabilites": {
        "domicile": "ex: 45%",
        "nul": "ex: 10%",
        "exterieur": "ex: 45%"
      },
      "statistiques_avancees": {
        "possession_attendue": "ex: Tendance 1ère MT / Lancers combinés",
        "tirs_cadres_estimes": "ex: Total Buts / Total Points Dépassement",
        "conseil_paris": "ex: Plus de 4.5 buts en MT1 / Joueur 2 gagne par 2 points+"
      }
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
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
