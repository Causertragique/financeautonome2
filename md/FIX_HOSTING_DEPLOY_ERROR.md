# Résoudre l'erreur de déploiement Firebase Hosting

## Erreur rencontrée

```
Une erreur s'est produite lors du chargement de /artifacts/tags/autonomev1-477910/us-east4/firebaseapphosting-images/financeautonome2/build-2025-11-17-000
```

## Causes possibles

1. **Permissions Artifact Registry manquantes**
2. **Build du frontend non généré**
3. **Configuration Firebase Hosting incorrecte**

## Solutions

### Solution 1 : Vérifier que le build du frontend existe

Avant de déployer, vous devez construire le frontend :

```bash
npm run build:client
# ou
pnpm build:client
```

Cela génère les fichiers dans le dossier `dist/spa` ou `public`.

### Solution 2 : Vérifier la configuration firebase.json

Assurez-vous que `firebase.json` pointe vers le bon dossier :

```json
{
  "hosting": {
    "public": "dist/spa",  // ou "public" selon votre config
    ...
  }
}
```

### Solution 3 : Activer Artifact Registry API

1. Allez dans [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez votre projet `autonomev1`
3. Allez dans **APIs et services** > **Bibliothèque**
4. Recherchez **Artifact Registry API**
5. Cliquez sur **Activer** si ce n'est pas déjà fait

### Solution 4 : Donner les permissions Artifact Registry

1. Allez dans **IAM et administration** > **IAM**
2. Trouvez votre compte utilisateur (celui avec lequel vous vous connectez)
3. Ajoutez le rôle : **Rédacteur Artifact Registry** (Artifact Registry Writer)

### Solution 5 : Déployer uniquement le hosting (sans functions)

Si le problème vient des functions, essayez de déployer uniquement le hosting :

```bash
firebase deploy --only hosting
```

### Solution 6 : Nettoyer et reconstruire

```bash
# Nettoyer les anciens builds
rm -rf dist
rm -rf public/*

# Reconstruire
npm run build:client

# Redéployer
firebase deploy --only hosting
```

### Solution 7 : Vérifier les quotas Artifact Registry

1. Allez dans **Artifact Registry** > **Settings**
2. Vérifiez que vous n'avez pas dépassé les limites de stockage
3. Si nécessaire, supprimez les anciennes images

## Déploiement étape par étape

### Option A : Déployer uniquement le frontend

```bash
# 1. Construire le frontend
npm run build:client

# 2. Déployer uniquement le hosting
firebase deploy --only hosting
```

### Option B : Déployer tout (si les functions fonctionnent)

```bash
# 1. Construire le frontend
npm run build:client

# 2. Déployer tout
firebase deploy
```

## Vérification

Après le déploiement, vérifiez que votre site est accessible :

1. Allez dans [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. Allez dans **Hosting**
4. Cliquez sur l'URL de votre site

## Si le problème persiste

1. **Vérifiez les logs** dans Firebase Console > Hosting > Deployments
2. **Vérifiez Artifact Registry** dans Google Cloud Console
3. **Contactez le support Firebase** avec le numéro de suivi : `c3212229022954195`

