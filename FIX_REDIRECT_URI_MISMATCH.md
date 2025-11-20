# Corriger l'erreur "redirect_uri_mismatch"

## 🔍 Diagnostic

L'erreur `redirect_uri_mismatch` signifie que l'URI de redirection utilisée par Firebase Auth ne correspond pas à celles configurées dans Google Cloud Console.

## ✅ Solution : Ajouter l'URI de redirection dans Google Cloud Console

### Étape 1 : Identifier l'URI utilisée

L'URI de redirection Firebase Auth suit ce format :
```
https://[VOTRE_DOMAINE]/__/auth/handler
```

**Pour le développement local :**
```
http://localhost:[PORT]/__/auth/handler
```

### Étape 2 : Accéder à Google Cloud Console

**Lien direct :** https://console.cloud.google.com/apis/credentials?project=autonomev1-477910

**Ou manuellement :**
1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez le projet : `autonomev1-477910`
3. Allez dans **APIs & Services** > **Credentials**
4. Trouvez votre **OAuth 2.0 Client ID** (type "Application Web")
5. Cliquez dessus pour l'éditer

### Étape 3 : Ajouter les URI de redirection

Dans la section **Authorized redirect URIs**, ajoutez **TOUTES** ces URLs (une par ligne) :

#### Pour la production (Firebase Hosting) :
```
https://autonomev1-477910.web.app/__/auth/handler
https://autonomev1-477910.web.app/__/auth/handler?mode=select
```

#### Pour le domaine personnalisé (si configuré) :
```
https://novafinances.app/__/auth/handler
https://novafinances.app/__/auth/handler?mode=select
https://www.novafinances.app/__/auth/handler
https://www.novafinances.app/__/auth/handler?mode=select
```

#### Pour le développement local :
```
http://localhost:8080/__/auth/handler
http://localhost:8080/__/auth/handler?mode=select
http://localhost:5173/__/auth/handler
http://localhost:5173/__/auth/handler?mode=select
```

### Étape 4 : Ajouter les origines JavaScript autorisées

Dans la section **Authorized JavaScript origins**, ajoutez **TOUS** ces domaines (sans le chemin `/__/auth/handler`) :

```
https://autonomev1-477910.web.app
https://novafinances.app
https://www.novafinances.app
http://localhost:8080
http://localhost:5173
```

### Étape 5 : Enregistrer

Cliquez sur **Save** (Enregistrer) en bas de la page.

## 🔍 Vérifier l'URI utilisée

Pour identifier l'URI exacte utilisée par votre application :

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Network** (Réseau)
3. Tentez une connexion Google
4. Cherchez une requête vers `accounts.google.com` ou `oauth2`
5. Regardez le paramètre `redirect_uri` dans l'URL ou les paramètres de la requête

L'URI doit correspondre **exactement** à une de celles configurées dans Google Cloud Console.

## ⚠️ Points importants

### 1. Correspondance exacte
- L'URI doit correspondre **exactement** (y compris le protocole `http://` ou `https://`)
- Pas d'espace à la fin
- Le port doit être spécifié pour localhost (ex: `:8080`, `:5173`)

### 2. Protocole
- **Production** : Utilisez toujours `https://`
- **Développement local** : Utilisez `http://` avec le port

### 3. Format Firebase Auth
Les URI Firebase Auth suivent toujours ce format :
- `[DOMAINE]/__/auth/handler`
- `[DOMAINE]/__/auth/handler?mode=select`

### 4. Propagation des changements
- ⏱️ Attendez **1-2 minutes** après avoir enregistré les changements
- 🔄 Rechargez la page (Ctrl + Shift + R)
- 🔐 Réessayez la connexion

## 🐛 Erreurs courantes

### Erreur : "redirect_uri_mismatch" avec localhost

**Cause** : Le port utilisé ne correspond pas

**Solution** :
1. Vérifiez le port utilisé par votre serveur de développement
2. Vérifiez dans la console du navigateur l'URI exacte utilisée
3. Ajoutez l'URI avec le bon port dans Google Cloud Console

### Erreur : "redirect_uri_mismatch" en production

**Cause** : Le domaine ne correspond pas

**Solution** :
1. Vérifiez le domaine dans `VITE_FIREBASE_AUTH_DOMAIN` dans votre `.env`
2. Assurez-vous que l'URI `https://[DOMAINE]/__/auth/handler` est dans Google Cloud Console
3. Vérifiez que vous utilisez `https://` et non `http://`

### Erreur : Espaces ou caractères incorrects

**Cause** : Copie-collage avec espaces

**Solution** :
1. Vérifiez qu'il n'y a pas d'espaces avant ou après l'URI
2. Recopiez l'URI exactement comme indiqué ci-dessus
3. Vérifiez qu'il n'y a pas de caractères invisibles

## ✅ Checklist de vérification

- [ ] Toutes les URI de redirection sont ajoutées dans Google Cloud Console
- [ ] Les origines JavaScript sont configurées
- [ ] Les URI correspondent exactement (protocole, domaine, port)
- [ ] Pas d'espaces dans les URI
- [ ] Attente de 1-2 minutes après modification
- [ ] Page rechargée (Ctrl + Shift + R)
- [ ] Test de connexion effectué

## 🔗 Liens utiles

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=autonomev1-477910)
- [Firebase Console - Authentication Settings](https://console.firebase.google.com/project/autonomev1-477910/authentication/settings)
- [Documentation Firebase Auth - OAuth](https://firebase.google.com/docs/auth/web/google-signin)

## 📝 Exemple complet de configuration

Voici un exemple de ce que vous devriez voir dans Google Cloud Console :

**Authorized JavaScript origins :**
```
https://autonomev1-477910.web.app
https://novafinances.app
https://www.novafinances.app
http://localhost:8080
http://localhost:5173
```

**Authorized redirect URIs :**
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

