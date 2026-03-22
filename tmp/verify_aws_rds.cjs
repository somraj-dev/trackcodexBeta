const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
}

const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
console.log(`⏳ Attempting to connect to: ${maskedUrl}`);

const client = new Client({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false // AWS RDS often requires SSL but might use self-signed certs or needs this for easy testing
    }
});

async function verifyConnection() {
    try {
        const start = Date.now();
        await client.connect();
        const duration = Date.now() - start;
        console.log(`✅ Successfully connected to AWS RDS in ${duration}ms!`);

        const res = await client.query('SELECT current_database(), current_user, version()');
        console.log('📊 Database Info:');
        console.table(res.rows[0]);

        // List tables to see if migrations have run
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            LIMIT 10
        `);
        console.log(`📁 Found ${tables.rowCount} tables in public schema.`);
        if (tables.rowCount > 0) {
            console.log('Sample tables:', tables.rows.map(r => r.table_name).join(', '));
        }

        await client.end();
    } catch (err) {
        console.error('❌ Connection failed:');
        console.error(err.message);
        if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
            console.log('\n💡 Tip: This might be a Security Group issue. Ensure your local IP is allowed in the RDS Security Group inbound rules (Port 5432).');
        }
        process.exit(1);
    }
}

verifyConnection();
