/*
  # Création de la table des réservations

  1. Nouvelle table
    - `reservations`
      - `id` (uuid, primary key)
      - `nom_client` (text)
      - `email_client` (text)
      - `telephone_client` (text)
      - `date_reservation` (date)
      - `heure_reservation` (text)
      - `nombre_personnes` (integer)
      - `commentaire` (text, optional)
      - `statut` (text)
      - `table_assignee` (integer, optional)
      - `date_creation` (timestamptz)
      - `date_annulation` (timestamptz, optional)

  2. Sécurité
    - Enable RLS sur la table `reservations`
    - Ajouter des policies pour l'accès authentifié
*/

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_client text NOT NULL,
  email_client text NOT NULL,
  telephone_client text NOT NULL,
  date_reservation date NOT NULL,
  heure_reservation text NOT NULL,
  nombre_personnes integer NOT NULL,
  commentaire text,
  statut text NOT NULL DEFAULT 'nouvelle',
  table_assignee integer,
  date_creation timestamptz DEFAULT now(),
  date_annulation timestamptz
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre l'insertion publique (formulaire de réservation)
CREATE POLICY "Permettre insertion publique"
  ON reservations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy pour permettre la lecture aux utilisateurs authentifiés
CREATE POLICY "Permettre lecture aux utilisateurs authentifiés"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Permettre mise à jour aux utilisateurs authentifiés"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (true);