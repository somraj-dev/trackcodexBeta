import pkg from 'pg';
const { Client } = pkg;
import process from 'process';

const url = process.env.DATABASE_URL || 'postgresql://localhost:5432/trackcodex_db';

async function test() {
    console.log("Testing connection to RDS...");
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        await client.connect();
        console.log("✅ SUCCESS: Connected to RDS!");
        const res = await client.query('SELECT version()');
        console.log("📊 Version:", res.rows[0].version);
        await client.end();
    } catch (err) {
        console.error("❌ FAILED:", err.message);
    }
}

test();
