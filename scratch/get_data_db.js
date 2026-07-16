import fs from 'fs';
import mysql from 'mysql2/promise';

// Helper to load .env values without needing external packages
function loadEnv() {
    const env = {};
    if (fs.existsSync('.env')) {
        const fileContent = fs.readFileSync('.env', 'utf8');
        fileContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const index = trimmed.indexOf('=');
                if (index !== -1) {
                    const key = trimmed.substring(0, index).trim();
                    let value = trimmed.substring(index + 1).trim();
                    // Remove wrapping quotes if present
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    env[key] = value;
                }
            }
        });
    }
    return env;
}

async function getData() {
    const config = loadEnv();

    const dbConfig = {
        host: config.DB_HOST || '168.144.44.35',
        user: config.DB_USERNAME || 'root',
        password: config.DB_PASSWORD || 'bvLH#KQj2j9PHyw',
        database: config.DB_DATABASE || 'hsite_system_api',
        port: parseInt(config.DB_PORT || '3306')
    };

    console.log(`Connecting directly to MySQL at ${dbConfig.host}:${dbConfig.port}...`);

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Successfully connected to remote database!');

        // Change 'users' to whatever table you want to query (e.g., categories, orders)
        const [rows] = await connection.execute('SELECT * FROM users LIMIT 5');
        console.log('\n--- Data Retrieved (First 5 Users) ---');
        console.log(JSON.stringify(rows, null, 2));

        await connection.end();
    } catch (error) {
        console.error('Connection failed:', error.message);
        console.log('\nTIP: Make sure you installed mysql2: npm install mysql2');
    }
}

getData();
