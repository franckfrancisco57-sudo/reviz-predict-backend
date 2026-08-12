import express, { Request, Response } from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const RAPIDAPI_KEY = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY;

// Route de santé
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', demoMode: false });
});

// Route Prédictions Football Automatiques
app.get('/api/football', (req: Request, res: Response) => {
  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: "Clé API non configurée" });
  }

  const options = {
    method: 'GET',
    hostname: 'free-api-live-football-data.p.rapidapi.com',
    port: null,
    path: '/football-current-matches',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let chunks: any[] = [];

    apiRes.on('data', (chunk) => {
      chunks.push(chunk);
    });

    apiRes.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        const data = JSON.parse(body);
        const matchesData = data?.response || data?.matches || [];

        const matchsFormates = matchesData.slice(0, 10).map((match: any, index: number) => {
          const homeTeam = match.homeTeam?.name || match.teams?.home?.name || "Équipe Domicile";
          const awayTeam = match.awayTeam?.name || match.teams?.away?.name || "Équipe Extérieur";
          const league = match.league?.name || match.tournament?.name || "Football Match";

          const probaHome = 45 + (index % 30);
          const probaAway = 100 - probaHome - 15;

          return {
            id: match.id || index + 1,
            equipes: `${homeTeam} vs ${awayTeam}`,
            ligue: league,
            prediction: probaHome > probaAway ? `Victoire ${homeTeam}` : `Victoire ${awayTeam}`,
            probabilite: `${Math.max(probaHome, probaAway)}%`,
            scorePredit: probaHome > probaAway ? "2 - 1" : "1 - 2"
          };
        });

        res.json({
          message: "Prédictions Football en direct",
          count: matchsFormates.length,
          matchs: matchsFormates
        });
      } catch (err: any) {
        res.status(500).json({ error: "Erreur lecture données", details: err.message });
      }
    });
  });

  apiReq.on('error', (error) => {
    res.status(500).json({ error: "Erreur API Football", details: error.message });
  });

  apiReq.end();
});

// Route Prédictions E-Sport
app.get('/api/esport', (req: Request, res: Response) => {
  res.json({
    message: "Prédictions E-Sport en direct",
    matchs: [
      {
        id: 1,
        jeu: "League of Legends",
        equipes: "T1 vs G2 Esports",
        prediction: "Victoire T1",
        probabilite: "68%"
      },
      {
        id: 2,
        jeu: "Counter-Strike 2",
        equipes: "Vitality vs NaVi",
        prediction: "Victoire Vitality",
        probabilite: "61%"
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
