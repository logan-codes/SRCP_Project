const http = require('http');

const data = JSON.stringify({
    email: 'admin@sathyabama.ac.in',
    password: 'admin123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => { body += d; });
    res.on('end', () => {
        const token = JSON.parse(body).token;
        if (!token) return console.log("Login failed", body);
        
        console.log("Logged in, fetching /api/users/all...");
        
        http.get('http://localhost:5000/api/users/all?role=STUDENT', {
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res2) => {
            let body2 = '';
            res2.on('data', (d) => { body2 += d; });
            res2.on('end', () => {
                console.log("Response starts with:", body2.substring(0, 100));
            });
        });
    });
});

req.write(data);
req.end();
