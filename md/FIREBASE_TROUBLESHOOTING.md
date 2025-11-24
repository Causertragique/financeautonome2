# Guide de dépannage - Création de projet Firebase

Si vous rencontrez des difficultés pour créer un projet Firebase, voici plusieurs solutions :

## ⚠️ Erreur : "Vous n'êtes pas autorisé à créer un projet dans cet emplacement"

Cette erreur survient généralement lorsque vous essayez de créer un projet dans une organisation Google Cloud sans les permissions nécessaires.

### Solution 1 : Créer un projet sans organisation (RECOMMANDÉ)

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet" ou "Add project"
3. **Important** : Lors de la création, si vous voyez un sélecteur "Organisation" ou "Location", choisissez :
   - **"No organization"** ou **"Aucune organisation"**
   - Ou sélectionnez votre compte personnel (votre email) plutôt qu'une organisation
4. Continuez la création du projet normalement

### Solution 2 : Utiliser Firebase directement (pas Google Cloud)

1. **Ne passez PAS par Google Cloud Console**
2. Allez directement sur [Firebase Console](https://console.firebase.google.com/)
3. Firebase créera automatiquement le projet dans votre compte personnel
4. Vous n'aurez pas besoin de permissions d'organisation

### Solution 3 : Vérifier votre compte

Si vous êtes connecté avec un compte d'entreprise/école :
1. Déconnectez-vous de Firebase/Google Cloud
2. Connectez-vous avec un compte Google **personnel** (Gmail)
3. Essayez de créer le projet à nouveau

### Solution 4 : Demander les permissions

Si vous devez absolument utiliser une organisation :
1. Contactez l'administrateur de votre organisation Google Cloud
2. Demandez le rôle "Project Creator" ou "Owner"
3. Ou demandez-lui de créer le projet pour vous

### Solution 5 : Créer via Firebase CLI (sans organisation)

```bash
# 1. Se connecter avec votre compte personnel
npx firebase login

# 2. Lister vos projets existants
npx firebase projects:list

# 3. Si vous n'avez pas de projet, Firebase CLI peut parfois créer un projet
# mais cela nécessite généralement aussi des permissions Google Cloud
```

**Note** : La création via CLI nécessite aussi des permissions Google Cloud, donc cette solution peut ne pas fonctionner non plus.

## Problèmes courants et solutions

### 1. Problème : "Vous n'avez pas les permissions nécessaires"

**Solutions :**
- Vérifiez que vous êtes connecté avec le bon compte Google
- Assurez-vous que votre compte Google a accès à Firebase
- Essayez de vous déconnecter et reconnecter à Firebase Console

**Étapes :**
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur votre avatar en haut à droite
3. Sélectionnez "Se déconnecter" (ou "Sign out")
4. Reconnectez-vous avec votre compte Google

### 2. Problème : "Limite de projets atteinte"

**Solutions :**
- Firebase gratuit permet jusqu'à 30 projets par compte
- Si vous avez atteint la limite, vous pouvez :
  - Supprimer un projet existant non utilisé
  - Utiliser un projet existant
  - Créer un nouveau compte Google (non recommandé pour la production)

### 3. Problème : Erreur lors de la création du projet

**Solutions :**
- Videz le cache de votre navigateur
- Essayez un autre navigateur (Chrome, Firefox, Edge)
- Désactivez temporairement les extensions de navigateur
- Essayez en mode navigation privée

### 4. Problème : Le bouton "Créer un projet" ne fonctionne pas

**Solutions :**
- Attendez quelques secondes et réessayez
- Rafraîchissez la page (F5)
- Vérifiez votre connexion Internet
- Essayez depuis un autre réseau

## Alternative : Utiliser un projet existant

Si vous avez déjà un projet Firebase, vous pouvez l'utiliser :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez un projet existant dans la liste
3. Notez l'ID du projet (visible dans les paramètres du projet)
4. Mettez à jour `.firebaserc` avec cet ID

## Alternative : Créer via Firebase CLI

Si l'interface web ne fonctionne pas, vous pouvez créer le projet via la ligne de commande :

```bash
# 1. Se connecter à Firebase
npx firebase login

# 2. Créer un nouveau projet (si vous avez les permissions)
npx firebase projects:create VOTRE_PROJET_ID --display-name "Nom de votre projet"

# 3. Initialiser Firebase Hosting
npx firebase init hosting
```

**Note :** La création de projet via CLI nécessite un compte Google Cloud avec facturation activée (même si vous restez dans le plan gratuit).

## Alternative : Utiliser Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur le sélecteur de projet en haut
3. Cliquez sur "NOUVEAU PROJET"
4. Remplissez les informations :
   - Nom du projet
   - Organisation (optionnel)
5. Cliquez sur "CRÉER"
6. Une fois créé, allez sur [Firebase Console](https://console.firebase.google.com/)
7. Cliquez sur "Ajouter un projet"
8. Sélectionnez "Utiliser un projet Google Cloud existant"
9. Choisissez le projet que vous venez de créer

## Vérification de votre compte

Assurez-vous que :
- Votre compte Google est actif et vérifié
- Vous n'êtes pas en mode "Invité" ou "Compte enfant"
- Votre compte a accès aux services Google Cloud

## Solution temporaire : Développement local uniquement

Si vous ne pouvez pas créer de projet Firebase pour le moment, vous pouvez :

1. **Développer localement** avec `pnpm dev`
2. **Construire l'application** avec `pnpm build:client`
3. **Tester localement** avec `pnpm start` ou un serveur local

Vous pourrez déployer sur Firebase plus tard une fois le projet créé.

## Contact support

Si aucun de ces problèmes ne s'applique :
- [Support Firebase](https://firebase.google.com/support)
- [Communauté Firebase](https://firebase.google.com/community)

## Configuration manuelle sans projet Firebase

Si vous voulez quand même configurer les fichiers pour plus tard :

1. Créez un fichier `.firebaserc` avec un ID de projet temporaire :
```json
{
  "projects": {
    "default": "mon-projet-temporaire"
  }
}
```

2. Quand vous aurez créé votre projet, remplacez `"mon-projet-temporaire"` par l'ID réel.

