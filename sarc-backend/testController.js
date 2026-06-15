const { getAllUsers } = require('./controllers/userController');

const req = {
    user: { role: 'ADMIN' },
    query: { role: 'STUDENT', page: 1, limit: 20 }
};

const res = {
    status: function(s) { console.log('Status:', s); return this; },
    json: function(j) { 
        console.log('Response is Array:', Array.isArray(j)); 
        if (!Array.isArray(j)) {
            console.log('Response keys:', Object.keys(j)); 
            console.log('total:', j.total);
            console.log('users length:', j.users ? j.users.length : undefined);
        } else {
            console.log('Array length:', j.length);
        }
    }
};

getAllUsers(req, res).catch(console.error);
