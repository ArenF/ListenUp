export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || "",
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
  },
};

export function validateEnvSpotify(): boolean {
  if (!config.spotify.clientId || !config.spotify.clientSecret) {
    console.warn(`Spoify credentials not found in .env`);
    return false;
  }

  return true;
}
