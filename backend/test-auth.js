const express = require('express');
const basicAuth = require('express-basic-auth');

const app = express();

const auth = basicAuth({
    users: { 'admin': 'admin' },
    challenge: true
});

app.use('/admin', auth, (req, res) => {
    res.send('Authed!');
});

app.listen(5001, () => console.log('Test server running on 5001'));
