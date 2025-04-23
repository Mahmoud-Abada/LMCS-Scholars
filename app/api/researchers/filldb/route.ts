export const runtime = "nodejs";

import { dropAllTables } from "../../../../db/client";

(async () => {
  await dropAllTables();
  process.exit(0);
})();
