export type FieldType = "text" | "number" | "select" | "checkbox";

export interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Identité",
    fields: [
      { key: "nom_famille", label: "Nom de famille", placeholder: "Dupont" },
      { key: "prenom", label: "Prénom", placeholder: "Jean" },
      { key: "nom_naissance", label: "Nom de naissance" },
      { key: "nom_affichage", label: "Nom d'affichage / pseudo" },
      { key: "nom_utilisateur", label: "Nom d'utilisateur" },
      { key: "date_naissance", label: "Date de naissance", placeholder: "YYYY-MM-DD" },
      { key: "annee_naissance", label: "Année de naissance", placeholder: "1985" },
      { key: "jour_naissance", label: "Jour", type: "number", placeholder: "1-31" },
      { key: "mois_naissance", label: "Mois", type: "number", placeholder: "1-12" },
      {
        key: "genre",
        label: "Genre",
        type: "select",
        options: [
          { value: "", label: "—" },
          { value: "M", label: "M" },
          { value: "F", label: "F" },
        ],
      },
      {
        key: "civilite",
        label: "Civilité",
        type: "select",
        options: [
          { value: "", label: "—" },
          { value: "M.", label: "M." },
          { value: "Mme", label: "Mme" },
          { value: "Mlle", label: "Mlle" },
        ],
      },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "email", label: "Email", placeholder: "jean@example.com" },
      { key: "telephone", label: "Téléphone", placeholder: "0612345678" },
      { key: "mobile", label: "Mobile" },
      { key: "adresse_ip", label: "Adresse IP" },
    ],
  },
  {
    title: "Adresse",
    fields: [
      { key: "adresse", label: "Rue et numéro" },
      { key: "complement_adresse", label: "Complément" },
      { key: "code_postal", label: "Code postal", placeholder: "75001" },
      { key: "ville", label: "Ville", placeholder: "Paris" },
      { key: "ville_naissance", label: "Ville de naissance" },
      { key: "lieu_naissance", label: "Lieu de naissance" },
      { key: "pays", label: "Pays", placeholder: "FR" },
      { key: "region", label: "Région" },
      { key: "departement", label: "Département", placeholder: "75" },
    ],
  },
  {
    title: "Identifiants uniques",
    fields: [
      { key: "nir", label: "NIR (Sécurité sociale)" },
      { key: "iban", label: "IBAN" },
      { key: "bic", label: "BIC / SWIFT" },
      { key: "siret", label: "SIRET" },
      { key: "siren", label: "SIREN" },
    ],
  },
  {
    title: "Véhicule",
    fields: [
      { key: "vin_plaque", label: "VIN / Plaque" },
      { key: "immatriculation", label: "Immatriculation", placeholder: "AB-123-CD" },
      { key: "numero_serie", label: "N° de série" },
      { key: "marque", label: "Marque" },
      { key: "modele", label: "Modèle" },
    ],
  },
  {
    title: "Professionnel",
    fields: [
      { key: "societe", label: "Société" },
      { key: "profession", label: "Profession" },
      { key: "fonction", label: "Fonction" },
    ],
  },
  {
    title: "Gaming / FiveM",
    fields: [
      { key: "steam_id", label: "Steam ID" },
      { key: "fivem_license", label: "FiveM License" },
      { key: "fivem_license2", label: "FiveM License 2" },
      { key: "fivem_id", label: "FiveM ID" },
      { key: "xbox_live_id", label: "Xbox Live ID" },
      { key: "live_id", label: "Live ID" },
      { key: "discord_id", label: "Discord ID" },
    ],
  },
];

export const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FIELD_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.label])),
);
