# Solution rapide : Erreur "Non autorisé à créer un projet"

## ✅ Solution immédiate

### Étape 1 : Utiliser Firebase directement (PAS Google Cloud)

1. **Allez directement sur** : https://console.firebase.google.com/
2. **Ne passez PAS par Google Cloud Console**
3. Cliquez sur **"Ajouter un projet"** ou **"Add project"**

### Étape 2 : Choisir "Aucune organisation"

Lors de la création du projet :
- Si vous voyez un champ **"Organisation"** ou **"Location"**
- Sélectionnez **"No organization"** ou **"Aucune organisation"**
- OU sélectionnez votre **compte personnel** (votre email Gmail)

### Étape 3 : Utiliser un compte Google personnel

Si vous êtes connecté avec un compte d'entreprise/école :
1. Déconnectez-vous
2. Reconnectez-vous avec un **compte Gmail personnel**
3. Essayez de créer le projet à nouveau

## 🔍 Pourquoi cette erreur ?

Cette erreur apparaît quand :
- Vous essayez de créer un projet dans une organisation Google Cloud
- Vous n'avez pas les permissions "Project Creator" dans cette organisation
- Votre compte est lié à une organisation (entreprise/école) qui restreint la création de projets

## ✅ La solution

**Créer le projet directement dans votre compte personnel**, pas dans une organisation.

## 📝 Après avoir créé le projet

Une fois le projet créé :
1. Notez l'**ID du projet** (visible dans les paramètres)
2. Ouvrez `.firebaserc` dans votre projet
3. Remplacez `"your-project-id"` par l'ID réel de votre projet Firebase

Exemple :
```json
{
  "projects": {
    "default": "mon-projet-finance-12345"
  }
}
```

## 🚀 Ensuite

Vous pourrez déployer avec :
```bash
npm run firebase:deploy
```

## 🔐 Obtenir la permission "Project Creator"

Si vous avez besoin de la permission "Project Creator" dans votre organisation :

1. **Contactez l'administrateur** de votre organisation Google Workspace
2. **Demandez-lui** de vous attribuer le rôle "Project Creator"
3. **OU** demandez-lui de créer le projet pour vous

**Consultez `OBTENIR_PERMISSIONS.md` pour un guide détaillé.**

