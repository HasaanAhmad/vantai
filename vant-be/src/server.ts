/**
 * Server entry point - starts the HTTP server.
 */

import "dotenv/config";
import app from "@/app";

const PORT = process.env.PORT ?? 3001;

// Ensure AUTH_URL is set for Auth.js OAuth callback (must match Google Console redirect URI)
if (!process.env.AUTH_URL) {
  process.env.AUTH_URL = `http://localhost:${PORT}/auth`;
}

app.listen(PORT, () => {
  console.log(`[Vantai] Server listening on http://localhost:${PORT}`);
});
