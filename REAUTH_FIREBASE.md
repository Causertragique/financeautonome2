# Réauthentification Firebase

## Problème
Vos identifiants Firebase ne sont plus valides. Vous devez vous reconnecter.

## Solution

### Étape 1 : Se reconnecter à Firebase

Exécutez cette commande dans le terminal :

```bash
firebase login --reauth
```

Cela ouvrira votre navigateur pour vous authentifier à nouveau.

### Étape 2 : Vérifier la connexion

Après la connexion, vérifiez que vous êtes bien connecté :

```bash
firebase projects:list
```

Vous devriez voir la liste de vos projets Firebase.

### Étape 3 : Redéployer

Une fois reconnecté, vous pouvez redéployer :

```bash
# Déployer uniquement le hosting
firebase deploy --only hosting

# Ou déployer tout
firebase deploy
```

## Si le problème persiste

### Option 1 : Se déconnecter et se reconnecter

```bash
firebase logout
firebase login
```

### Option 2 : Vérifier le projet actif

```bash
firebase use
```

Si ce n'est pas le bon projet :

```bash
firebase use autonomev1
```

## Note

L'erreur d'Artifact Registry que vous avez vue précédemment devrait être résolue maintenant que :
1. ✅ Le build du frontend est généré dans `dist/spa`
2. ✅ La configuration `firebase.json` pointe vers `dist/spa`
3. ⏳ Il reste à vous reconnecter et redéployer

