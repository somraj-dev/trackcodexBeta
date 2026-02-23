
import pkg from 'pg';
const { Client } = pkg;
import process from 'process';

async function testConnection() {
    console.log("🔍 Starting Database Connectivity Diagnostic...");
    const url = process.env.DATABASE_URL;

    if (!url) {
        console.error("❌ No DATABASE_URL found.");
        process.exit(1);
    }

    const maskedUrl = url.replace(/:([^:@]+)@/, ":****@");
    console.log(`📡 URL: ${maskedUrl}`);

    const client = new Client({
        connectionString: url,
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log("⏳ Attempting raw TCP connection via node-postgres...");
        await client.connect();
        console.log("✅ SUCCESS: Successfully connected to PostgreSQL via raw driver!");

        const res = await client.query('SELECT version()');
        console.log("📊 DB Version:", res.rows[0].version);

        await client.end();
        process.exit(0);
    } catch (err: any) {
        console.error("❌ CONNECTION FAILED!");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);
        console.error("Full Trace:", err);
        process.exit(1);
    }
}

testConnection();
