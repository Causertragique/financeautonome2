# Configuration des Intégrations

Ce document explique comment configurer les clés API nécessaires pour les intégrations.

## Variables d'environnement requises

Ajoutez les variables suivantes à votre fichier `.env` à la racine du projet :

### Configuration générale

#### Base URL - Domaine client (Customer-facing domain)
```env
# Entrez le domaine client pour la production
# Exemple: https://novafinances.app
VITE_APP_BASE_URL=https://novafinances.app
# Pour le développement, laissez vide ou utilisez http://localhost:8080
# Si vide, l'application utilisera automatiquement window.location.origin
```

### Agrégation bancaire

#### Flinks
```env
VITE_FLINKS_CLIENT_ID=votre_client_id_flinks
VITE_FLINKS_CLIENT_SECRET=votre_client_secret_flinks
```

#### Plaid
```env
VITE_PLAID_CLIENT_ID=votre_client_id_plaid
VITE_PLAID_CLIENT_SECRET=votre_client_secret_plaid
```

#### Yodlee
```env
VITE_YODLEE_CLIENT_ID=votre_client_id_yodlee
VITE_YODLEE_CLIENT_SECRET=votre_client_secret_yodlee
```

#### Saltedge
```env
# Saltedge utilise une clé API unique (pas OAuth)
# La clé sera demandée lors de la connexion
```

### Comptabilité

#### QuickBooks
```env
VITE_QUICKBOOKS_CLIENT_ID=votre_client_id_quickbooks
VITE_QUICKBOOKS_CLIENT_SECRET=votre_client_secret_quickbooks
```

#### FreshBooks
```env
VITE_FRESHBOOKS_CLIENT_ID=votre_client_id_freshbooks
VITE_FRESHBOOKS_CLIENT_SECRET=votre_client_secret_freshbooks
```

### Export/Import

#### Google Sheets
```env
VITE_GOOGLE_SHEETS_CLIENT_ID=votre_client_id_google
VITE_GOOGLE_SHEETS_CLIENT_SECRET=votre_client_secret_google
```

#### Microsoft Excel
```env
# Excel utilise l'export direct (pas de clé API requise)
```

### Automatisation

#### Notion
```env
VITE_NOTION_CLIENT_ID=votre_client_id_notion
VITE_NOTION_CLIENT_SECRET=votre_client_secret_notion
```

#### Zapier
```env
# Zapier utilise un lien externe (pas de clé API requise)
```

### Services gouvernementaux

#### Revenu Québec
```env
# Revenu Québec utilise une clé API unique
# La clé sera demandée lors de la connexion
```

#### ARC (Agence du revenu du Canada)
```env
# ARC utilise une clé API unique
# La clé sera demandée lors de la connexion
```

## Comment obtenir les clés API

### Flinks
1. Créez un compte sur [Flinks](https://flinks.com)
2. Accédez au tableau de bord développeur
3. Créez une nouvelle application
4. Copiez le Client ID et Client Secret

### Plaid
1. Créez un compte sur [Plaid](https://plaid.com)
2. Accédez au Dashboard
3. Créez une nouvelle application
4. Copiez le Client ID et Secret

### Yodlee
1. Créez un compte développeur sur [Yodlee](https://developer.yodlee.com)
2. Créez une application
3. Obtenez vos credentials OAuth

### QuickBooks
1. Créez un compte développeur sur [Intuit Developer](https://developer.intuit.com)
2. Créez une nouvelle application
3. Configurez les redirect URIs pour les deux environnements :
   - Développement : `http://localhost:8080/integrations/callback/quickbooks`
   - Production : `https://novafinances.app/integrations/callback/quickbooks`
4. Copiez le Client ID et Client Secret

### FreshBooks
1. Créez un compte développeur sur [FreshBooks Developer](https://www.freshbooks.com/api/start)
2. Créez une nouvelle application
3. Configurez les redirect URIs
4. Copiez le Client ID et Client Secret

### Google Sheets
1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Sheets
4. Créez des identifiants OAuth 2.0
5. Configurez les redirect URIs pour les deux environnements :
   - Développement : `http://localhost:8080/integrations/callback/google_sheets` (ou `http://localhost:8082/integrations/callback/google_sheets` selon votre port)
   - Production : `https://novafinances.app/integrations/callback/google_sheets` (remplacez par votre domaine)
   - Production : `https://novafinances.app/integrations/callback/google_sheets`
6. Copiez le Client ID et Client Secret

### Notion
1. Allez sur [Notion Developers](https://www.notion.so/my-integrations)
2. Créez une nouvelle intégration
3. Configurez les redirect URIs
4. Copiez le Client ID et Client Secret

## Sécurité

⚠️ **Important** : Ne commitez jamais votre fichier `.env` dans le dépôt Git. Il est déjà dans `.gitignore`.

Les credentials sont stockés de manière sécurisée dans Firestore dans la collection `users/{userId}/integrations/credentials` avec les règles de sécurité appropriées.

## Test des intégrations

1. Démarrez l'application : `pnpm dev`
2. Allez dans Paramètres > Intégrations
3. Cliquez sur "Connecter" pour une intégration
4. Suivez le flux OAuth ou entrez votre clé API selon le type d'intégration

## Dépannage

### L'intégration affiche "connecté" mais ne fonctionne pas vraiment

Le système valide automatiquement les connexions au chargement. Si une connexion est invalide (token expiré, clé API incorrecte), elle sera automatiquement marquée comme déconnectée.

### Erreur "Clés API non configurées"

Vérifiez que vous avez ajouté les variables d'environnement dans votre fichier `.env` et redémarrez le serveur de développement.

### Le flux OAuth ne fonctionne pas

Vérifiez que :
1. Les redirect URIs sont correctement configurés dans le tableau de bord du fournisseur
2. Les variables d'environnement sont correctement définies
3. Le serveur de développement est accessible sur le port configuré

