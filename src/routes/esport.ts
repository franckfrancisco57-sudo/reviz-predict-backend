import { Router, Request, Response } from 'express';

const router = Router();

/**
 * ALGORITHME DE PRÉDICTION AVISE PREDIC POUR ESPORT / FIFA
 */
function genererPredictionFIFA(homeTeam: string, awayTeam: string, id: number) {
  const seed = (id + homeTeam.length * 3 + awayTeam.length * 7) % 100;
  
  let probaHome = 40 + (seed % 35);
  let probaAway = 100 - probaHome - 5; // Moins de nuls en jeux virtuels
  if (probaAway < 15) probaAway = 15;
  const probaNul = Math.max(0, 100 - probaHome - probaAway);

  let resultat = "";
  if (probaHome > probaAway && probaHome > probaNul) {
    resultat = `Victoire ${homeTeam}`;
  } else if (probaAway > probaHome && probaAway > probaNul) {
    resultat = `Victoire ${awayTeam}`;
  } else {
    resultat = "Match Nul";
  }

  const optionAlternative = seed % 2 === 0 ? "Plus de 2.5 buts" : "Les deux équipes marquent";

  return {
    prediction_principale: resultat,
    taux_de_confiance: `${Math.max(probaHome, probaAway, probaNul)}%`,
    prediction_alternative: optionAlternative,
    probabilites: {
      domicile: `${probaHome}%`,
      nul: `${probaNul}%`,
      exterieur: `${probaAway}%`
    }
  };
}

// ROUTE E-SPORT / FIFA LIVE
router.get('/', (req: Request, res: Response) => {
  const clubs = [
    "FC Barcelona (eSport)", "Real Madrid (eSport)", "PSG (eSport)", 
    "Bayern Munich (eSport)", "Manchester City (eSport)", "Arsenal (eSport)",
    "Juventus (eSport)", "Inter Milan (eSport)", "Liverpool (eSport)"
  ];

  const modesJeux = ["FIFA 8 Min", "eFootball 3x3", "Volta Express", "Penalty Series"];

  const matchsFIFA = [];
  const maintenant = new Date();

  // Génération des rencontres en continu 24h/24
  for (let i = 0; i < 8; i++) {
    const homeIndex = (i * 2) % clubs.length;
    let awayIndex = (i * 2 + 1) % clubs.length;
    if (homeIndex === awayIndex) awayIndex = (awayIndex + 1) % clubs.length;

    const homeTeam = clubs[homeIndex];
    const awayTeam = clubs[awayIndex];
    const mode = modesJeux[i % modesJeux.length];
    
    const horaire = new Date(maintenant.getTime() + i * 15 * 60000);
    const idMatchFIFA = 8000 + i;

    matchsFIFA.push({
      id_match: idMatchFIFA,
      categorie: "eSport / FIFA",
      mode_jeu: mode,
      horaire: horaire.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      rencontre: `${homeTeam} vs ${awayTeam}`,
      statut: i === 0 ? "EN DIRECT (LIVE)" : "À venir",
      analyse_avise_predic: genererPredictionFIFA(homeTeam, awayTeam, idMatchFIFA)
    });
  }

  res.json({
    plateforme: "Avise Predic - eSport FIFA Live",
    description: "Prédictions en continu sur les jeux virtuels FIFA/eFootball",
    total_matchs: matchsFIFA.length,
    matchs: matchsFIFA
  });
});

export default router;
