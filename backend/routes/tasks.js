const express = require('express');
const { pool } = require('../database');
const router = express.Router();

// GET /api/tasks - Listar tarefas com relações 
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        p.name as project_name,
        p.color as project_color,
        per.name as assigned_name,
        JSON_AGG(DISTINCT ta.person_id) as assignee_ids,
        (SELECT JSON_AGG(pp) FROM people pp 
         JOIN task_assignees ta ON pp.id = ta.person_id 
         WHERE ta.task_id = t.id) as assignees
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN people per ON t.assigned_to = per.id
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      GROUP BY t.id, p.name, p.color, per.name
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks - Criar tarefa com relações
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { title, description, priority, due_date, project_id, assigned_to, assignees } = req.body;
    
    // Insere a tarefa principal
    const taskResult = await client.query(
      `INSERT INTO tasks (title, description, priority, due_date, project_id, assigned_to) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description || '', priority || 'média', due_date, project_id, assigned_to]
    );
    
    const task = taskResult.rows[0];
    
    // Adiciona múltiplos assignees se fornecidos
    if (assignees && assignees.length > 0) {
      for (const personId of assignees) {
        await client.query(
          'INSERT INTO task_assignees (task_id, person_id) VALUES ($1, $2)',
          [task.id, personId]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json(task);
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/tasks/:id - Atualizar tarefa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, due_date, project_id, assigned_to } = req.body;
    
    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           priority = COALESCE($3, priority),
           status = COALESCE($4, status),
           due_date = $5,
           project_id = $6,
           assigned_to = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, description, priority, status, due_date, project_id, assigned_to, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    res.json({ message: 'Tarefa removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;