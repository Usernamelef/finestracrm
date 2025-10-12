# Rapport d'assainissement des chemins de fichiers

## Résumé
- **Fichiers renommés**: 2
- **Dossiers renommés**: 0
- **Total des changements**: 2

## Détail des changements

### 📄 Fichier
- **Ancien**: `public/assets/Cocktails.jpg`
- **Nouveau**: `public/assets/cocktails.jpg`
- **Raison**: Caractères non-ASCII ou non supportés

### 📄 Fichier
- **Ancien**: `SANITIZE-REPORT.md`
- **Nouveau**: `sanitize-report-26.md`
- **Raison**: Caractères non-ASCII ou non supportés



## Règles appliquées
1. Normalisation Unicode NFKD
2. Suppression des diacritiques (é→e, à→a)
3. Remplacement des caractères spéciaux par des tirets
4. Conversion en minuscules
5. Compression des tirets multiples
6. Caractères autorisés: [a-z0-9._-]

---
*Rapport généré le 12/10/2025 07:17:39*
