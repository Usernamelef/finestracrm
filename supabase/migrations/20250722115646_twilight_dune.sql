/*
  # Correction définitive de la politique RLS pour les réservations

  1. Problème identifié
    - La politique RLS bloque les insertions anonymes malgré la configuration
    - Erreur: "new row violates row-level security policy for table reservations"

  2. Solution appliquée
    - Suppression de toutes les politiques d'insertion existantes
    - Création d'une nouvelle politique spécifique pour les insertions anonymes
    - Vérification que RLS est activé

  3. Sécurité maintenue
    - Seules les insertions sont autorisées pour les utilisateurs anonymes
    - Lecture, modification et suppression restent protégées
*/

-- Supprimer toutes les politiques d'insertion existantes pour éviter les conflits
DROP POLICY IF EXISTS "Permettre insertion publique" ON public.reservations;
DROP POLICY IF EXISTS "allow_anon_insert" ON public.reservations;
DROP POLICY IF EXISTS "allow_public_insert" ON public.reservations;

-- Créer une nouvelle politique d'insertion spécifique et claire
CREATE POLICY "allow_anonymous_reservations" 
ON public.reservations 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- S'assurer que RLS est activé
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Vérifier que les autres politiques restent intactes
-- (lecture, modification, suppression pour les utilisateurs authentifiés)