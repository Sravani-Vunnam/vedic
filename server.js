const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const serviceAccount = require("./key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
    const { fullname, email, password, confirmpassword } = req.body;

    if (!fullname || !email || !password || !confirmpassword) {
        return res.json({ message: 'Please fill in all fields.' });
    }

    if (password !== confirmpassword) {
        return res.json({ message: 'Passwords do not match.' });
    }

    const userRef = db.collection('users');
    const existingUser = await userRef.where('email', '==', email).get();

    if (!existingUser.empty) {
        return res.json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userRef.add({ fullname, email, password: hashedPassword });
    res.json({ message: 'Registration successful!' });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const userRef = db.collection('users');
    const snapshot = await userRef.where('email', '==', email).get();

    if (snapshot.empty) {
        return res.json({ message: 'Invalid email or password.' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.json({ message: 'Invalid email or password.' });
    }

    res.json({ message: `Welcome back, ${user.fullname}!` });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
