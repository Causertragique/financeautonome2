# Rôles pour les comptes de service GCP - Firebase Functions

## Comptes de service à configurer

### 1. Compte de service Cloud Build
**Nom du compte :** `service-{PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com`

**Rôles à ajouter :**
- ✅ **Compte de service Cloud Build** (`roles/cloudbuild.builds.builder`)
- ✅ **Utilisateur de compte de service** (`roles/iam.serviceAccountUser`)
- ✅ **Rédacteur Artifact Registry** (`roles/artifactregistry.writer`)
- ✅ **Développeur Cloud Run** (`roles/run.developer`) - optionnel mais recommandé

**Pourquoi :** Ce compte est utilisé pour construire et déployer vos fonctions.

---

### 2. Compte de service Compute Engine (par défaut)
**Nom du compte :** `{PROJECT_NUMBER}-compute@developer.gserviceaccount.com`

**Rôles à ajouter :**
- ✅ **Utilisateur de compte de service** (`roles/iam.serviceAccountUser`)
- ✅ **Développeur Cloud Run** (`roles/run.developer`)

**Pourquoi :** Ce compte est utilisé pour exécuter les fonctions déployées.

---

### 3. Compte de service Firebase (si présent)
**Nom du compte :** `firebase-adminsdk-{RANDOM}@{PROJECT_ID}.iam.gserviceaccount.com`

**Rôles à ajouter :**
- ✅ **Administrateur Firestore** (`roles/datastore.owner`) - généralement déjà présent
- ✅ **Administrateur Storage** (`roles/storage.admin`) - généralement déjà présent

**Pourquoi :** Ce compte est utilisé par Firebase Admin SDK dans vos fonctions.

---

## Comment trouver les numéros de projet

### Méthode 1 : Dans Google Cloud Console
1. Allez dans **IAM et administration** > **Paramètres**
2. Le **Numéro de projet** est affiché en haut

### Méthode 2 : Dans Firebase Console
1. Allez dans **Paramètres du projet** (icône ⚙️)
2. Le **ID du projet** et le **Numéro de projet** sont affichés

---

## Configuration étape par étape

### Étape 1 : Identifier les comptes de service

1. Allez dans **IAM et administration** > **IAM**
2. Dans la liste, cherchez les comptes qui commencent par :
   - `service-` (Cloud Build)
   - `{NUMERO}-compute@` (Compute Engine)
   - `firebase-adminsdk-` (Firebase)

### Étape 2 : Ajouter les rôles au compte Cloud Build

1. Trouvez : `service-{NUMERO}@gcp-sa-cloudbuild.iam.gserviceaccount.com`
2. Cliquez sur **✏️ Modifier**
3. Cliquez sur **Ajouter un autre rôle**
4. Ajoutez ces 4 rôles :
   - Compte de service Cloud Build
   - Utilisateur de compte de service
   - Rédacteur Artifact Registry
   - Développeur Cloud Run
5. Cliquez sur **Enregistrer**

### Étape 3 : Vérifier le compte Compute Engine

1. Trouvez : `{NUMERO}-compute@developer.gserviceaccount.com`
2. Vérifiez qu'il a au minimum :
   - Utilisateur de compte de service
   - Développeur Cloud Run
3. Si manquant, ajoutez-les de la même manière

---

## Rôles minimaux requis pour le déploiement

**Pour que le déploiement fonctionne, le compte Cloud Build doit avoir :**

1. **Compte de service Cloud Build** - Pour construire les fonctions
2. **Utilisateur de compte de service** - Pour utiliser d'autres comptes de service
3. **Rédacteur Artifact Registry** - Pour stocker les images Docker

**Les autres rôles sont recommandés pour un fonctionnement optimal.**

---

## Vérification après configuration

Après avoir ajouté les rôles :

1. Attendez 2-3 minutes pour la propagation
2. Essayez de déployer :
   ```bash
   firebase deploy --only functions
   ```
3. Si ça fonctionne, vous verrez :
   ```
   ✔ functions[api(us-central1)] Successful create operation.
   ```

---

## Dépannage

### Erreur : "Permission denied"
- Vérifiez que vous avez bien ajouté tous les rôles
- Attendez quelques minutes après l'ajout des rôles

### Erreur : "Service account not found"
- Vérifiez que les APIs sont activées (Cloud Build, Cloud Run, etc.)
- Le compte de service Cloud Build est créé automatiquement quand vous activez Cloud Build API

### Erreur : "Build failed"
- Vérifiez les logs dans **Cloud Build** > **History**
- Assurez-vous que le compte Cloud Build a le rôle "Rédacteur Artifact Registry"

---

## Résumé rapide

**Compte principal à configurer :**
- `service-{NUMERO}@gcp-sa-cloudbuild.iam.gserviceaccount.com`
- Ajoutez les 4 rôles listés ci-dessus

C'est le compte le plus important pour le déploiement des Functions !

