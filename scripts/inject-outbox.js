import fs from 'fs';
import pg from 'pg';

const env = fs.readFileSync('.env', 'utf8');
const dburl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].replace(/"/g, '').trim();

const client = new pg.Client({
    connectionString: dburl,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();
    const res = await client.query(`
    INSERT INTO "OutboxEvent" (id, topic, payload, processed, "createdAt")
    VALUES (
      gen_random_uuid(), 
      'server1.public.users', 
      '{"id": "test-user-999", "username": "e2etester", "name": "E2E Tester", "email": "test@test.com"}', 
      false, 
      NOW()
    ) RETURNING id
  `);
    console.log("Mock OutboxEvent inserted with ID:", res.rows[0].id);
}

main().catch(console.error).finally(() => client.end());
