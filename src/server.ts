// ============================================
// FIX: Tell TypeScript about our custom session property
// ============================================
declare module 'express-session' {
  interface SessionData {
    unlocked: boolean;
  }
}
// ============================================

import express, { Request, Response } from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';

// 1. Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Read the secret allowlist from the JSON file
const allowlistPath = path.join(__dirname, '../data/allowlist.json');
const rawData = fs.readFileSync(allowlistPath, 'utf-8');
const { validNames } = JSON.parse(rawData);
const validNamesLower = validNames.map((name: string) => name.toLowerCase());

// 3. Middleware setup
app.use(express.urlencoded({ extended: true })); // Reads data from HTML forms
app.use(express.json());

// 4. Session setup (keeps her logged in so she doesn't have to retype)
app.use(
  session({
    secret: 'change-this-to-something-secret-like-your-crushs-birthday',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 }, // 1 hour
  })
);

// 5. Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// 6. ROUTES
// ============================================

// GET / - Show the login page
app.get('/', (req: Request, res: Response) => {
  // If already logged in, skip the login and go straight to the letter
  if (req.session.unlocked) {
    return res.redirect('/letter');
  }
  res.render('login', { error: null });
});

// POST /unlock - Check the name she typed
app.post('/unlock', (req: Request, res: Response) => {
  const { herName } = req.body;

  if (!herName || typeof herName !== 'string') {
    return res.render('login', { error: 'Come on, type something! I know you know it. 😉' });
  }

  const trimmedLower = herName.trim().toLowerCase();

  if (validNamesLower.includes(trimmedLower)) {
    // SUCCESS: Unlock the session and send her to the letter
    req.session.unlocked = true;
    return res.redirect('/letter');
  } else {
    // FAILURE: Send a flirty random error back to the login page
    const errors = [
      "Hmm, that's not the name I stay up thinking about. Try the short version? 😉",
      "Nope! That's not what I call you in my head. Try again, beautiful. 💕",
      "Nice try, but my heart only has room for one person. Try once more! ✨",
      "You're so close! Just use the name your friends call you. 😘",
    ];
    const randomError = errors[Math.floor(Math.random() * errors.length)];
    return res.render('login', { error: randomError });
  }
});

// GET /letter - Show the love letter (PROTECTED)
app.get('/letter', (req: Request, res: Response) => {
  if (!req.session.unlocked) {
    return res.redirect('/');
  }
  res.render('letter');
});

// GET /propose - Show the proposal page (Accept/Reject game) (PROTECTED)
app.get('/propose', (req: Request, res: Response) => {
  if (!req.session.unlocked) {
    return res.redirect('/');
  }
  res.render('propose');
});

// GET /logout - Reset the session (for testing)
app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// 7. Start the server
app.listen(PORT, () => {
  console.log(`💖 Confession server running at http://localhost:${PORT}`);
  console.log(`🔒 Valid names loaded: ${validNames.join(', ')}`);
});