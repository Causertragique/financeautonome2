# Guide : Connecter Google Cloud Console à Firebase

## 🔍 Vérification de l'état actuel

Votre projet Firebase **"autonomev1"** est bien configuré et accessible via Firebase CLI.

## 🔗 Comprendre la relation Google Cloud ↔ Firebase

Firebase utilise Google Cloud Platform en arrière-plan. Chaque projet Firebase est aussi un projet Google Cloud, mais ils peuvent apparaître différemment dans les deux consoles.

## ✅ Solutions pour connecter les deux consoles

### Solution 1 : Accéder au projet via Google Cloud Console (Recommandé)

1. **Ouvrez Google Cloud Console** : [https://console.cloud.google.com](https://console.cloud.google.com)

2. **Sélectionnez le projet** :
   - Cliquez sur le sélecteur de projet en haut (à côté de "Google Cloud")
   - Dans la barre de recherche, tapez : **"autonomev1"**
   - Sélectionnez le projet dans les résultats

3. **Si le projet n'apparaît pas** :
   - Vérifiez que vous êtes connecté avec le même compte : **info@guillaumehetu.com**
   - Cliquez sur "NOUVEAU PROJET" puis "Sélectionner un projet"
   - Le projet Firebase devrait apparaître dans la liste

### Solution 2 : Activer les APIs nécessaires dans Google Cloud

Si vous voulez utiliser des services Google Cloud avec votre projet Firebase :

1. **Dans Google Cloud Console**, sélectionnez le projet "autonomev1"
2. Allez dans **"APIs & Services" > "Library"**
3. Activez les APIs dont vous avez besoin :
   - Firebase Management API
   - Cloud Resource Manager API
   - Toute autre API nécessaire

### Solution 3 : Lier Firebase à Google Cloud Console

1. **Ouvrez Firebase Console** : [https://console.firebase.google.com/project/autonomev1](https://console.firebase.google.com/project/autonomev1)

2. **Allez dans les paramètres du projet** :
   - Cliquez sur l'icône ⚙️ (Paramètres) à côté de "Project Overview"
   - Sélectionnez "Project settings"

3. **Vérifiez l'ID du projet Google Cloud** :
   - Dans l'onglet "General", vous verrez :
     - **Project ID** : `autonomev1`
     - **Project Number** : `111192972627`
   
4. **Ouvrir dans Google Cloud Console** :
   - Cliquez sur le lien "Open in Google Cloud Console" ou
   - Allez directement sur : [https://console.cloud.google.com/home/dashboard?project=autonomev1](https://console.cloud.google.com/home/dashboard?project=autonomev1)

### Solution 4 : Vérifier les permissions

Assurez-vous d'avoir les bonnes permissions :

1. **Dans Firebase Console** :
   - Vérifiez que vous êtes "Owner" ou "Editor" du projet
   - Paramètres du projet > "Users and permissions"

2. **Dans Google Cloud Console** :
   - Vérifiez votre rôle IAM
   - IAM & Admin > IAM
   - Vous devriez avoir au minimum le rôle "Editor" ou "Owner"

## 🚨 Problèmes courants et solutions

### Problème : "Le projet n'apparaît pas dans Google Cloud Console"

**Solutions :**
1. Vérifiez que vous êtes connecté avec le même compte Google
2. Attendez quelques minutes (la synchronisation peut prendre du temps)
3. Utilisez directement l'URL : `https://console.cloud.google.com/home/dashboard?project=autonomev1`
4. Rafraîchissez la page (F5)

### Problème : "Vous n'avez pas accès à ce projet"

**Solutions :**
1. Déconnectez-vous et reconnectez-vous avec le compte **info@guillaumehetu.com**
2. Vérifiez les permissions dans Firebase Console
3. Contactez le propriétaire du projet si nécessaire

### Problème : "Le projet existe dans Firebase mais pas dans Google Cloud"

**Note** : C'est normal ! Les projets Firebase peuvent exister sans être visibles dans Google Cloud Console tant qu'aucune API Google Cloud n'est activée.

**Solution** : Activez une API Google Cloud (comme Cloud Storage) pour que le projet apparaisse dans Google Cloud Console.

## 🔧 Commandes utiles

### Vérifier la connexion Firebase
```bash
npx firebase login:list
```

### Lister les projets Firebase
```bash
npx firebase projects:list
```

### Ouvrir Firebase Console
```bash
npx firebase open
```

### Ouvrir Google Cloud Console pour le projet
```bash
# Via navigateur, allez sur :
https://console.cloud.google.com/home/dashboard?project=autonomev1
```

## 📝 Accès direct aux consoles

- **Firebase Console** : [https://console.firebase.google.com/project/autonomev1](https://console.firebase.google.com/project/autonomev1)
- **Google Cloud Console** : [https://console.cloud.google.com/home/dashboard?project=autonomev1](https://console.cloud.google.com/home/dashboard?project=autonomev1)

## ✅ Vérification rapide

Pour vérifier que tout fonctionne :

1. ✅ **Firebase CLI** : Connecté avec `info@guillaumehetu.com`
2. ✅ **Projet Firebase** : `autonomev1` existe et est accessible
3. ⚠️ **Google Cloud Console** : Vérifiez l'accès via l'URL directe ci-dessus

## 💡 Note importante

Vous n'avez pas nécessairement besoin d'accéder à Google Cloud Console pour utiliser Firebase. La plupart des fonctionnalités Firebase sont accessibles via Firebase Console. Google Cloud Console est principalement utile pour :
- Gérer les APIs Google Cloud
- Configurer la facturation avancée
- Utiliser des services Google Cloud spécifiques (Cloud Functions, Cloud Storage, etc.)

