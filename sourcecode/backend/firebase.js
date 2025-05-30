require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Enable CORS for frontend origin (http://localhost:3000)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, //Required to allow cookies to be sent
}));

//Initialize Firebase Admin
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const auth = getAuth();

// Session login route
app.post('/sessionLogin', async (req, res) => {
  const idToken = req.body.idToken;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  if (!idToken) {
    return res.status(400).json({ error: 'ID token required' });
  }

  try {
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: false, // Set to true in production (with HTTPS)
      sameSite: 'lax',
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(401).json({ error: 'Failed to create session' });
  }
});

app.get('/sessionLogin', (req, res) => {
  res.send('This is a POST-only route. Try sending a POST request.');
});


// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth server running at http://localhost:${PORT}`);
});
