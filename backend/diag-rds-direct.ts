import pkg from 'pg';
const { Client } = pkg;
import process from 'process';

const url = 'postgresql://trackcodex_user:Marcus701701@trackcodex-db.cnie88q6ughh.ap-south-1.rds.amazonaws.com:5432/trackcodex_db?sslmode=require';

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
