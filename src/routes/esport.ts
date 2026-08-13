import { Router, Request, Response } from 'express';

const router = Router();

router.post('/analyser', async (req: Request, res: Response) => {
  try {
    const { homeTeam, awayTeam, championnat, type, numPartie } = req.body;

    let consignes = '';

    if (type === 'Jeu 21') {
      const joueur = homeTeam || 'Joueur';
      const croupier = awayTeam || 'Croupier';
      consignes = `Analyse de Jeu 21 : Joueur=${joueur}, Croupier=${croupier}, Partie=${numPartie || 'N/A'}`;
    } else {
      consignes = `Analyse eSport : ${homeTeam} vs ${awayTeam} (${championnat || type})`;
    }

    res.json({
      status: 'ok',
      message: 'Route eSport valide',
      consignes
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
