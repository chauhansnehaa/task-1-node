const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs'); 
const { google } = require('googleapis');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;




// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
app.use(express.static(__dirname));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Rs#R$2020',
  database: 'nodelogin'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});


app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  const checkUserQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
  db.query(checkUserQuery, [email, username], async (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Server error' });
      }
      if (results.length > 0) {
          const existingUser = results.find(user => user.email === email);
          if (existingUser) {
              return res.status(400).json({ message: 'Email already exists' });
          }
          const existingUsername = results.find(user => user.username === username);
          if (existingUsername) {
              return res.status(400).json({ message: 'Username already exists' });
          }
      }

      try {
          const hashedPassword = await bcrypt.hash(password, 10);
          const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
          db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Error signing up' });
          } else {
              return res.status(200).json({ message: 'Signup successful' });
          }
      });
  } catch (hashErr) {
      console.error(hashErr);
      return res.status(500).json({ message: 'Error signing up' });
  }
});
});


app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
          return res.status(400).json({ message: 'User not found' });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      res.redirect('/home');
  });
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

app.post('/updatePassword', async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
      return res.status(400).json({ message: 'Both username and new password are required' });
  }

  try {
      const selectQuery = 'SELECT * FROM users WHERE username = ?';
      db.query(selectQuery, [username], async (err, results) => {
          if (err) {
              console.error('Error querying database:', err);
              return res.status(500).json({ message: 'Server error' });
          }

          if (results.length === 0) {
              return res.status(404).json({ message: 'User not found' });
          }

          const hashedPassword = await bcrypt.hash(newPassword, 10);
          const updateQuery = 'UPDATE users SET password = ? WHERE username = ?';
          db.query(updateQuery, [hashedPassword, username], (err, result) => {
              if (err) {
                  console.error('Error updating password:', err);
                  return res.status(500).json({ message: 'Error updating password' });
              }

              return res.status(200).json({ message: 'Password updated successfully' });
          });
      });
  } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: 'Server error' });
  }
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
