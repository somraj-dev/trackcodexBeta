import fs from 'fs';
import pg from 'pg';

const env = fs.readFileSync('.env', 'utf8');
const dburl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].replace(/"/g, '').trim();

const client = new pg.Client({ connectionString: dburl });

async function main() {
    await client.connect();
    const res = await client.query('SELECT id, processed, error, topic FROM "OutboxEvent" ORDER BY "createdAt" DESC LIMIT 10');
    console.dir(res.rows, { depth: null });
}

main().catch(console.error).finally(() => client.end());
