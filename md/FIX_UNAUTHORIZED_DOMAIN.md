# Corriger l'erreur "unauthorized-domain"

## Problème
Erreur : `Firebase: Error (auth/unauthorized-domain)`

Cela signifie que le domaine Firebase Hosting n'est pas autorisé pour l'authentification.

## Solution : Ajouter le domaine dans Firebase Console

### Étape 1 : Accéder à la configuration d'authentification

**Lien direct :** https://console.firebase.google.com/project/autonomev1-477910/authentication/settings

**Ou manuellement :**
1. Allez sur : https://console.firebase.google.com/project/autonomev1-477910
2. Cliquez sur **Authentication** (Authentification) dans le menu de gauche
3. Cliquez sur l'onglet **Settings** (Paramètres)
4. Faites défiler jusqu'à la section **Authorized domains** (Domaines autorisés)

### Étape 2 : Ajouter les domaines

Cliquez sur le bouton **Add domain** (Ajouter un domaine) et ajoutez **un par un** :

1. **Domaine Firebase Hosting (OBLIGATOIRE) :**
   ```
   autonomev1-477910.web.app
   ```

2. **Domaine personnalisé (si configuré) :**
   ```
   novafinances.app
   www.novafinances.app
   ```

### Étape 3 : Vérifier les domaines existants

Les domaines suivants devraient déjà être présents :
- ✅ `localhost` (pour le développement local)
- ✅ `autonomev1-477910.firebaseapp.com` (domaine alternatif Firebase)

### Étape 4 : Sauvegarder

Les changements sont sauvegardés automatiquement. Vous pouvez fermer la fenêtre.

## Domaines à ajouter (IMPORTANT)

**Ajoutez au minimum :**
```
autonomev1-477910.web.app
```

**Si vous utilisez un domaine personnalisé, ajoutez aussi :**
```
novafinances.app
www.novafinances.app
```

## Vérification

Après avoir ajouté les domaines :
1. ⏱️ Attendez **30 secondes à 1 minute** pour que les changements soient propagés
2. 🔄 Rechargez la page de l'application (Ctrl + Shift + R)
3. 🔐 Essayez de vous connecter avec Google

L'erreur `auth/unauthorized-domain` devrait disparaître.

## Note importante

Les domaines autorisés dans **Firebase Console** sont différents des domaines autorisés dans **Google Cloud Console OAuth**. Les deux doivent être configurés :

- **Firebase Console** : Domaines autorisés pour Firebase Auth (c'est ce qu'on fait maintenant)
- **Google Cloud Console** : Origines JavaScript autorisées et URI de redirection pour OAuth (voir `GOOGLE_OAUTH_SETUP.md`)

## Capture d'écran de référence

Dans Firebase Console > Authentication > Settings > Authorized domains, vous devriez voir une liste avec un bouton "Add domain" en bas.

