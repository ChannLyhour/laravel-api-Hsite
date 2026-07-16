// Node.js 18+ includes native fetch support out of the box (no npm install required).

async function getDataFromApi() {
    const apiBaseUrl = 'http://127.0.0.1:8000/api';
    
    // Change this endpoint to whatever path you want to query (e.g. /categories, /store/resolve-domain, etc.)
    const endpoint = '/categories'; 
    const url = `${apiBaseUrl}${endpoint}`;

    console.log(`Sending GET request to Laravel API: ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                // Add Authorization header if your endpoint requires login:
                // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('\n--- Data Retrieved from Laravel API ---');
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Failed to fetch from API:', error.message);
        console.log('\nTIP: Make sure your Laravel server (php artisan serve) is running!');
    }
}

getDataFromApi();
