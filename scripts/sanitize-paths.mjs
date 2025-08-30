#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const SCAN_DIRS = ['.', 'src', 'public', 'assets', 'static'];
const IGNORE_DIRS = ['node_modules', 'dist', 'build', '.git', '.next', '.vercel', '.bolt', '.vscode', 'scripts'];
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.md', '.json'];

// Mode vérification
const CHECK_MODE = process.argv.includes('--check');

// Table de correspondance des renommages
const renameMap = new Map();
const changes = [];

/**
 * Normalise un nom de fichier/dossier en ASCII sûr
 */
function sanitizeName(name) {
  // Séparer nom et extension
  const ext = path.extname(name);
  const baseName = path.basename(name, ext);
  
  // Normalisation Unicode NFKD pour décomposer les caractères accentués
  let normalized = baseName.normalize('NFKD');
  
  // Supprimer les diacritiques (accents)
  normalized = normalized.replace(/[\u0300-\u036f]/g, '');
  
  // Remplacer les guillemets/apostrophes fancy et autres symboles
  normalized = normalized
    .replace(/['']/g, '-')  // Apostrophes typographiques
    .replace(/[""]/g, '-')  // Guillemets typographiques
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[æ]/g, 'ae')
    .replace(/[œ]/g, 'oe')
    .replace(/[ß]/g, 'ss')
    .replace(/\s+/g, '-')  // Espaces → tirets
    .replace(/[^a-z0-9._-]/gi, '-')  // Tout le reste → tirets
    .toLowerCase()
    .replace(/-+/g, '-')  // Compresser les tirets multiples
    .replace(/^-|-$/g, ''); // Supprimer tirets début/fin
  
  // Éviter les noms vides
  if (!normalized) {
    normalized = 'file';
  }
  
  return normalized + ext;
}

/**
 * Vérifie si un chemin contient des caractères non-ASCII
 */
function hasNonASCIIChars(filePath) {
  return !/^[ -~]*$/.test(filePath);
}

/**
 * Parcourt récursivement un répertoire
 */
async function scanDirectory(dirPath, relativePath = '') {
  const items = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativeItemPath = path.join(relativePath, entry.name);
      
      // Ignorer les dossiers spécifiés
      if (entry.isDirectory() && IGNORE_DIRS.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Ajouter le dossier
        items.push({
          type: 'directory',
          fullPath,
          relativePath: relativeItemPath,
          name: entry.name
        });
        
        // Parcourir récursivement
        const subItems = await scanDirectory(fullPath, relativeItemPath);
        items.push(...subItems);
      } else {
        // Ajouter le fichier
        items.push({
          type: 'file',
          fullPath,
          relativePath: relativeItemPath,
          name: entry.name
        });
      }
    }
  } catch (error) {
    console.warn(`Impossible de lire le répertoire ${dirPath}:`, error.message);
  }
  
  return items;
}

/**
 * Gère les collisions de noms
 */
async function resolveNameCollision(dirPath, sanitizedName) {
  let finalName = sanitizedName;
  let counter = 1;
  
  while (true) {
    try {
      await fs.access(path.join(dirPath, finalName));
      // Le fichier existe, essayer avec un suffixe
      const ext = path.extname(sanitizedName);
      const baseName = path.basename(sanitizedName, ext);
      finalName = `${baseName}-${counter}${ext}`;
      counter++;
    } catch {
      // Le fichier n'existe pas, on peut utiliser ce nom
      break;
    }
  }
  
  return finalName;
}

/**
 * Renomme un fichier ou dossier
 */
async function renameItem(item) {
  const sanitizedName = sanitizeName(item.name);
  
  // Si le nom est déjà correct, ne rien faire
  if (item.name === sanitizedName) {
    return null;
  }
  
  const dirPath = path.dirname(item.fullPath);
  const finalName = await resolveNameCollision(dirPath, sanitizedName);
  const newFullPath = path.join(dirPath, finalName);
  const newRelativePath = path.join(path.dirname(item.relativePath), finalName);
  
  try {
    await fs.rename(item.fullPath, newFullPath);
    
    const change = {
      type: item.type,
      oldPath: item.relativePath,
      newPath: newRelativePath,
      oldName: item.name,
      newName: finalName
    };
    
    changes.push(change);
    renameMap.set(item.relativePath, newRelativePath);
    
    console.log(`✅ ${item.type === 'file' ? '📄' : '📁'} ${item.relativePath} → ${newRelativePath}`);
    
    return change;
  } catch (error) {
    console.error(`❌ Erreur lors du renommage de ${item.relativePath}:`, error.message);
    return null;
  }
}

/**
 * Met à jour les références dans un fichier
 */
