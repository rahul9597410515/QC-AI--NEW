async function testAnalytics() {
    const baseUrl = 'http://localhost:3001/api/analytics';
    const endpoints = ['/hourly', '/daily?days=7', '/defect-types', '/heatmap'];

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`);
            const data = await res.json();
            if (res.ok) {
                console.log(`✅ ${endpoint}: SUCCESS`);
                console.log(`   Sample:`, Array.isArray(data) ? data.slice(0, 1) : 'Object');
            } else {
                console.log(`❌ ${endpoint}: FAILED`, data);
            }
        } catch (err: any) {
            console.log(`❌ ${endpoint}: ERROR`, err.message);
        }
    }
}

testAnalytics();
