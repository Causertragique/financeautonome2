# Dépannage : Le bouton Google ne fonctionne pas

## 🔍 Vérifications rapides

### 1. Vérifier les variables d'environnement

Ouvrez la console du navigateur (F12) et vérifiez les messages. Si vous voyez :
- `✗ manquant` pour certaines variables → **Problème de configuration**

**Solution** : Complétez votre fichier `.env` avec toutes les valeurs depuis Firebase Console :
1. Allez sur [Firebase Console](https://console.firebase.google.com/project/autonomev1/settings/general)
2. Project settings > Your apps
3. Copiez TOUTE la configuration JavaScript
4. Ajoutez les valeurs manquantes dans `.env` :
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID` (optionnel)

### 2. Vérifier que Firebase Auth est initialisé

Dans la console du navigateur, cherchez :
- ✅ `Firebase Auth initialisé avec succès` → OK
- ❌ `Firebase Auth n'est pas initialisé` → **Problème de configuration**

**Solution** : Vérifiez que toutes les variables d'environnement sont présentes et redémarrez le serveur :
```bash
pnpm dev
```

### 3. Activer l'authentification Google dans Firebase Console

**Étape obligatoire** :

1. Allez sur [Firebase Console](https://console.firebase.google.com/project/autonomev1/authentication/providers)
2. Cliquez sur **Authentication** dans le menu de gauche
3. Allez dans l'onglet **Sign-in method**
4. Cliquez sur **Google** dans la liste
5. **Activez le toggle** en haut à droite
6. **Laissez les champs vides** (Firebase génère automatiquement les identifiants)
7. Cliquez sur **Enregistrer**

### 4. Vérifier les domaines autorisés

Si vous obtenez l'erreur `auth/unauthorized-domain` :

1. Dans Firebase Console > Authentication > Settings
2. Section **Authorized domains**
3. Vérifiez que ces domaines sont présents :
   - `localhost` (pour le développement)
   - `autonomev1.web.app` (pour la production)
   - `autonomev1.firebaseapp.com` (pour la production)

Si `localhost` n'est pas présent, ajoutez-le.

## 🐛 Erreurs courantes et solutions

### Erreur : "Firebase Auth n'est pas initialisé"

**Cause** : Variables d'environnement manquantes ou vides

**Solution** :
1. Vérifiez votre fichier `.env` à la racine du projet
2. Assurez-vous que toutes les variables commencent par `VITE_FIREBASE_`
3. Redémarrez le serveur de développement

### Erreur : "auth/operation-not-allowed"

**Cause** : L'authentification Google n'est pas activée dans Firebase Console

**Solution** : Suivez l'étape 3 ci-dessus

### Erreur : "auth/unauthorized-domain"

**Cause** : Le domaine actuel n'est pas autorisé

**Solution** : 
- Pour le développement local : Vérifiez que `localhost` est dans les domaines autorisés
- Pour la production : Vérifiez que votre domaine est configuré

### Erreur : "auth/popup-blocked"

**Cause** : Le navigateur bloque les popups

**Solution** : Autorisez les popups pour `localhost:5173` (ou votre domaine)

### Erreur : "auth/popup-closed-by-user"

**Cause** : L'utilisateur a fermé la fenêtre de connexion

**Solution** : Réessayez et laissez la fenêtre ouverte

## ✅ Checklist de vérification

- [ ] Toutes les variables d'environnement sont présentes dans `.env`
- [ ] Le serveur de développement a été redémarré après modification de `.env`
- [ ] L'authentification Google est activée dans Firebase Console
- [ ] Les domaines autorisés incluent `localhost` (pour le dev)
- [ ] La console du navigateur ne montre pas d'erreurs Firebase
- [ ] Le message "✅ Firebase Auth initialisé avec succès" apparaît dans la console

## 🔗 Liens utiles

- [Firebase Console - Authentication](https://console.firebase.google.com/project/autonomev1/authentication/providers)
- [Firebase Console - Project Settings](https://console.firebase.google.com/project/autonomev1/settings/general)
- [Documentation Firebase Auth](https://firebase.google.com/docs/auth)

