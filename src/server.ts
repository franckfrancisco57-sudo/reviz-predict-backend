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

    // 1. FIFA VOLTA (3x3, 4x4, 5x5)
    if (type === 'FIFA Volta') {
      consignesSpecifiques = `
      C'est un match VOLTA / FORMAT RÉDUIT (3x3, 4x4, 5x5). Le nombre de buts est TRÈS ÉLEVÉ (souvent entre 8 et 18 buts au total).
      - Génère un score pour la 1ère Mi-temps (ex: 5-3) et la 2ème Mi-temps (ex: 4-5).
      - Le score total doit être très élevé (ex: 9-8, 7-6, 10-5).
      - Donne un pronostic type "Plus de 11.5 buts" ou "Plus de 5.5 buts en 1ère MT".
      `;
    } 
    // 2. JEU DE DÉS VIRTUELS (Pas de croupier !)
    else if (type === 'Jeu de Dés Virtuels') {
      consignesSpecifiques = `
      C'est un JEU DE DÉS VIRTUELS entre Joueur 1 (${homeTeam}) et Joueur 2 (${awayTeam}).
      - ATTENTION : IL N'Y A AUCUN CROUPIER ET AUCUN BUT DE FOOTBALL !
      - Analyse uniquement sous forme de POINTS DE DÉS et LANCERS.
      - Génère le score par lancer : Lancer 1 (ex: 11-8) et Lancer 2 (ex: 9-12).
      - Donne le Total de Points combinés prédit (ex: Plus de 35.5 points) et le Joueur Gagnant.
      `;
    } 
    // 3. JEU 21 / BLACKJACK (Croupier vs Joueur)
    else if (type && type.includes('Jeu 21')) {
      consignesSpecifiques = `
      C'est une partie de JEU 21 / BLACKJACK.
      - Affrontement direct : CROUPIER (${homeTeam}) vs JOUEUR (${awayTeam}).
      - Prédiction des cartes/points distribués (ex: Croupier 18 - Joueur 21).
      - Indique clairement le Gagnant de la manche (Croupier, Joueur ou Égalité/Bust).
      `;
    } 
    // 4. FIFA PENALTY
    else if (type === 'FIFA Penalty') {
      consignesSpecifiques = `
      C'est une séance de PENALTIES FIFA.
      - AUCUNE MI-TEMPS !
      - Génère un score exact de séance de tirs au but (ex: 4-3, 5-4).
      - Indique le nombre de penalties réussis / arrêtés.
      `;
    } 
    // 5. FOOTBALL RÉEL / CYBERLEAGUE (11v11)
    else {
      consignesSpecifiques = `
      C'est un match de Football (Réel ou Cyberleague 11v11).
      - Génère le score 1ère Mi-temps (MT1) et le Score Final (ex: MT1: 1-0 | Final: 2-1).
      - Pas de biais automatique à domicile : si l'équipe extérieure est favorite, prédis sa victoire.
      `;
    }

    const prompt = `
    Tu es un expert mondial en paris sportifs style 1XBet.
    Type de Jeu : ${type}
    Compétition / Contexte : ${championnat}
    Côté 1 : ${homeTeam}
    Côté 2 : ${awayTeam}

    ${consignesSpecifiques}

    Réponds STRICTEMENT au format JSON avec cette structure exacte :
    {
      "type_match": "${type}",
      "championnat": "${championnat}",
      "equipe_domicile": "${homeTeam}",
      "equipe_exterieur": "${awayTeam}",
      "taux_de_confiance": "ex: 88%",
      "pronostic_principal": "ex: Plus de 11.5 Buts / Gagnant Lancer 1 / Victoire Joueur 21",
      "score_exact_predit": "ex: MT1: 4-3 | MT2: 5-4 ou Lancer 1: 11-8 | Lancer 2: 9-12 ou Croupier 18 - Joueur 21",
      "probabilites": {
        "domicile": "ex: 45%",
        "nul": "ex: 10%",
        "exterieur": "ex: 45%"
      },
      "statistiques_avancees": {
        "possession_attendue": "ex: Tendance Lancer / Pression Croupier",
        "tirs_cadres_estimes": "ex: Total Buts / Points de Dés",
        "conseil_paris": "ex: Plus de 5.5 buts en MT1 / Croupier saute (Bust)"
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
