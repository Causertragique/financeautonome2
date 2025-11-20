# URL du Backend Firebase Functions

## URL de la fonction déployée

**URL complète :** `https://financeautonome2--autonomev1-477910.us-east4.hosted.app`

## Endpoints disponibles

### 1. Test de connexion
```
GET https://financeautonome2--autonomev1-477910.us-east4.hosted.app/api/ping
```

### 2. Route de démonstration
```
GET https://financeautonome2--autonomev1-477910.us-east4.hosted.app/api/demo
```

### 3. Modes de paiement

**Liste des modes de paiement :**
```
GET https://financeautonome2--autonomev1-477910.us-east4.hosted.app/api/payment-methods?userId={userId}
```

**Créer un mode de paiement :**
```
POST https://financeautonome2--autonomev1-477910.us-east4.hosted.app/api/payment-methods
Content-Type: application/json

{
  "userId": "user-id",
  "type": "credit_card",
  "label": "Carte Visa",
  "last4": "1234",
  "expiryDate": "12/25"
}
```

**Supprimer un mode de paiement :**
```
DELETE https://financeautonome2--autonomev1-477910.us-east4.hosted.app/api/payment-methods/{id}?userId={userId}
```

## URL via le domaine personnalisé

Si vous avez configuré `novafinances.app`, les endpoints seront également accessibles via :

```
https://novafinances.app/api/ping
https://novafinances.app/api/demo
https://novafinances.app/api/payment-methods
```

## Test rapide

Pour tester si le backend fonctionne :

```bash
curl https://financeautonome2--autonomev1-477910.us-east4.hosted.app/api/ping
```

Vous devriez recevoir :
```json
{"message":"pong"}
```

## Configuration dans le frontend

Dans votre code React, utilisez les endpoints avec le préfixe `/api/` :

```typescript
// Le frontend utilisera automatiquement le domaine actuel
const response = await fetch('/api/ping');
const data = await response.json();
```

Firebase Hosting redirigera automatiquement `/api/**` vers la fonction grâce à la configuration dans `firebase.json`.

