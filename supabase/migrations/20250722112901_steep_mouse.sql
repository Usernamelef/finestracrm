/*
  # Ajouter la politique DELETE manquante

  1. Sécurité
    - Ajouter une politique DELETE pour permettre aux utilisateurs authentifiés de supprimer/annuler des réservations
    - Cette politique est nécessaire pour que le bouton "Annuler" fonctionne dans le CRM

  2. Permissions
    - Seuls les utilisateurs authentifiés (administrateurs du CRM) peuvent supprimer des réservations
    - Les utilisateurs anonymes (clients) ne peuvent pas supprimer de réservations
*/

-- Ajouter la politique DELETE pour les utilisateurs authentifiés
CREATE POLICY "Permettre suppression aux utilisateurs authentifiés"
  ON reservations
  FOR DELETE
  TO authenticated
  USING (true);