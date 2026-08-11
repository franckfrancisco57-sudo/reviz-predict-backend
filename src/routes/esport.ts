import { Router } from 'express';

const router = Router();

// Route pour récupérer les prédictions football
router.get('/', (req, res) => {
  res.json({
    message: "API Football opérationnelle",
    predictions: []
  });
});

export default router;
