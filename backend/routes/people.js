const express = require('express');
const { pool } = require('../database');
const router = express.Router();

// GET /api/people - Listar todas as pessoas 
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM people ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/people - Adicionar nova pessoa
router.post('/', async (req, res) => {
  try {
    const { name, email, avatar_url } = req.body;
    const result = await pool.query(
      `INSERT INTO people (name, email, avatar_url) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, email || null, avatar_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;