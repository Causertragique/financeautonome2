# Activer Firebase Storage

## Erreur
```
Firebase Storage has not been set up on project 'autonomev1-477910'
```

## Solution : Activer Firebase Storage

### Étape 1 : Accéder à Firebase Console

1. Allez sur [Firebase Console - Storage](https://console.firebase.google.com/project/autonomev1-477910/storage)
2. Cliquez sur **Get Started** (Commencer)

### Étape 2 : Configurer Firebase Storage

1. **Choisir l'emplacement (Location) :**
   - Sélectionnez une région proche de vous (ex: `us-central1`, `us-east1`, `europe-west1`)
   - **Important :** Choisissez la même région que vos Functions si possible (`us-central1`)

2. **Mode de sécurité :**
   - **Mode test** : Permet l'accès pendant 30 jours (pour tester)
   - **Mode production** : Utilise les règles de sécurité (recommandé)
   - Pour l'instant, choisissez **Mode test** pour activer rapidement

3. Cliquez sur **Done** (Terminé)

### Étape 3 : Vérifier l'activation

Après activation, vous devriez voir :
- ✅ Firebase Storage activé
- Un bucket créé automatiquement

### Étape 4 : Redéployer

Une fois Storage activé, redéployez :

```bash
firebase deploy
```

## Note importante

Si vous choisissez le **Mode test**, n'oubliez pas de :
1. Configurer les règles de sécurité dans `storage.rules`
2. Passer en mode production après les tests

## Règles de sécurité

Vos règles sont déjà configurées dans `storage.rules`. Une fois Storage activé, elles seront automatiquement appliquées.

## Alternative : Activer via gcloud CLI

Si vous avez `gcloud` installé :

```bash
gcloud services enable storage-component.googleapis.com --project=autonomev1-477910
```

Mais la méthode recommandée est via la console Firebase.

