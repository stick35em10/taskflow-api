const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 10000;

//  Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Usar novas rotas
app.use('/api/projects', projectsRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/tasks', tasksRoutes);


// 🔁 ROTAS DA API COM POSTGRESQL

// Importar novas rotas
const projectsRoutes = require('./routes/projects');
const peopleRoutes = require('./routes/people');
const tasksRoutes = require('./routes/tasks');

// Health check
app.get('/health', async (req, res) => {
  try {
    // Testa conexão com o database
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      message: 'TaskFlow API with PostgreSQL is running!',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// GET /api/tasks - Listar todas as tarefas
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/tasks/:id - Buscar tarefa por ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/tasks - Criar nova tarefa
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    const result = await pool.query(
      `INSERT INTO tasks (title, description, priority) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, description || '', priority || 'média']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/tasks/:id - Atualizar tarefa
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status } = req.body;
    
    // Verifica se a tarefa existe
    const checkResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1', 
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           priority = COALESCE($3, priority),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, description, priority, status, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/tasks/:id - Deletar tarefa
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    res.json({ 
      message: 'Tarefa removida com sucesso', 
      deletedTask: result.rows[0] 
    });
  } catch (error) {
    console.error('❌ Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar database
    await initDatabase();
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 TaskFlow com PostgreSQL rodando na porta ${PORT}`);
      console.log(`🌐 Health: http://localhost:${PORT}/health`);
      console.log(`🔗 API: http://localhost:${PORT}/api/tasks`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();