# Configuration du Backend pour Firebase Functions

## Structure créée

```
functions/
├── src/
│   └── index.ts          # Code du backend Express
├── package.json          # Dépendances du backend
└── tsconfig.json         # Configuration TypeScript
```

## Installation

1. **Installer les dépendances du backend :**
```bash
cd functions
npm install
```

2. **Compiler le TypeScript :**
```bash
npm run build
```

## Déploiement

### Déployer uniquement les fonctions :
```bash
firebase deploy --only functions
```

### Déployer tout (hosting + functions) :
```bash
firebase deploy
```

## URLs du Backend

### En production :
```
https://novafinances.app/api/ping
https://novafinances.app/api/demo
https://novafinances.app/api/payment-methods
```

### En développement local (émulateur) :
```bash
npm run serve
# Les fonctions seront disponibles sur http://localhost:5001
```

## Routes API disponibles

- `GET /api/ping` - Test de connexion
- `GET /api/demo` - Route de démonstration
- `GET /api/payment-methods?userId={userId}` - Liste des modes de paiement
- `POST /api/payment-methods` - Créer un mode de paiement
- `DELETE /api/payment-methods/:id?userId={userId}` - Supprimer un mode de paiement

## Configuration Firebase

Le fichier `firebase.json` a été mis à jour pour :
- Inclure la configuration des functions
- Rediriger toutes les requêtes `/api/**` vers la fonction `api`

## Notes importantes

1. **Runtime Node.js** : Les functions utilisent Node.js 20
2. **CORS** : CORS est activé pour permettre les requêtes depuis le frontend
3. **Firebase Admin** : Le backend utilise Firebase Admin SDK pour accéder à Firestore
4. **Sécurité** : Les règles Firestore s'appliquent toujours, le backend doit respecter les permissions

## Ajouter de nouvelles routes

Pour ajouter de nouvelles routes API :

1. Modifiez `functions/src/index.ts`
2. Ajoutez votre route Express (ex: `app.get("/ma-route", handler)`)
3. Compilez : `npm run build` (dans le dossier functions)
4. Déployez : `firebase deploy --only functions`

## Commandes utiles

```bash
# Voir les logs des functions
firebase functions:log

# Tester localement
cd functions
npm run serve

# Déployer uniquement les functions
firebase deploy --only functions

# Déployer tout
firebase deploy
```

