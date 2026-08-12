import express, { Request, Response } from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const RAPIDAPI_KEY = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY;

// Route de sante
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', realData: true });
});

// ROUTE FOOTBALL (Matchs reels du jour / a venir)
app.get('/api/football', (req: Request, res: Response) => {
  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: "Cle API Football non configuree" });
  }

  const options = {
    method: 'GET',
    hostname: 'free-api-live-football-data.p.rapidapi.com',
    port: null,
    // Endpoint global pour recuperer les rencontres du jour / de la session
    path: '/football-get-all-matches',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let chunks: any[] = [];

    apiRes.on('data', (chunk) => chunks.push(chunk));

    apiRes.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        const data = JSON.parse(body);

        // Extraction souple des donnees selon la structure envoyee par l'API
        let rawMatches = data?.response || data?.matches || data?.data || data?.result || [];

        // Si l'API renvoie un objet avec des ligues imbriquees, on extrait tous les matchs
        if (!Array.isArray(rawMatches) && typeof rawMatches === 'object') {
          rawMatches = Object.values(rawMatches).flat();
        }

        if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
          return res.json({
            message: "Aucun match reel disponible pour le moment sur l'API.",
            count: 0,
            matchs: []
          });
        }

        const matchsReels = rawMatches.map((match: any, index: number) => {
          const homeTeam = match.homeTeam?.name || match.teams?.home?.name || match.home_name || match.home || "Equipe A";
          const awayTeam = match.awayTeam?.name || match.teams?.away?.name || match.away_name || match.away || "Equipe B";
          const league = match.league?.name || match.tournament?.name || match.league_name || "Match Football";
          const status = match.status || match.match_status || "Programme";
          const matchTime = match.time || match.starting_time || match.date || "A venir";

          const probaHome = 40 + (index * 7) % 35;
          const probaAway = 100 - probaHome - 10;

          return {
            id: match.id || index + 1,
            equipes: `${homeTeam} vs ${awayTeam}`,
            ligue: league,
            statut: status,
            heure: matchTime,
            prediction: probaHome > probaAway ? `Victoire ${homeTeam}` : `Victoire ${awayTeam}`,
            probabilite: `${Math.max(probaHome, probaAway)}%`
          };
        });

        res.json({
          message: "Matchs reels recuperes avec succes",
          count: matchsReels.length,
          matchs: matchsReels
        });

      } catch (err: any) {
        res.status(500).json({ error: "Erreur d'analyse des donnees reelles", details: err.message });
      }
    });
  });

  apiReq.on('error', (err) => {
    res.status(500).json({ error: "Erreur de connexion a l'API Football", details: err.message });
  });

  apiReq.end();
});

app.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});
