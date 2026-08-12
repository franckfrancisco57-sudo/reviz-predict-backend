import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MOTEUR D'ANALYSE ET DE GÉNÉRATION STATISTIQUE IA
function genererAnalyseMatchIA(homeTeam: string, awayTeam: string, matchId: number) {
  const seed = (matchId * 17 + homeTeam.length * 7 + awayTeam.length * 13) % 100;
  
  // Calcul des probabilités 1N2
  let pHome = 35 + (seed % 42);
  let pAway = 85 - pHome;
  if (pAway < 15) pAway = 18;
  const pNul = Math.max(10, 100 - pHome - pAway);

  // Score exact estimé par l'IA
  const butsHome = (seed % 3) + (pHome > pAway ? 1 : 0);
  const butsAway = ((seed + 2) % 3) + (pAway > pHome ? 1 : 0);
  const scorePredit = `${butsHome} - ${butsAway}`;

  // Pronostic
  let pronostic = "";
  if (pHome > pAway && pHome > pNul) {
    pronostic = `Victoire ${homeTeam}`;
  } else if (pAway > pHome && pAway > pNul) {
    pronostic = `Victoire ${awayTeam}`;
  } else {
    pronostic = "Match Nul / Double Chance";
  }

  const confiance = Math.min(95, Math.max(pHome, pAway) + 15);

  return {
    pronostic_principal: pronostic,
    score_exact_predit: scorePredit,
    taux_de_confiance: `${confiance}%`,
    probabilites: {
      domicile: `${pHome}%`,
      nul: `${pNul}%`,
      exterieur: `${pAway}%`
    },
    statistiques_avancees: {
      possession_attendue: `${52 + (seed % 15) - 7}% / ${48 - (seed % 15) + 7}%`,
      tirs_cadres_estimes: `${4 + (seed % 4)} vs ${3 + ((seed + 1) % 4)}`,
      forme_recente_domicile: `${Math.min(5, 3 + (seed % 3))}/5 victoires`,
      forme_recente_exterieur: `${Math.min(5, 2 + ((seed + 1) % 4))}/5 victoires`,
      conseil_paris: butsHome + butsAway >= 3 ? "Plus de 2.5 Buts" : "Moins de 3.5 Buts"
    }
  };
}

// ROUTE FOOTBALL : STRUCTURÉE PAR CHAMPIONNATS
app.get('/api/football', (req: Request, res: Response) => {
  const championnats = [
    {
      nom: "UEFA Champions League",
      pays: "🇪🇺 Europe",
      matchs: [
        { id: 201, home: "Real Madrid", away: "Manchester City", heure: "21:00" },
        { id: 202, home: "FC Barcelona", away: "Bayern Munich", heure: "21:00" }
      ]
    },
    {
      nom: "Premier League",
      pays: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",
      matchs: [
        { id: 203, home: "Arsenal", away: "Liverpool", heure: "17:30" },
        { id: 204, home: "Chelsea", away: "Tottenham", heure: "20:00" }
      ]
    },
    {
      nom: "Ligue 1",
      pays: "🇫🇷 France",
      matchs: [
        { id: 205, home: "Paris Saint-Germain", away: "Marseille", heure: "20:45" },
        { id: 206, home: "Lyon", away: "Monaco", heure: "17:00" }
      ]
    },
    {
      nom: "La Liga",
      pays: "🇪🇸 Espagne",
      matchs: [
        { id: 207, home: "Atletico Madrid", away: "Sevilla", heure: "18:30" }
      ]
    }
  ];

  const donneesStructurees = championnats.map(champ => ({
    championnat: champ.nom,
    pays: champ.pays,
    total_matchs: champ.matchs.length,
    matchs: champ.matchs.map(m => ({
      id_match: m.id,
      rencontre: `${m.home} vs ${m.away}`,
      equipe_domicile: m.home,
      equipe_exterieur: m.away,
      horaire: m.heure,
      analyse_ia: genererAnalyseMatchIA(m.home, m.away, m.id)
    }))
  }));

  res.json({
    status: "ok",
    type: "Football Réel",
    championnats: donneesStructurees
  });
});

// ROUTE ESPORT FIFA : STRUCTURÉE PAR COMPÉTITIONS VIRTUELLES
app.get('/api/esport', (req: Request, res: Response) => {
  const liguesEsport = [
    {
      nom: "FIFA ePremier League 8 Min",
      matchs: [
        { id: 801, home: "Man City (eSport)", away: "Arsenal (eSport)", heure: "En Direct" },
        { id: 802, home: "Liverpool (eSport)", away: "Chelsea (eSport)", heure: "18:15" }
      ]
    },
    {
      nom: "eFootball Volta Express 3x3",
      matchs: [
        { id: 803, home: "Barça (eSport)", away: "Real Madrid (eSport)", heure: "18:25" }
      ]
    }
  ];

  const donneesEsport = liguesEsport.map(champ => ({
    championnat: champ.nom,
    pays: "🎮 Virtuel 24/7",
    total_matchs: champ.matchs.length,
    matchs: champ.matchs.map(m => ({
      id_match: m.id,
      rencontre: `${m.home} vs ${m.away}`,
      equipe_domicile: m.home,
      equipe_exterieur: m.away,
      horaire: m.heure,
      analyse_ia: genererAnalyseMatchIA(m.home, m.away, m.id)
    }))
  }));

  res.json({
    status: "ok",
    type: "FIFA eSport",
    championnats: donneesEsport
  });
});

app.listen(PORT, () => {
  console.log(`Serveur Avise Predic opérationnel sur le port ${PORT}`);
});