async function updateFileReferences(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    let updatedContent = content;
    let hasChanges = false;
    
    // Parcourir toutes les correspondances de renommage
    for (const [oldPath, newPath] of renameMap.entries()) {
      // Patterns à rechercher
      const patterns = [
        // Imports/require
        new RegExp(`(['"\`])(\\.?\\/?${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\1`, 'g'),
        // URLs relatives dans HTML/CSS
        new RegExp(`(src|href|url)\\s*=\\s*(['"\`])(\\.?\\/?${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\2`, 'g'),
        // CSS url()
        new RegExp(`url\\(\\s*(['"\`]?)(\\.?\\/?${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\1\\s*\\)`, 'g'),
        // JSON values
        new RegExp(`(['"\`])(\\.?\\/?${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\1`, 'g')
      ];
      
      patterns.forEach(pattern => {
        const newContent = updatedContent.replace(pattern, (match, ...groups) => {
          // Déterminer le bon groupe selon le pattern
          if (groups.length >= 3) {
            // Pattern avec attribut (src, href, etc.)
            return `${groups[0]}="${newPath}"`;
          } else if (groups.length >= 2) {
            // Pattern simple avec quotes
            return `${groups[0]}${newPath}${groups[0]}`;
          } else {
            // Pattern CSS url()
            return `url("${newPath}")`;
          }
        });
        
        if (newContent !== updatedContent) {
          hasChanges = true;
          updatedContent = newContent;
        }
      });
    }
    
    if (hasChanges) {
      await fs.writeFile(filePath, updatedContent, 'utf-8');
      console.log(`📝 Références mises à jour dans ${filePath}`);
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la mise à jour de ${filePath}:`, error.message);
  }
}

/**
 * Génère le rapport de changements
 */
async function generateReport() {
  const reportContent = `# Rapport d'assainissement des chemins de fichiers

## Résumé
- **Fichiers renommés**: ${changes.filter(c => c.type === 'file').length}
- **Dossiers renommés**: ${changes.filter(c => c.type === 'directory').length}
- **Total des changements**: ${changes.length}

## Détail des changements

${changes.map(change => 
  `### ${change.type === 'file' ? '📄 Fichier' : '📁 Dossier'}
- **Ancien**: \`${change.oldPath}\`
- **Nouveau**: \`${change.newPath}\`
- **Raison**: Caractères non-ASCII ou non supportés

`).join('')}

## Règles appliquées
1. Normalisation Unicode NFKD
2. Suppression des diacritiques (é→e, à→a)
3. Remplacement des caractères spéciaux par des tirets
4. Conversion en minuscules
5. Compression des tirets multiples
6. Caractères autorisés: [a-z0-9._-]

---
*Rapport généré le ${new Date().toLocaleString('fr-FR')}*
`;

  await fs.writeFile(path.join(projectRoot, 'SANITIZE-REPORT.md'), reportContent, 'utf-8');
  console.log('📋 Rapport généré: SANITIZE-REPORT.md');
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🧹 Assainissement des chemins de fichiers...\n');
  
  // Scanner tous les fichiers et dossiers
  const allItems = [];
  
  for (const scanDir of SCAN_DIRS) {
    const fullScanPath = path.resolve(projectRoot, scanDir);
    
    try {
      await fs.access(fullScanPath);
      const items = await scanDirectory(fullScanPath, scanDir === '.' ? '' : scanDir);
      allItems.push(...items);
    } catch {
      console.log(`📁 Répertoire ${scanDir} non trouvé, ignoré`);
    }
  }
  
  console.log(`📊 ${allItems.length} éléments trouvés\n`);
  
  // Mode vérification
  if (CHECK_MODE) {
    console.log('🔍 Mode vérification activé\n');
    
    const problematicPaths = allItems.filter(item => hasNonASCIIChars(item.relativePath));
    
    if (problematicPaths.length > 0) {
      console.log('❌ Chemins problématiques détectés:\n');
      problematicPaths.forEach(item => {
        console.log(`  ${item.type === 'file' ? '📄' : '📁'} ${item.relativePath}`);
      });
      console.log(`\n💡 Exécutez 'npm run sanitize' pour corriger ces problèmes.`);
      process.exit(1);
    } else {
      console.log('✅ Tous les chemins sont conformes !');
      process.exit(0);
    }
  }
  
  // Mode renommage
  console.log('🔄 Renommage en cours...\n');
  
  // Trier par profondeur décroissante pour renommer les fichiers avant les dossiers parents
  allItems.sort((a, b) => {
    const depthA = a.relativePath.split(path.sep).length;
    const depthB = b.relativePath.split(path.sep).length;
    return depthB - depthA;
  });
  
  // Renommer les éléments
  for (const item of allItems) {
    if (hasNonASCIIChars(item.relativePath) || item.name !== sanitizeName(item.name)) {
      await renameItem(item);
    }
  }
  
  if (changes.length === 0) {
    console.log('✅ Aucun renommage nécessaire, tous les chemins sont déjà conformes !');
    return;
  }
  
  console.log(`\n📝 Mise à jour des références dans les fichiers...\n`);
  
  // Mettre à jour les références dans les fichiers
  const allFiles = allItems.filter(item => item.type === 'file');
  
  for (const item of allFiles) {
    const ext = path.extname(item.name).toLowerCase();
    if (FILE_EXTENSIONS.includes(ext)) {
      // Utiliser le nouveau chemin si le fichier a été renommé
      const currentPath = renameMap.get(item.relativePath) || item.relativePath;
      const fullPath = path.resolve(projectRoot, currentPath);
      
      try {
        await fs.access(fullPath);
        await updateFileReferences(fullPath);
      } catch (error) {
        console.warn(`⚠️ Fichier non trouvé: ${fullPath}`);
      }
    }
  }
  
  // Générer le rapport
  await generateReport();
  
  console.log(`\n🎉 Assainissement terminé !`);
  console.log(`📊 ${changes.length} éléments renommés`);
  console.log(`📋 Voir SANITIZE-REPORT.md pour le détail`);
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promesse rejetée:', error.message);
  process.exit(1);
});

// Exécution
main().catch(error => {
  console.error('❌ Erreur lors de l\'exécution:', error.message);
  process.exit(1);
});