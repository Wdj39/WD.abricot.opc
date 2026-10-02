// Nom du cookie qui contient le token JWT.
// Placé ici (et non dans actions/auth.ts) car un fichier "use server"
// ne peut exporter que des fonctions async. Le middleware en aura aussi besoin.
export const TOKEN_COOKIE = 'abricot_token';
