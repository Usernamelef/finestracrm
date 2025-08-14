# Instructions de déploiement sur VPS

## 1. Génération des fichiers de production

Exécutez cette commande pour créer les fichiers optimisés :

```bash
npm run build
```

Cette commande va créer un dossier `dist/` contenant tous les fichiers prêts pour la production.

## 2. Structure du dossier dist/

Après le build, vous aurez cette structure :
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [autres assets]
├── .htaccess (pour Apache)
└── [images et autres fichiers statiques]
```

## 3. Transfert vers votre VPS

### Option A : Avec SCP (ligne de commande)
```bash
# Transférer tout le contenu du dossier dist vers votre serveur
scp -r dist/* user@votre-ip-vps:/var/www/html/lafinestra/

# Ou si vous voulez créer le dossier lafinestra
scp -r dist/ user@votre-ip-vps:/var/www/html/lafinestra/
```

### Option B : Avec SFTP (interface graphique)
1. Utilisez FileZilla, WinSCP ou Cyberduck
2. Connectez-vous à votre VPS
3. Naviguez vers `/var/www/html/` (ou votre dossier web)
4. Créez un dossier `lafinestra`
5. Transférez tout le contenu du dossier `dist/` dans ce dossier

## 4. Configuration du serveur web

### Pour Apache :
1. Le fichier `.htaccess` est déjà inclus dans le build
2. Assurez-vous que `mod_rewrite` est activé :
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

### Pour Nginx :
1. Copiez le fichier `nginx.conf` fourni
2. Modifiez les chemins, le nom de domaine et le port selon votre configuration (actuellement configuré sur le port 3006)
3. Activez la configuration :
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/lafinestra
   sudo ln -s /etc/nginx/sites-available/lafinestra /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 5. Permissions des fichiers

Assurez-vous que les permissions sont correctes :
```bash
sudo chown -R www-data:www-data /var/www/html/lafinestra/
sudo chmod -R 755 /var/www/html/lafinestra/
```

## 6. Variables d'environnement

Si votre application utilise des variables d'environnement (comme pour Supabase), 
assurez-vous qu'elles sont définies lors du build :

```bash
# Créez un fichier .env.production avec vos variables
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_supabase

# Puis buildez
npm run build
```

## 7. Test de l'application

1. Accédez à votre domaine ou IP
2. Testez la navigation entre les pages
3. Vérifiez que les formulaires fonctionnent
4. Testez sur mobile et desktop

## 8. Maintenance

Pour mettre à jour l'application :
1. Modifiez votre code
2. Exécutez `npm run build`
3. Transférez les nouveaux fichiers du dossier `dist/`
4. Videz le cache du navigateur si nécessaire

## Dépannage

- **Erreur 404 sur les routes** : Vérifiez la configuration du serveur web
- **Assets non chargés** : Vérifiez les permissions des fichiers
- **Page blanche** : Consultez les logs du navigateur (F12 → Console)