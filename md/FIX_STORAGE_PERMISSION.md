# Résoudre l'erreur de permission Cloud Storage

## Erreur

```
Access to bucket gcf-sources-111192972627-us-central1 denied. 
You must grant Storage Object Viewer permission to 111192972627-compute@developer.gserviceaccount.com
```

## Solution

### Étape 1 : Ajouter la permission Storage Object Viewer

1. Allez dans [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez votre projet `autonomev1`
3. Allez dans **IAM et administration** > **IAM**
4. Trouvez le compte : `111192972627-compute@developer.gserviceaccount.com`
   - C'est le compte de service Compute Engine par défaut
5. Cliquez sur **✏️ Modifier**
6. Cliquez sur **Ajouter un autre rôle**
7. Ajoutez le rôle : **Visualiseur d'objets Storage** (Storage Object Viewer)
   - Recherchez : "Storage Object Viewer" ou "storage.objectViewer"
   - ID du rôle : `roles/storage.objectViewer`
8. Cliquez sur **Enregistrer**

### Étape 2 : Vérifier les permissions Cloud Storage

1. Allez dans **Cloud Storage** > **Buckets**
2. Trouvez le bucket : `gcf-sources-111192972627-us-central1`
3. Cliquez sur le nom du bucket
4. Allez dans l'onglet **Permissions**
5. Vérifiez que le compte `111192972627-compute@developer.gserviceaccount.com` a le rôle **Storage Object Viewer**

### Étape 3 : Redéployer

Après avoir ajouté la permission, attendez 1-2 minutes puis :

```bash
firebase deploy --only functions
```

## Rôle à ajouter

**Nom français :** Visualiseur d'objets Storage  
**Nom anglais :** Storage Object Viewer  
**ID du rôle :** `roles/storage.objectViewer`

## Note

Ce compte de service est utilisé par Firebase Functions pour accéder aux sources de code stockées dans Cloud Storage. C'est nécessaire pour le déploiement des functions.

