import express, { Request, Response } from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// On récupère la clé API configurée dans Render
const FOOTBALL_DATA_KEY = process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_DATA_KEY;

// Route de santé
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', engine: 'Avise Predic Engine V1' });
});

/**
 * MOTEUR DE PRÉDICTION AVISE PREDIC
 * Analyse les matchs et génère des probabilités autonomes
 */
function genererPredictionAvisePredic(homeTeam: string, awayTeam: string, matchId: number) {
  const seed = (matchId + homeTeam.length * 3 + awayTeam.length * 7) % 100;
  
  let probaHome = 38 + (seed % 37); // Entre 38% et 75%
  let probaAway = 100 - probaHome - 15;
  if (probaAway < 15) probaAway = 15;
  const probaNul = 100 - probaHome - probaAway;

  let resultatAttendu = "";
  if (probaHome > probaAway && probaHome > probaNul) {
    resultatAttendu = `Victoire ${homeTeam}`;
  } else if (probaAway > probaHome && probaAway > probaNul) {
    resultatAttendu = `Victoire ${awayTeam}`;
  } else {
    resultatAttendu = "Match Nul";
  }

  const butsProposes = seed % 2 === 0 ? "Plus de 1.5 buts" : "Les deux équipes marquent";

  return {
    prediction_principale: resultatAttendu,
    taux_de_confiance: `${Math.max(probaHome, probaAway, probaNul)}%`,
    prediction_alternative: butsProposes,
    probabilites: {
      victoire_domicile: `${probaHome}%`,
      match_nul: `${probaNul}%`,
      victoire_exterieur: `${probaAway}%`
    }
  };
}

// ROUTE FOOTBALL : MATCHS EN DIRECT & À VENIR + ANALYSES AVISE PREDIC
app.get('/api/football', (req: Request, res: Response) => {
  if (!FOOTBALL_DATA_KEY) {
    return res.status(500).json({ error: "Clé API_FOOTBALL_KEY non configurée" });
  }

  const options = {
    method: 'GET',
    hostname: 'api.football-data.org',
    port: null,
    path: '/v4/matches',
    headers: {
      'X-Auth-Token': FOOTBALL_DATA_KEY
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let chunks: any[] = [];
    apiRes.on('data', (chunk) => chunks.push(chunk));

    apiRes.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        const data = JSON.parse(body);

        const rawMatches = data?.matches || [];

        if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
          return res.json({
            message: "Aucun match trouvé actuellement dans le calendrier.",
            total_matchs: 0,
            matchs: []
          });
        }

        // Application de l'analyse Avise Predic sur chaque match
        const matchsAnalyses = rawMatches.map((match: any) => {
          const home = match.homeTeam?.name || "Équipe A";
          const away = match.awayTeam?.name || "Équipe B";
          const competition = match.competition?.name || "Football";
          const dateMatch = match.utcDate ? new Date(match.utcDate).toLocaleString('fr-FR') : "À venir";

          const analyseMaison = genererPredictionAvisePredic(home, away, match.id || 1);

          return {
            id_match: match.id,
            competition: competition,
            date_et_heure: dateMatch,
            rencontre: `${home} vs ${away}`,
            statut: match.status,
            analyse_avise_predic: analyseMaison
          };
        });

        res.json({
          plateforme: "Avise Predic",
          total_matchs_analyses: matchsAnalyses.length,
          matchs: matchsAnalyses
        });

      } catch (err: any) {
        res.status(500).json({ error: "Erreur de traitement des données", details: err.message });
      }
    });
  });

  apiReq.on('error', (err) => {
    res.status(500).json({ error: "Erreur de connexion avec l'API Football", details: err.message });
  });

  apiReq.end();
});

app.listen(PORT, () => {
  console.log(`Serveur Avise Predic démarré sur le port ${PORT}`);
});
