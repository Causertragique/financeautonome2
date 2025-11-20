# Configuration Google OAuth pour novafinances.app

## ⚠️ IMPORTANT : Deux configurations nécessaires

Il faut configurer **DEUX** endroits différents :
1. **Firebase Console** : Domaines autorisés pour Firebase Auth
2. **Google Cloud Console** : Origines JavaScript et URI de redirection pour OAuth

---

## 1. Firebase Console - Domaines autorisés

**Lien direct :** https://console.firebase.google.com/project/autonomev1-477910/authentication/settings

Allez dans **Firebase Console** > **Authentication** > **Settings** > **Authorized domains**

### Domaines à ajouter (OBLIGATOIRE) :

1. **Domaine Firebase Hosting (PRIORITAIRE) :**
   ```
   autonomev1-477910.web.app
   ```

2. **Domaine personnalisé (si configuré) :**
   ```
   novafinances.app
   www.novafinances.app
   ```

3. **Développement local (déjà présent normalement) :**
   ```
   localhost
   ```

---

## 2. Google Cloud Console - OAuth 2.0 Client IDs

**Lien direct :** https://console.cloud.google.com/apis/credentials?project=autonomev1-477910

Allez dans **Google Cloud Console** > **APIs & Services** > **Credentials**

Trouvez votre **OAuth 2.0 Client ID** (type "Application Web") et cliquez dessus pour l'éditer.

### Authorized JavaScript origins :

Ajoutez **TOUS** ces domaines :
```
https://autonomev1-477910.web.app
https://novafinances.app
https://www.novafinances.app
http://localhost:8080
http://localhost:5173
```

### Authorized redirect URIs :

Ajoutez **TOUTES** ces URLs :
```
https://autonomev1-477910.web.app/__/auth/handler
https://autonomev1-477910.web.app/__/auth/handler?mode=select
https://novafinances.app/__/auth/handler
https://novafinances.app/__/auth/handler?mode=select
https://www.novafinances.app/__/auth/handler
https://www.novafinances.app/__/auth/handler?mode=select
http://localhost:8080/__/auth/handler
http://localhost:8080/__/auth/handler?mode=select
http://localhost:5173/__/auth/handler
http://localhost:5173/__/auth/handler?mode=select
```

## 3. Vérification dans le code

Assurez-vous que votre fichier `.env` ou variables d'environnement contient :

```env
# Utilisez le domaine Firebase Hosting ou votre domaine personnalisé
VITE_FIREBASE_AUTH_DOMAIN=autonomev1-477910.web.app
# OU si vous utilisez un domaine personnalisé :
# VITE_FIREBASE_AUTH_DOMAIN=novafinances.app
```

## 4. Configuration Firebase Hosting (si applicable)

Si vous utilisez Firebase Hosting, ajoutez dans `firebase.json` :

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/__/auth/**",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          }
        ]
      }
    ]
  }
}
```

## 5. Vérification

Après configuration :
1. ⏱️ Attendez **1-2 minutes** pour que les changements soient propagés
2. 🔄 Rechargez la page de l'application (Ctrl + Shift + R)
3. 🔐 Testez la connexion avec Google sur :
   - `https://autonomev1-477910.web.app` (domaine Firebase)
   - `https://novafinances.app` (domaine personnalisé, si configuré)
4. 📋 Vérifiez les logs dans la console du navigateur (F12) pour les erreurs

## Notes importantes

- Les URLs doivent correspondre **exactement** (y compris le protocole http/https)
- Pas d'espace à la fin des URLs
- Les ports doivent être spécifiés pour localhost
- Attendez quelques minutes après les modifications pour que les changements prennent effet

