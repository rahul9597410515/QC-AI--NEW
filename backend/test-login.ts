async function testLogin() {
    try {
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@qcai.dev',
                password: 'wrongpassword'
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('Login Success:', data);
        } else {
            console.log('Login Failed:', data);
        }
    } catch (err: any) {
        console.log('Error:', err.message);
    }
}

testLogin();
