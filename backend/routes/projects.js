const express = require('express');
const { pool } = require('../database');
const router = express.Router();

// GET /api/projects - Listar todos os projetos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM projects ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects - Criar novo projeto
router.post('/', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const result = await pool.query(
      `INSERT INTO projects (name, description, color) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || '', color || '#3498db']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;