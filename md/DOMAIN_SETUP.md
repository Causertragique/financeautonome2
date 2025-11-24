# Configuration du domaine client (Customer-facing domain)

## Variable d'environnement : `VITE_APP_BASE_URL`

Cette variable définit le domaine client utilisé pour les redirections OAuth et les URLs de callback.

### Configuration

Ajoutez cette variable dans votre fichier `.env` à la racine du projet :

```env
# Domaine client pour la production
VITE_APP_BASE_URL=https://novafinances.app
```

### Utilisation

- **Production** : Utilisez votre domaine de production (ex: `https://novafinances.app`)
- **Développement** : Laissez vide ou utilisez `http://localhost:8080` (par défaut, l'application utilisera `window.location.origin`)

### Où est-ce utilisé ?

Cette variable est utilisée dans :
- Les redirections OAuth pour les intégrations (Google Sheets, QuickBooks, etc.)
- Les URLs de callback pour les intégrations (`/integrations/callback/{integrationKey}`)

### Exemple de configuration complète

```env
# Domaine client
VITE_APP_BASE_URL=https://novafinances.app

# Configuration Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... autres variables Firebase

# Intégrations OAuth
VITE_GOOGLE_SHEETS_CLIENT_ID=...
VITE_GOOGLE_SHEETS_CLIENT_SECRET=...
# ... autres intégrations
```

### Important

1. **Utilisez `https://`** pour la production (pas `http://`)
2. **N'incluez pas de slash final** (ex: `https://novafinances.app` et non `https://novafinances.app/`)
3. **Redémarrez le serveur** après modification du fichier `.env`
4. **Vérifiez les redirect URIs** dans les consoles OAuth (Google Cloud, QuickBooks, etc.) pour qu'elles correspondent à votre domaine

### Vérification

Pour vérifier que le domaine est correctement configuré, ouvrez la console du navigateur et vérifiez :
- Les URLs OAuth générées doivent utiliser votre domaine
- Les callbacks doivent fonctionner correctement

