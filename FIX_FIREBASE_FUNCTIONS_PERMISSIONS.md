# Guide : Résoudre les permissions Firebase Functions

## Problème
Le déploiement des Functions échoue avec l'erreur :
```
Build failed with status: FAILURE. Could not build the function due to a missing permission on the build service account.
```

## Solution étape par étape

### Étape 1 : Accéder à Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. **Sélectionnez votre projet** : `autonomev1` (ou le nom de votre projet Firebase)
   - Si vous ne voyez pas le projet, cliquez sur le sélecteur de projet en haut

### Étape 2 : Activer les APIs nécessaires

1. Allez dans **APIs & Services** > **Library** (ou **API et services** > **Bibliothèque**)
2. Recherchez et activez ces APIs une par une :
   - **Cloud Build API** - Cliquez sur "Enable"
   - **Cloud Run API** - Cliquez sur "Enable"
   - **Eventarc API** - Cliquez sur "Enable"
   - **Artifact Registry API** - Cliquez sur "Enable"
   - **Pub/Sub API** - Cliquez sur "Enable"

### Étape 3 : Configurer les permissions IAM

1. Allez dans **IAM & Admin** > **IAM** (ou **IAM et administration** > **IAM**)
2. Dans la liste des comptes de service, trouvez :
   - `{PROJECT_NUMBER}-compute@developer.gserviceaccount.com`
   - `service-{PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com`
   
   **Note** : Remplacez `{PROJECT_NUMBER}` par le numéro de votre projet (visible dans l'URL ou dans les détails du projet)

3. Pour chaque compte de service, cliquez sur l'icône **✏️ Edit** (crayon)

4. Cliquez sur **ADD ANOTHER ROLE** (ou **Ajouter un autre rôle**)

5. Ajoutez ces rôles pour le compte Cloud Build :
   - `Compte de service Cloud Build` (Cloud Build Service Account)
   - `Utilisateur de compte de service` (Service Account User)
   - `Rédacteur Artifact Registry` (Artifact Registry Writer)
   - `Développeur Cloud Run` (Cloud Run Developer) - si disponible
   
   **Note** : Dans l'interface, vous pouvez rechercher en anglais ou en français. Les rôles peuvent apparaître dans les deux langues.

6. Cliquez sur **SAVE** (ou **Enregistrer**)

### Étape 4 : Vérifier le compte de service Cloud Build

1. Allez dans **Cloud Build** > **Settings** (ou **Paramètres**)
2. Vérifiez que le compte de service Cloud Build est activé
3. Si nécessaire, cliquez sur **Enable** pour activer Cloud Build

### Étape 5 : Alternative - Utiliser gcloud CLI

Si vous avez `gcloud` installé, exécutez ces commandes :

```bash
# Activer les APIs
gcloud services enable cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  eventarc.googleapis.com \
  pubsub.googleapis.com \
  --project=autonomev1

# Obtenir le numéro de projet
gcloud projects describe autonomev1 --format="value(projectNumber)"

# Donner les permissions au compte de service Cloud Build
# Remplacez {PROJECT_NUMBER} par le numéro obtenu ci-dessus
gcloud projects add-iam-policy-binding autonomev1 \
  --member="serviceAccount:{PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding autonomev1 \
  --member="serviceAccount:{PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageConsumer"

# Rôles en français (équivalents) :
# - roles/cloudbuild.builds.builder = "Constructeur de builds Cloud Build"
# - roles/serviceusage.serviceUsageConsumer = "Consommateur d'utilisation de service"
```

### Étape 6 : Redéployer

Après avoir configuré les permissions, attendez 2-3 minutes puis :

```bash
firebase deploy --only functions
```

## Vérification

Pour vérifier que tout est correct :

1. Allez dans **Cloud Build** > **History**
2. Vous devriez voir les builds en cours ou réussis
3. Si un build échoue, cliquez dessus pour voir les détails de l'erreur

## Si le problème persiste

1. **Vérifiez les logs de build** :
   - Allez dans **Cloud Build** > **History**
   - Cliquez sur le build qui a échoué
   - Lisez les logs pour identifier le problème exact

2. **Vérifiez les quotas** :
   - Allez dans **IAM & Admin** > **Quotas**
   - Vérifiez que vous n'avez pas dépassé les limites

3. **Contactez le support Firebase** :
   - Si vous êtes sur un plan payant, contactez le support
   - Sinon, consultez la [documentation Firebase](https://firebase.google.com/docs/functions/troubleshooting)

## Notes importantes

- Les changements de permissions peuvent prendre quelques minutes à se propager
- Assurez-vous d'être connecté avec un compte qui a les droits d'administrateur sur le projet
- Si vous utilisez une organisation Google Workspace, vous pourriez avoir besoin de permissions supplémentaires

