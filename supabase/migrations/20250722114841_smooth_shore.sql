/*
  # Correction de la politique RLS pour les insertions de réservations

  1. Problème identifié
    - La politique "Permettre insertion publique" bloque les insertions
    - Erreur: "new row violates row-level security policy"

  2. Solution
    - Supprimer l'ancienne politique d'insertion
    - Créer une nouvelle politique avec WITH CHECK = true
    - Permettre explicitement aux utilisateurs anonymes d'insérer des réservations

  3. Sécurité
    - Maintient la sécurité : seules les insertions sont autorisées pour les anonymes
    - Les autres opérations (SELECT, UPDATE, DELETE) restent protégées
*/

-- Supprimer l'ancienne politique d'insertion qui pose problème
DROP POLICY IF EXISTS "Permettre insertion publique" ON reservations;

-- Créer une nouvelle politique d'insertion qui fonctionne correctement
CREATE POLICY "Permettre insertion publique"
  ON reservations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Vérifier que RLS est bien activé sur la table
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Optionnel: Ajouter un commentaire pour documenter la politique
COMMENT ON POLICY "Permettre insertion publique" ON reservations IS 
'Permet aux utilisateurs anonymes de créer des réservations via le formulaire public';