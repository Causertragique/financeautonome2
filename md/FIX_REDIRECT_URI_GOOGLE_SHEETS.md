# Corriger l'erreur redirect_uri pour Google Sheets

## Erreur

```
redirect_uri=http://localhost:8082/integrations/callback/google_sheets
flowName=GeneralOAuthFlow
```

Cette erreur signifie que le redirect URI utilisé n'est pas autorisé dans Google Cloud Console.

## Solution

### Étape 1 : Vérifier le redirect URI utilisé

Le redirect URI est généré automatiquement à partir de :
- `VITE_APP_BASE_URL` (si défini dans `.env`)
- Sinon, `window.location.origin` (le domaine actuel)

Pour voir le redirect URI utilisé, ouvrez la console du navigateur et cherchez :
```
🔍 OAuth Redirect URI: { ... }
```

### Étape 2 : Ajouter le redirect URI dans Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Trouvez votre **OAuth 2.0 Client ID** (celui utilisé pour Google Sheets)
5. Cliquez dessus pour l'éditer
6. Dans la section **Authorized redirect URIs**, ajoutez :

**Pour le développement :**
```
http://localhost:8082/integrations/callback/google_sheets
```

**Pour la production :**
```
https://novafinances.app/integrations/callback/google_sheets
```

**Note :** Si vous utilisez un autre port en développement, ajoutez aussi :
```
http://localhost:8080/integrations/callback/google_sheets
http://localhost:5173/integrations/callback/google_sheets
```

### Étape 3 : Sauvegarder et tester

1. Cliquez sur **Save** dans Google Cloud Console
2. Attendez quelques secondes pour que les changements soient propagés
3. Réessayez de connecter Google Sheets

### Étape 4 : Vérifier la configuration

Assurez-vous que votre fichier `.env` contient :
```env
VITE_GOOGLE_SHEETS_CLIENT_ID=votre_client_id
VITE_GOOGLE_SHEETS_CLIENT_SECRET=votre_client_secret
# OU
VITE_GOOGLE_CLIENT_ID=votre_client_id
VITE_GOOGLE_CLIENT_SECRET=votre_client_secret
```

## Redirect URIs à ajouter (liste complète)

Pour être sûr, ajoutez tous ces redirect URIs dans Google Cloud Console :

**Développement :**
- `http://localhost:8080/integrations/callback/google_sheets`
- `http://localhost:8082/integrations/callback/google_sheets`
- `http://localhost:5173/integrations/callback/google_sheets`

**Production :**
- `https://novafinances.app/integrations/callback/google_sheets`
- `https://www.novafinances.app/integrations/callback/google_sheets` (si vous utilisez www)

## Important

- Les redirect URIs doivent correspondre **exactement** (protocole, domaine, port, chemin)
- Les changements dans Google Cloud Console peuvent prendre quelques secondes à se propager
- Redémarrez le serveur de développement après modification du `.env`

