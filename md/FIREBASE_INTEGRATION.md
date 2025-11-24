# Intégration Firebase dans l'application

## ✅ Configuration terminée

Firebase a été intégré dans votre application React avec les services suivants :

### Services configurés

- ✅ **Firebase App** - Application principale
- ✅ **Firebase Analytics** - Analytics (initialisé uniquement dans le navigateur)

### Fichiers créés/modifiés

1. **`src/lib/firebase.ts`** - Configuration et initialisation Firebase
2. **`src/App.tsx`** - Import de Firebase pour l'initialisation
3. **`package.json`** - Ajout de la dépendance `firebase`

## 📦 Installation des dépendances

Exécutez cette commande pour installer Firebase :

```bash
npm install
```

ou

```bash
pnpm install
```

## 🔧 Utilisation de Firebase dans l'application

### Importer Firebase dans vos composants

```typescript
import { app, analytics } from "@/lib/firebase";
```

### Exemple : Utiliser Analytics

```typescript
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

// Dans votre composant
if (analytics) {
  logEvent(analytics, "page_view", {
    page_path: window.location.pathname,
  });
}
```

## 🚀 Services Firebase disponibles

Vous pouvez maintenant ajouter d'autres services Firebase selon vos besoins :

### Authentication
```typescript
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

const auth = getAuth(app);
```

### Firestore Database
```typescript
import { getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);
```

### Storage
```typescript
import { getStorage } from "firebase/storage";
import { app } from "@/lib/firebase";

const storage = getStorage(app);
```

## 🔒 Sécurité

⚠️ **Important** : Les clés API Firebase sont publiques par design (elles sont exposées dans le code client). La sécurité est gérée via les règles Firebase dans la console.

Pour sécuriser votre application :
1. Allez sur [Firebase Console](https://console.firebase.google.com/project/autonomev1)
2. Configurez les règles de sécurité pour :
   - Firestore (si utilisé)
   - Storage (si utilisé)
   - Authentication (si utilisé)

## 📝 Prochaines étapes

1. **Installer les dépendances** : `npm install` ou `pnpm install`
2. **Tester l'application** : `npm run dev`
3. **Vérifier Analytics** : Les événements Analytics seront automatiquement envoyés
4. **Ajouter d'autres services** : Authentication, Firestore, Storage selon vos besoins

## 🔍 Vérification

Pour vérifier que Firebase fonctionne :
1. Ouvrez la console du navigateur (F12)
2. Vérifiez qu'il n'y a pas d'erreurs Firebase
3. Allez sur Firebase Console > Analytics pour voir les données

