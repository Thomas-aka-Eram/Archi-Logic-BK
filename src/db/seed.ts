import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';

config({ path: '.env' });

const main = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const db = drizzle(client, { schema });

    const rolesToSeed = [
      'Admin',
      'Manager',
      'Developer',
      'Viewer',
      'Contributor',
      'QA',
      'Bot',
    ];

    for (const roleName of rolesToSeed) {
      await db
        .insert(schema.roles)
        .values({ name: roleName })
        .onConflictDoNothing({ target: schema.roles.name });
      console.log(`Seeded role: ${roleName}`);
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

main();
