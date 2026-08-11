import { Router } from 'express';

const router = Router();

// Route pour récupérer les prédictions e-sport
router.get('/', (req, res) => {
  res.json({
    message: "API Esport opérationnelle",
    predictions: []
  });
});

export default router;
