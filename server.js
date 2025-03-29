require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mysql = require('mysql2/promise');
const postsRouter = require('./routes/posts');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ DB 연결 풀 생성
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ✅ 회원가입
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashed]);

    res.status(201).json({ message: '회원가입 성공!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 에러' });
  }
});

// ✅ 로그인
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: '로그인 성공!', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 에러' });
  }
});

app.use('/posts', postsRouter);

app.get('/', (req, res) => res.send('서버 정상 작동 중'));

app.listen(3000, '0.0.0.0', () => {
  console.log('서버 실행 중: http://0.0.0.0:3000');
});

