# Rôles IAM nécessaires - Version française

## Rôles à ajouter au compte de service Cloud Build

Lorsque vous ajoutez des rôles dans Google Cloud Console, vous pouvez rechercher en français ou en anglais. Voici les rôles nécessaires avec leurs équivalents :

### 1. Compte de service Cloud Build
- **Nom anglais** : `Cloud Build Service Account`
- **Nom français** : `Compte de service Cloud Build`
- **ID du rôle** : `roles/cloudbuild.builds.builder`
- **Description** : Permet au compte de service de créer et gérer des builds Cloud Build

### 2. Utilisateur de compte de service
- **Nom anglais** : `Service Account User`
- **Nom français** : `Utilisateur de compte de service`
- **ID du rôle** : `roles/iam.serviceAccountUser`
- **Description** : Permet d'utiliser un compte de service pour accéder aux ressources

### 3. Rédacteur Artifact Registry
- **Nom anglais** : `Artifact Registry Writer`
- **Nom français** : `Rédacteur Artifact Registry`
- **ID du rôle** : `roles/artifactregistry.writer`
- **Description** : Permet de lire et écrire dans Artifact Registry (pour stocker les images Docker)

### 4. Développeur Cloud Run (optionnel mais recommandé)
- **Nom anglais** : `Cloud Run Developer`
- **Nom français** : `Développeur Cloud Run`
- **ID du rôle** : `roles/run.developer`
- **Description** : Permet de déployer et gérer des services Cloud Run

## Comment les ajouter dans Google Cloud Console

1. Allez dans **IAM et administration** > **IAM**
2. Trouvez le compte de service : `service-{NUMERO}@gcp-sa-cloudbuild.iam.gserviceaccount.com`
3. Cliquez sur l'icône **✏️ Modifier**
4. Cliquez sur **Ajouter un autre rôle**
5. Dans le champ de recherche, tapez le nom du rôle (en français ou en anglais)
6. Sélectionnez le rôle dans la liste
7. Répétez pour chaque rôle
8. Cliquez sur **Enregistrer**

## Recherche dans l'interface

Vous pouvez rechercher les rôles en utilisant :
- Le nom français : "Compte de service Cloud Build"
- Le nom anglais : "Cloud Build Service Account"
- L'ID du rôle : "cloudbuild.builds.builder"

L'interface Google Cloud Console affiche généralement les rôles dans la langue de votre interface, mais la recherche fonctionne dans les deux langues.

## Vérification

Après avoir ajouté les rôles, vous devriez voir dans la liste des rôles du compte de service :
- ✅ Compte de service Cloud Build
- ✅ Utilisateur de compte de service
- ✅ Rédacteur Artifact Registry
- ✅ Développeur Cloud Run (si ajouté)

