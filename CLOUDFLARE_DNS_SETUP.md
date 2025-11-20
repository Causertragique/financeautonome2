# Configuration DNS Cloudflare pour novafinances.app

## Enregistrements DNS à ajouter dans Cloudflare

### ⚠️ IMPORTANT : Cloudflare ne permet pas CNAME sur le domaine racine

Pour le domaine racine (`@`), vous DEVEZ utiliser des enregistrements **A** avec les IPs de Firebase.

### 1. Enregistrements A pour le domaine racine (OBLIGATOIRE)

**Type :** `A`  
**Nom :** `@` (ou laissez vide pour le domaine racine)  
**IPv4 :** `151.101.1.195`  
**Proxy :** ✅ Activé (orange cloud)  
**TTL :** Auto

**Type :** `A`  
**Nom :** `@`  
**IPv4 :** `151.101.65.195`  
**Proxy :** ✅ Activé (orange cloud)  
**TTL :** Auto

**Type :** `A`  
**Nom :** `@`  
**IPv4 :** `151.101.129.195`  
**Proxy :** ✅ Activé (orange cloud)  
**TTL :** Auto

**Type :** `A`  
**Nom :** `@`  
**IPv4 :** `151.101.193.195`  
**Proxy :** ✅ Activé (orange cloud)  
**TTL :** Auto

### 3. Enregistrement CNAME (pour www)

**Type :** `CNAME`  
**Nom :** `www`  
**Cible :** `novafinances.app`  
**Proxy :** ✅ Activé (orange cloud)  
**TTL :** Auto

### ⚠️ Note : CNAME sur @ n'est pas possible dans Cloudflare

Cloudflare ne permet pas les CNAME sur le domaine racine. Utilisez les enregistrements A ci-dessus.

## Configuration dans Firebase Hosting

1. Allez dans **Firebase Console** > **Hosting**
2. Cliquez sur **Add custom domain**
3. Entrez `novafinances.app`
4. Firebase vous donnera les enregistrements DNS exacts à utiliser
5. Suivez les instructions Firebase (généralement un CNAME ou des enregistrements A)

## Configuration requise pour Cloudflare

Puisque Cloudflare ne permet pas les CNAME sur le domaine racine, vous devez utiliser des enregistrements **A**.

### Enregistrements A pour novafinances.app (domaine racine)

Ajoutez ces 4 enregistrements A :

1. **Type :** `A` | **Nom :** `@` | **IPv4 :** `151.101.1.195` | **Proxy :** ✅ | **TTL :** Auto
2. **Type :** `A` | **Nom :** `@` | **IPv4 :** `151.101.65.195` | **Proxy :** ✅ | **TTL :** Auto
3. **Type :** `A` | **Nom :** `@` | **IPv4 :** `151.101.129.195` | **Proxy :** ✅ | **TTL :** Auto
4. **Type :** `A` | **Nom :** `@` | **IPv4 :** `151.101.193.195` | **Proxy :** ✅ | **TTL :** Auto

Ces IPs sont les serveurs de Firebase Hosting.

## Pourquoi 4 adresses IP différentes ?

Firebase Hosting utilise plusieurs serveurs pour :
- **Haute disponibilité** : Si un serveur tombe en panne, les autres prennent le relais
- **Répartition de charge** : Les requêtes sont distribuées entre les serveurs pour de meilleures performances
- **Redondance** : Plusieurs points d'accès garantissent que votre site reste accessible

C'est une pratique standard pour les services cloud. Quand un utilisateur visite votre site, son navigateur choisira automatiquement l'une de ces IPs (généralement la plus proche géographiquement).

**Vous devez ajouter les 4 enregistrements A** pour que tout fonctionne correctement.

## Configuration SSL/TLS dans Cloudflare

1. Allez dans **SSL/TLS** > **Overview**
2. Sélectionnez **Full (strict)** pour le mode SSL
3. Cela garantit que la connexion entre Cloudflare et Firebase est chiffrée

## Vérification

Après avoir ajouté les enregistrements :

1. Attendez 5-15 minutes pour la propagation DNS
2. Vérifiez avec : `nslookup novafinances.app` ou `dig novafinances.app`
3. Testez l'accès à `https://novafinances.app`
4. Vérifiez que le certificat SSL est valide

## Notes importantes

- **Proxy Cloudflare (orange cloud)** : Activez-le pour bénéficier du CDN et de la protection DDoS
- **TTL** : Laissez sur "Auto" pour que Cloudflare gère automatiquement
- **SSL/TLS** : Utilisez "Full (strict)" pour une sécurité maximale
- **Firebase Hosting** : Assurez-vous d'avoir ajouté le domaine dans Firebase Console avant de configurer DNS

## Résolution de problèmes

Si le domaine ne fonctionne pas après 15 minutes :

1. Vérifiez que le domaine est bien ajouté dans Firebase Hosting
2. Vérifiez que les enregistrements DNS sont corrects dans Cloudflare
3. Vérifiez le statut SSL dans Cloudflare (doit être "Active Certificate")
4. Attendez jusqu'à 24 heures pour la propagation complète (généralement beaucoup plus rapide)

## Commandes de vérification

```bash
# Vérifier les enregistrements DNS
nslookup novafinances.app
dig novafinances.app

# Vérifier le certificat SSL
openssl s_client -connect novafinances.app:443 -servername novafinances.app
```

