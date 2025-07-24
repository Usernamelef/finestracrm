/*
  # Correction de la politique RLS pour les réservations anonymes

  1. Problème identifié
    - La politique actuelle `allow_anonymous_reservations` ne fonctionne pas correctement
    - Elle bloque les insertions anonymes malgré la configuration

  2. Solution
    - Supprimer l'ancienne politique défaillante
    - Créer une nouvelle politique plus permissive pour les insertions anonymes
    - Garder les autres politiques pour les opérations authentifiées

  3. Sécurité
    - Permet uniquement les INSERT pour le rôle anon
    - Les autres opérations (SELECT, UPDATE, DELETE) restent protégées
*/

-- Supprimer l'ancienne politique défaillante
DROP POLICY IF EXISTS "allow_anonymous_reservations" ON reservations;

-- Créer une nouvelle politique pour permettre les insertions anonymes
CREATE POLICY "allow_anonymous_insert_reservations"
  ON reservations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Vérifier que les autres politiques existent toujours
-- (pour les utilisateurs authentifiés)
DO $$
BEGIN
  -- Politique pour la lecture (utilisateurs authentifiés)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Permettre lecture aux utilisateurs authentifiés'
  ) THEN
    CREATE POLICY "Permettre lecture aux utilisateurs authentifiés"
      ON reservations
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Politique pour la mise à jour (utilisateurs authentifiés)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Permettre mise à jour aux utilisateurs authentifiés'
  ) THEN
    CREATE POLICY "Permettre mise à jour aux utilisateurs authentifiés"
      ON reservations
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Politique pour la suppression (utilisateurs authentifiés)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Permettre suppression aux utilisateurs authentifiés'
  ) THEN
    CREATE POLICY "Permettre suppression aux utilisateurs authentifiés"
      ON reservations
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;