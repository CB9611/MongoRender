const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

// MongoDB connection URI
const uri = process.env.MONGODB_URI;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Create a new MongoDB collection for storing credentials
const client = new MongoClient(uri);
const dbName = 'MyDBexample';
const collectionName = 'Credentials';
const cssPath = path.join(__dirname, '/testmongo.css');

// Render the login/register form
app.get('/', (req, res) => {
  if (req.cookies.authCookie) {
    res.send(`Auth. chocolate chip cookie exists: ${req.cookies.authCookie}<br><a href="/report">View Cookies</a><br><a href="/clear">Clear Cookies</a>`);
  } else {
    res.send(`
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration and Login Form</title>
        <style>
          .body-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
          }
            
          .reg-container {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              margin-bottom: 25px;
              margin-top: 15px;
          }

          .login-container {
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }

          input {
              width: 100%;
              padding: 10px;
              margin-bottom: 15px;
              border: 1px solid #ccc;
              border-radius: 5px;
          }

          button {
              background-color: darkred;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
          }

          button:hover {
              background-color: red;
              color: black;
          }
        </style>
      </head>
      <body class="body-container">
          <div class="reg-container">
              <form action="/register" method="post">
                  <h2>Register</h2>
                  <input type="text" name="userId" placeholder="Username" required>
                  <input type="password" name="password" placeholder="Password" required>
                  <button type="submit">Sign Up!</button>
              </form>
          </div>
          <div class="login-container">
              <form action="/login" method="post">
                  <h2>Login</h2>
                  <input type="text" name="userId" placeholder="Username" required>
                  <input type="password" name="password" placeholder="Password" required>
                  <button type="submit">Login</button>
              </form>
          </div>
      </body>
    `);
  }
});

// Register a new user
app.post('/register', async (req, res) => {
  const { userId, password } = req.body;
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);
    const doc = { userId, password };
    const result = await collection.insertOne(doc);
    console.log(`New user created: ${result.insertedId}`);
    res.send(`User ${userId} created successfully! <a href="/">Go Back</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('R.I.P. Error, try again!');
  } finally {
    await client.close();
  }
});

// Authenticate user and set auth cookie
app.post('/login', async (req, res) => {
  const { userId, password } = req.body;
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);
    const user = await collection.findOne({ userId, password });
    if (user) {
      res.cookie('authCookie', userId, { maxAge: 60000, httpOnly: true });
      res.send(`Login successful! Authentication cookie set for 1 minute.<br><a href="/report">View Cookies</a><br><a href="/clear">Clear Cookies</a>`);
    } else {
      res.send(`Invalid credentials.`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('R.I.P. Error, try again!');
  } finally {
    await client.close();
  }
});

// Report active cookies
app.get('/report', (req, res) => {
  res.send(`Active cookies:<br>${JSON.stringify(req.cookies)}<br><a href="/clear">Clear Cookies</a><br><a href="/">Go Back</a>`);
});

// Clear all cookies
app.get('/clear', (req, res) => {
  res.clearCookie('authCookie');
  res.send('No more chocolate chip cookies (Cookies Cleared).<br><a href="/report">View Cookies</a><br><a href="/">Go Back</a>');
});

app.listen(port, () => {
  console.log(`FREE COOKIES on http://localhost:${port}`);
});