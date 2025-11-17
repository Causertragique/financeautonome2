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

### 5. Obtenir les clés API Firebase et configurer les variables d'environnement

Pour que l'application fonctionne, vous devez configurer les clés API Firebase dans un fichier `.env` à la racine du projet.

#### Étape 1 : Obtenir la configuration Firebase

**⚠️ Important** : Même si la clé API (`apiKey`) est techniquement une clé Google Cloud, vous devez obtenir **toute la configuration complète** depuis Firebase Console. Ne créez pas manuellement une clé API dans Google Cloud Console - utilisez celle fournie par Firebase.

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet (`autonomev1`)
3. Cliquez sur l'icône d'engrenage ⚙️ à côté de "Project Overview"
4. Sélectionnez **Project settings**
5. Faites défiler jusqu'à la section **Your apps**
6. Si vous n'avez pas encore d'app web, cliquez sur l'icône `</>` (Web) pour en ajouter une
7. Donnez un nom à votre app (ex: "Finance Autonome")
8. **Copiez TOUTE la configuration** qui apparaît (elle ressemble à ceci) :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "autonomev1.firebaseapp.com",
  projectId: "autonomev1",
  storageBucket: "autonomev1.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

#### Étape 2 : Créer le fichier `.env`

1. À la racine du projet, créez un fichier nommé `.env`
2. Ajoutez les variables suivantes en remplaçant les valeurs par celles de votre configuration Firebase :

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=autonomev1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=autonomev1
VITE_FIREBASE_STORAGE_BUCKET=autonomev1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**⚠️ Important** :
- Ne commitez **JAMAIS** le fichier `.env` dans Git (il devrait déjà être dans `.gitignore`)
- Le fichier `.env.example` est fourni comme modèle mais ne contient pas de vraies clés
- Pour la production, configurez ces variables dans votre plateforme de déploiement (Firebase Hosting, Vercel, etc.)
- **Toutes les valeurs sont nécessaires** : même si vous avez une clé API de Google Cloud Console, vous devez utiliser la configuration complète de Firebase qui inclut toutes les valeurs (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId)

#### Étape 3 : Vérifier la configuration

Après avoir créé le fichier `.env`, redémarrez le serveur de développement :

```bash
pnpm dev
```

Dans la console du navigateur, vous devriez voir des messages indiquant que les variables d'environnement Firebase sont présentes (✓ présent).

### 6. Construire et déployer

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

## Configuration de l'authentification Google

### Méthode 1 : Configuration automatique (RECOMMANDÉ)

Firebase génère automatiquement l'ID client OAuth. C'est la méthode la plus simple :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Sign-in method**
4. Cliquez sur **Google** dans la liste des fournisseurs
5. Activez le bouton toggle en haut à droite
6. **Laissez les champs "ID client OAuth" et "Code secret OAuth" VIDES**
7. Cliquez sur **Enregistrer**

Firebase créera automatiquement les identifiants nécessaires. C'est tout ! L'authentification Google fonctionnera immédiatement.

### Méthode 2 : Utiliser un ID client OAuth personnalisé

Si vous avez déjà un ID client OAuth (par exemple : `930736877384-rif97g3s4e2ulbkq7olvdo1i9ukr7i52.apps.googleusercontent.com`), vous pouvez l'utiliser :

**⚠️ Important** : Vous devez d'abord créer cet ID client dans [Google Cloud Console](https://console.cloud.google.com/) :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet Firebase (ou créez-en un)
3. Allez dans **APIs & Services** > **Credentials**
4. Cliquez sur **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Choisissez **Web application**
6. Configurez :
   - **Name** : Nom de votre application
   - **Authorized JavaScript origins** : 
     - `http://localhost:5173` (pour le développement)
     - `https://autonomev1.web.app` (pour la production)
   - **Authorized redirect URIs** :
     - `http://localhost:5173` (pour le développement)
     - `https://autonomev1.web.app` (pour la production)
7. Cliquez sur **Create**
8. Copiez l'**ID client** et le **Code secret**

Ensuite, dans Firebase Console :

1. Allez dans **Authentication** > **Sign-in method**
2. Cliquez sur **Google**
3. Activez le toggle
4. **Collez votre ID client OAuth** dans le champ correspondant
5. **Collez votre Code secret OAuth** dans le champ correspondant
6. Cliquez sur **Enregistrer**

### Erreurs courantes et solutions

**Erreur : "Invalid client ID" ou "Invalid client secret"**
- Vérifiez que vous avez copié l'ID et le secret sans espaces
- Assurez-vous que l'ID client a été créé dans le même projet Google Cloud que votre projet Firebase
- Vérifiez que les URI de redirection sont correctement configurées dans Google Cloud Console

**Erreur : "Redirect URI mismatch"**
- Vérifiez que les URI autorisées dans Google Cloud Console correspondent exactement à votre domaine
- Pour le développement local : `http://localhost:5173`
- Pour la production : `https://autonomev1.web.app`

**Recommandation** : Utilisez la **Méthode 1** (configuration automatique) sauf si vous avez une raison spécifique d'utiliser un ID client personnalisé.

L'authentification Google est déjà implémentée dans le code (`src/contexts/AuthContext.tsx` et `src/pages/Login.tsx`). Une fois activée dans la console Firebase, le bouton "Continuer avec Google" fonctionnera automatiquement.

## Notes importantes

- Assurez-vous que `dist/spa` contient les fichiers construits avant de déployer
- Le fichier `index.html` doit être dans `dist/spa`
- Les routes React Router sont configurées pour fonctionner en SPA (Single Page Application)

