const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 글 작성
router.post('/', auth, async (req, res) => {
  const { title, content } = req.body;
  const email = req.user.email;

  await db.query('INSERT INTO posts (user_email, title, content) VALUES (?, ?, ?)', [email, title, content]);
  res.status(201).json({ message: '글 작성 완료!' });
});

// 전체 글
router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
  res.json(rows);
});

// 특정 글
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ message: '글 없음' });
  res.json(rows[0]);
});

// 글 수정
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const email = req.user.email;

  const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
  if (rows.length === 0 || rows[0].user_email !== email) {
    return res.status(403).json({ message: '권한 없음' });
  }

  await db.query('UPDATE posts SET title = ?, content = ? WHERE id = ?', [title, content, id]);
  res.json({ message: '글 수정 완료!' });
});

// 글 삭제
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const email = req.user.email;

  const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
  if (rows.length === 0 || rows[0].user_email !== email) {
    return res.status(403).json({ message: '권한 없음' });
  }

  await db.query('DELETE FROM posts WHERE id = ?', [id]);
  res.json({ message: '글 삭제 완료!' });
});

module.exports = router;

