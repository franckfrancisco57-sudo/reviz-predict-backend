import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ALGORITHME D'ANALYSE SPORTIVE ET ESPORT AVISE PREDIC
function calculerAnalyseAvisePredic(
  homeTeam: string, 
  awayTeam: string, 
  championnat: string, 
  type: 'football' | 'esport'
) {
  const cleanHome = homeTeam.trim().toLowerCase();
  const cleanAway = awayTeam.trim().toLowerCase();
  
  // Génération d'une empreinte numérique unique basée sur les noms des équipes et la date
  let hash = 0;
  const str = cleanHome + 'vs' + cleanAway + championnat + type + new Date().toISOString().slice(0, 10);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash) % 100;

  // Ajustement pour les spécificités du mode eSport (matchs plus prolifiques)
  const estEsport = type === 'esport';
  
  // Calcul des forces et probabilités
  let pHome = 35 + (seed % 40);
  let pAway = 85 - pHome;
  if (pAway < 15) pAway = 20;
  const pNul = Math.max(10, 100 - pHome - pAway);

  // Estimation du nombre de buts
  let bonusButs = estEsport ? 1 : 0;
  let butsHome = (seed % 3) + (pHome > pAway ? 1 : 0) + bonusButs;
  let butsAway = ((seed + 2) % 3) + (pAway > pHome ? 1 : 0) + bonusButs;

  // Ajustement pour éviter les scores irréalistes
  if (!estEsport && butsHome > 4) butsHome = 3;
  if (!estEsport && butsAway > 4) butsAway = 2;

  // Pronostic principal
  let pronostic = "";
  if (pHome >= pAway + 10) {
    pronostic = `Victoire ${homeTeam}`;
  } else if (pAway >= pHome + 10) {
    pronostic = `Victoire ${awayTeam}`;
  } else {
    pronostic = `Match Nul ou Double Chance (${homeTeam}/${awayTeam})`;
  }

  const confiance = Math.min(95, Math.max(pHome, pAway) + (estEsport ? 12 : 18));
  const totalButs = butsHome + butsAway;

  return {
    equipe_domicile: homeTeam,
    equipe_exterieur: awayTeam,
    championnat: championnat,
    type_match: estEsport ? "🎮 FIFA eSport" : "⚽ Football Réel",
    pronostic_principal: pronostic,
    score_exact_predit: `${butsHome} - ${butsAway}`,
    taux_de_confiance: `${confiance}%`,
    probabilites: {
      domicile: `${pHome}%`,
      nul: `${pNul}%`,
      exterieur: `${pAway}%`
    },
    statistiques_avancees: {
      possession_attendue: `${52 + (seed % 14) - 7}% / ${48 - (seed % 14) + 7}%`,
      tirs_cadres_estimes: estEsport 
        ? `${6 + (seed % 5)} vs ${5 + ((seed + 1) % 4)}` 
        : `${4 + (seed % 4)} vs ${3 + ((seed + 1) % 4)}`,
      forme_recente_domicile: `${Math.min(5, 3 + (seed % 3))}/5 victoires`,
      forme_recente_exterieur: `${Math.min(5, 2 + ((seed + 1) % 4))}/5 victoires`,
      conseil_paris: totalButs >= 3 ? "Plus de 2.5 Buts (Over 2.5)" : "Moins de 2.5 Buts (Under 2.5)"
    }
  };
}

// ROUTE D'ANALYSE DYNAMIQUE À LA DEMANDE
app.post('/api/analyser', (req: Request, res: Response) => {
  const { homeTeam, awayTeam, championnat, type } = req.body;

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ 
      error: "Veuillez fournir le nom des deux équipes (homeTeam et awayTeam)." 
    });
  }

  const nomChampionnat = championnat || "Championnat Officiel";
  const typeMatch = type === 'esport' ? 'esport' : 'football';

  const analyse = calculerAnalyseAvisePredic(homeTeam, awayTeam, nomChampionnat, typeMatch);

  res.json({
    status: "ok",
    analyse: analyse
  });
});

app.listen(PORT, () => {
  console.log(`Serveur Avise Predic (Analyseur Interactif) opérationnel sur le port ${PORT}`);
});
