# Vérifier les logs de build pour identifier le problème

## Étape 1 : Accéder aux logs de build

1. Allez sur [Google Cloud Console - Cloud Build](https://console.cloud.google.com/cloud-build/builds?project=111192972627)
2. Cliquez sur le build qui a échoué (le plus récent)
3. Regardez les **logs** pour voir l'erreur exacte

## Étape 2 : Identifier la permission manquante

Dans les logs, cherchez des messages comme :
- "Permission denied"
- "Missing permission"
- "Service account does not have permission"

## Solutions courantes

### Solution 1 : Vérifier le compte de service Cloud Build

1. Allez dans **IAM et administration** > **IAM**
2. Trouvez : `service-111192972627@gcp-sa-cloudbuild.iam.gserviceaccount.com`
3. Vérifiez qu'il a bien ces rôles :
   - ✅ Compte de service Cloud Build
   - ✅ Utilisateur de compte de service
   - ✅ Rédacteur Artifact Registry
   - ✅ Développeur Cloud Run

### Solution 2 : Activer toutes les APIs nécessaires

1. Allez dans **APIs et services** > **Bibliothèque**
2. Vérifiez que ces APIs sont **activées** :
   - ✅ Cloud Build API
   - ✅ Cloud Run API
   - ✅ Eventarc API
   - ✅ Artifact Registry API
   - ✅ Pub/Sub API
   - ✅ Cloud Functions API

### Solution 3 : Vérifier les politiques d'organisation

Si vous êtes dans une organisation Google Workspace, il peut y avoir des restrictions :

1. Allez dans **IAM et administration** > **Politiques d'organisation**
2. Vérifiez qu'il n'y a pas de restrictions sur :
   - Cloud Build
   - Cloud Run
   - Service Accounts

### Solution 4 : Donner le rôle "Owner" temporairement

**ATTENTION :** Cette solution est temporaire et doit être retirée après le déploiement.

1. Allez dans **IAM et administration** > **IAM**
2. Trouvez le compte Cloud Build
3. Ajoutez temporairement le rôle **Propriétaire** (Owner)
4. Déployez
5. **Retirez immédiatement** le rôle Owner après le déploiement réussi

## Alternative : Utiliser Firebase Functions v1

Si le problème persiste, on peut revenir à Functions v1 qui nécessite moins de permissions :

1. Modifier `functions/src/index.ts` pour utiliser v1
2. Modifier `firebase.json` pour utiliser v1

Dites-moi si vous voulez que je fasse cette modification.

