
import pkg from 'pg';
const { Client } = pkg;
import process from 'process';

console.error("🚀 DIAGNOSTIC START: Script is running (EXTREME SSL BYPASS)...");

// Nuclear option for Node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
console.error("☢️  NODE_TLS_REJECT_UNAUTHORIZED set to '0' globally.");

async function testConnection() {
    const url = process.env.DATABASE_URL;

    if (!url) {
        console.error("❌ ERROR: DATABASE_URL is not set!");
        process.exit(1);
    }

    const maskedUrl = url.replace(/:([^:@]+)@/, ":****@");
    console.error(`📡 Base Target URL (masked): ${maskedUrl}`);

    // CONFIG 1: Use Port 6543 (Pooler transaction mode)
    const url6543 = url.replace(':5432', ':6543');
    console.error(`⏳ TEST 1: Attempting Port 6543 (Pooler) -> ${url6543.replace(/:([^:@]+)@/, ":****@")}`);

    const client1 = new Client({
        connectionString: url6543,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        await client1.connect();
        console.error("✅ TEST 1 SUCCESS: Connected to 6543!");
        await client1.end();
    } catch (err: any) {
        console.error(`❌ TEST 1 FAILED: ${err.message}`);
    }

    // CONFIG 2: Use Port 5432 (Session mode / Direct)
    console.error(`⏳ TEST 2: Attempting Port 5432 (Session) -> ${maskedUrl}`);
    const client2 = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        await client2.connect();
        console.error("✅ TEST 2 SUCCESS: Connected to 5432!");
        const res = await client2.query('SELECT version()');
        console.error("📊 DB Version:", res.rows[0].version);
        await client2.end();
        console.error("🏁 DIAGNOSTIC COMPLETE: Success reaching DB.");
        process.exit(0);
    } catch (err: any) {
        console.error(`❌ TEST 2 FAILED: ${err.message}`);
        console.error("Full Trace:", JSON.stringify(err, null, 2));
        process.exit(1);
    }
}

testConnection().catch(err => {
    console.error("💥 CRITICAL SCRIPT ERROR:");
    console.error(err);
    process.exit(1);
});



