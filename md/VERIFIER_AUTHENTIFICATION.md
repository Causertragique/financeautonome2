# Vérification de l'authentification Firebase

## 🔍 Diagnostic rapide

### 1. Utiliser l'outil de diagnostic intégré

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
diagnoseAuth()
```

Cet outil vérifie automatiquement :
- ✅ Les variables d'environnement
- ✅ L'initialisation Firebase
- ✅ Le domaine actuel
- ✅ L'état de l'authentification

### 2. Vérifications manuelles

#### A. Variables d'environnement

Vérifiez que votre fichier `.env` contient toutes les variables requises :

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Important** : Après modification de `.env`, redémarrez le serveur :
```bash
pnpm dev
```

#### B. Console du navigateur

Ouvrez la console (F12) et vérifiez les messages :

- ✅ `✅ Firebase Auth initialisé avec succès` → OK
- ❌ `❌ Variables d'environnement Firebase manquantes` → Vérifiez `.env`
- ❌ `❌ Firebase Auth n'est pas initialisé` → Problème de configuration

#### C. Firebase Console - Domaines autorisés

1. Allez sur : https://console.firebase.google.com/project/autonomev1-477910/authentication/settings
2. Section **Authorized domains**
3. Vérifiez que ces domaines sont présents :
   - `localhost` (pour le développement)
   - `autonomev1-477910.web.app` (pour la production)
   - `autonomev1-477910.firebaseapp.com` (pour la production)
   - Votre domaine personnalisé si configuré

**Voir** : `FIX_UNAUTHORIZED_DOMAIN.md` pour plus de détails

#### D. Firebase Console - Méthode de connexion Google

1. Allez sur : https://console.firebase.google.com/project/autonomev1-477910/authentication/providers
2. Cliquez sur **Google** dans la liste
3. Vérifiez que le toggle est **activé** (en haut à droite)
4. Si désactivé, activez-le et enregistrez

## 🐛 Erreurs courantes et solutions

### Erreur : "Firebase Auth n'est pas initialisé"

**Causes possibles** :
- Variables d'environnement manquantes dans `.env`
- Serveur non redémarré après modification de `.env`
- Fichier `.env` mal formaté

**Solution** :
1. Vérifiez que toutes les variables `VITE_FIREBASE_*` sont présentes
2. Redémarrez le serveur : `pnpm dev`
3. Utilisez `diagnoseAuth()` dans la console pour vérifier

### Erreur : "auth/unauthorized-domain"

**Cause** : Le domaine actuel n'est pas autorisé dans Firebase Console

**Solution** :
1. Notez le domaine affiché dans l'erreur
2. Allez dans Firebase Console > Authentication > Settings > Authorized domains
3. Ajoutez le domaine manquant
4. Attendez 30 secondes et réessayez

**Voir** : `FIX_UNAUTHORIZED_DOMAIN.md`

### Erreur : "auth/operation-not-allowed"

**Cause** : L'authentification Google n'est pas activée

**Solution** :
1. Firebase Console > Authentication > Sign-in method
2. Cliquez sur **Google**
3. Activez le toggle
4. Enregistrez

### Erreur : "auth/popup-blocked"

**Cause** : Le navigateur bloque les popups

**Solution** :
1. Autorisez les popups pour votre domaine dans les paramètres du navigateur
2. Réessayez la connexion

### Erreur : "auth/popup-closed-by-user"

**Cause** : L'utilisateur a fermé la fenêtre de connexion

**Solution** : Réessayez et laissez la fenêtre ouverte

## ✅ Checklist de vérification

- [ ] Toutes les variables `VITE_FIREBASE_*` sont définies dans `.env`
- [ ] Le serveur a été redémarré après modification de `.env`
- [ ] La console affiche `✅ Firebase Auth initialisé avec succès`
- [ ] `diagnoseAuth()` ne montre aucune erreur
- [ ] Le domaine actuel est dans les domaines autorisés Firebase
- [ ] L'authentification Google est activée dans Firebase Console
- [ ] Aucune erreur dans la console du navigateur

## 🔗 Liens utiles

- [Firebase Console - Authentication Settings](https://console.firebase.google.com/project/autonomev1-477910/authentication/settings)
- [Firebase Console - Sign-in Methods](https://console.firebase.google.com/project/autonomev1-477910/authentication/providers)
- [Documentation Firebase Auth](https://firebase.google.com/docs/auth)

## 📝 Notes

- Les modifications dans Firebase Console peuvent prendre 30 secondes à 1 minute pour être propagées
- Utilisez toujours `diagnoseAuth()` dans la console pour un diagnostic complet
- Les erreurs sont maintenant plus détaillées avec des messages explicites et des solutions

