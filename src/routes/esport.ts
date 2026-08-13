// Exemple de correction pour le Jeu 21 dans esport.ts
if (type === 'Jeu 21') {
  // Côté 1 = Joueur / Côté 2 = Croupier
  const joueur = homeTeam || 'Joueur 1';
  const croupier = awayTeam || 'Croupier';

  prompt = `
    Analyse de Jeu 21 :
    - JOUEUR (Côté 1) : ${joueur}
    - CROUPIER (Côté 2) : ${croupier}
    
    Donne le pronostic sous la forme "Points Joueur vs Points Croupier" (ex: Joueur 20 - Croupier 17).
  `;
}
