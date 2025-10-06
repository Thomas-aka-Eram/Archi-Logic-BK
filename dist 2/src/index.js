"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serverless_1 = require("@neondatabase/serverless");
const neon_http_1 = require("drizzle-orm/neon-http");
const sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
const db = (0, neon_http_1.drizzle)({ client: sql });
console.log(db);
//# sourceMappingURL=index.js.map