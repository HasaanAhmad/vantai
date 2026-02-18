/**
 * Server entry point - starts the HTTP server.
 */

import "dotenv/config";
import app from "@/app";

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`[Vantai] Server listening on http://localhost:${PORT}`);
});
