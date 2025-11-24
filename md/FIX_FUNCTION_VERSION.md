# Résoudre l'erreur "Functions cannot be downgraded from GCFv2 to GCFv1"

## Problème

L'erreur indique que vous avez une fonction déployée en **v2** et vous essayez de la redéployer en **v1**, ce qui n'est pas possible.

## Solutions

### Solution 1 : Supprimer la fonction v2 et la recréer en v1 (Recommandé)

1. **Supprimer la fonction existante :**
```bash
firebase functions:delete api --region us-central1
```

2. **Redéployer en v1 :**
```bash
firebase deploy --only functions
```

### Solution 2 : Revenir à Functions v2 (si les permissions sont maintenant OK)

Si vous avez configuré les permissions, vous pouvez revenir à v2 :

1. **Mettre à jour le code pour v2 :**
   - Modifier `functions/src/index.ts` pour utiliser `onRequest` de `firebase-functions/v2/https`
   - Installer `firebase-functions@latest`

2. **Mettre à jour firebase.json :**
   - Utiliser la configuration v2

### Solution 3 : Utiliser un nom différent pour la fonction

Créer une nouvelle fonction avec un nom différent :

1. **Renommer la fonction dans `functions/src/index.ts` :**
```typescript
export const apiV1 = functions.https.onRequest(app);
```

2. **Mettre à jour firebase.json :**
```json
{
  "source": "/api/**",
  "function": "apiV1"
}
```

3. **Déployer :**
```bash
firebase deploy --only functions,hosting
```

4. **Supprimer l'ancienne fonction :**
```bash
firebase functions:delete api --region us-central1
```

## Solution recommandée : Supprimer et recréer

La solution la plus simple est de supprimer la fonction v2 existante et de la recréer en v1 :

```bash
# 1. Supprimer la fonction v2
firebase functions:delete api --region us-central1

# 2. Redéployer en v1
firebase deploy --only functions
```

## Note importante

Le **hosting a été déployé avec succès** ! Votre site frontend est maintenant en ligne. Il ne reste qu'à résoudre le problème des functions.

