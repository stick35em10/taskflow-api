const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Importar rotas
const projectsRoutes = require('./routes/projects');
const peopleRoutes = require('./routes/people');
const tasksRoutes = require('./routes/tasks');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas
app.use('/api/projects', projectsRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/tasks', tasksRoutes);


// 🔥 HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TaskFlow API está funcionando!',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'
  });
});

// 🔥 DADOS EM MEMÓRIA (PARA DESENVOLVIMENTO LOCAL)
let tasks = [
  { 
    id: 1, 
    title: 'Bem-vindo ao TaskFlow! 🚀', 
    description: 'Sistema funcionando perfeitamente', 
    priority: 'alta', 
    status: 'pendente', 
    createdAt: new Date() 
  },
  { 
    id: 2, 
    title: 'Tarefa de exemplo concluída', 
    description: 'Demonstração do sistema em ação', 
    priority: 'média', 
    status: 'concluída', 
    createdAt: new Date() 
  }
];

// 🔥 GET /api/tasks - FUNCIONAL EM AMBIENTES
app.get('/api/tasks', async (req, res) => {
  try {
    // Tenta usar PostgreSQL se disponível
    if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query(`
        SELECT id, title, description, priority, status, created_at as "createdAt" 
        FROM tasks 
        ORDER BY created_at DESC
      `);
      return res.json(result.rows);
    }
    
    // Fallback para memória (desenvolvimento local)
    console.log('📊 Usando dados em memória (modo desenvolvimento)');
    res.json(tasks);
    
  } catch (error) {
    console.error('❌ Erro no PostgreSQL, usando fallback:', error);
    // Fallback seguro
    res.json(tasks);
  }
});

// 🔥 POST /api/tasks - FUNCIONAL EM AMBIENTES
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    // Tenta usar PostgreSQL se disponível
    if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query(
        `INSERT INTO tasks (title, description, priority) 
         VALUES ($1, $2, $3) 
         RETURNING id, title, description, priority, status, created_at as "createdAt"`,
        [title, description || '', priority || 'média']
      );
      return res.status(201).json(result.rows[0]);
    }
    
    // Fallback para memória
    const newTask = {
      id: tasks.length + 1,
      title,
      description: description || '',
      priority: priority || 'média',
      status: 'pendente',
      createdAt: new Date()
    };
    
    tasks.unshift(newTask);
    res.status(201).json(newTask);
    
  } catch (error) {
    console.error('❌ Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🔥 PUT /api/tasks/:id - ROTA COMPLETA
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, priority, status } = req.body;
    
    console.log(`📥 PUT /api/tasks/${taskId}`, req.body);

    // Tenta usar PostgreSQL se disponível
    if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query(
        `UPDATE tasks 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             priority = COALESCE($3, priority),
             status = COALESCE($4, status)
         WHERE id = $5
         RETURNING id, title, description, priority, status, created_at as "createdAt"`,
        [title, description, priority, status, taskId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }
      
      return res.json(result.rows[0]);
    }
    
    // Fallback para memória
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    
    tasks[taskIndex] = { 
      ...tasks[taskIndex], 
      ...req.body,
      // Mantém created_at original, só atualiza os campos fornecidos
    };
    
    res.json(tasks[taskIndex]);
    
  } catch (error) {
    console.error('❌ Erro em PUT /api/tasks:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🔥 DELETE /api/tasks/:id - ROTA COMPLETA
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);    
    console.log(`📥 DELETE /api/tasks/${taskId}`);
    // Tenta usar PostgreSQL se disponível
    if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query(
        'DELETE FROM tasks WHERE id = $1 RETURNING *',
        [taskId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }
      
      return res.json({ message: 'Tarefa removida com sucesso' });
    }
    
    // Fallback para memória
    const initialLength = tasks.length;
    tasks = tasks.filter(task => task.id !== taskId);
    
    if (tasks.length === initialLength) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    res.json({ message: 'Tarefa removida com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro em DELETE /api/tasks:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 TASKFLOW INICIADO COM SUCESSO!');
  console.log('📊 Porta:', PORT);
  console.log('🌐 URL: http://localhost:' + PORT);
  console.log('💾 Database:', process.env.DATABASE_URL ? 'PostgreSQL (Render)' : 'Memória (Local)');
  console.log('✅ Health: http://localhost:' + PORT + '/health');
  console.log('🔗 API: http://localhost:' + PORT + '/api/tasks');
  console.log('='.repeat(60));
});