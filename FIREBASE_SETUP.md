# Configuration Firebase

Ce guide vous explique comment configurer et déployer votre application sur Firebase Hosting.

## Prérequis

1. Avoir un compte Google
2. Installer Firebase CLI globalement (optionnel) :
   ```bash
   npm install -g firebase-tools
   ```
   Ou utiliser la version locale via pnpm :
   ```bash
   pnpm firebase --version
   ```

## Étapes de configuration

### 1. Se connecter à Firebase

```bash
npx firebase login
```

### 2. Créer un projet Firebase

**Option A : Via l'interface web (recommandé)**

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet" ou "Add project"
3. Suivez les instructions pour créer votre projet :
   - Entrez un nom de projet
   - Configurez Google Analytics (optionnel, vous pouvez le désactiver)
   - Attendez la création du projet
4. Notez l'ID de votre projet (visible dans les paramètres)

**Option B : Via Google Cloud Console**

Si l'interface Firebase ne fonctionne pas :
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet
3. Ensuite, allez sur Firebase Console et ajoutez Firebase au projet Google Cloud

**Option C : Utiliser un projet existant**

Si vous avez déjà un projet Firebase :
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet existant
3. Notez l'ID du projet

**⚠️ Si vous rencontrez des problèmes, consultez `FIREBASE_TROUBLESHOOTING.md`**

### 3. Initialiser Firebase dans le projet

```bash
firebase init hosting
```

Lors de l'initialisation :
- Sélectionnez "Use an existing project" et choisissez votre projet
- Pour "What do you want to use as your public directory?", entrez : `dist/spa`
- Pour "Configure as a single-page app (rewrite all urls to /index.html)?", répondez : `Yes`
- Pour "Set up automatic builds and deploys with GitHub?", répondez : `No` (ou `Yes` si vous voulez)

### 4. Mettre à jour `.firebaserc`

Ouvrez `.firebaserc` et remplacez `"your-project-id"` par l'ID réel de votre projet Firebase.

### 5. Construire et déployer

```bash
# Construire l'application
pnpm build:client

# Déployer sur Firebase Hosting
pnpm firebase:deploy
```

Ou en une seule commande :
```bash
pnpm firebase:deploy
```

## Commandes utiles

- `pnpm firebase:deploy` - Construire et déployer l'application
- `pnpm firebase:serve` - Servir l'application localement avec Firebase
- `firebase deploy --only hosting` - Déployer uniquement le hosting
- `firebase open` - Ouvrir la console Firebase dans le navigateur

## Structure de déploiement

- **Répertoire public** : `dist/spa` (généré par `vite build`)
- **Fichier de configuration** : `firebase.json`
- **Fichier de projet** : `.firebaserc`

## Notes importantes

- Assurez-vous que `dist/spa` contient les fichiers construits avant de déployer
- Le fichier `index.html` doit être dans `dist/spa`
- Les routes React Router sont configurées pour fonctionner en SPA (Single Page Application)

