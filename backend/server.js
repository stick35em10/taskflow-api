const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 🔥 HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TaskFlow API com Projetos & Pessoas!',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// 🔥 DADOS COMPLETOS DO SISTEMA
const projects = [
  { id: 1, name: 'Desenvolvimento', description: 'Tarefas de programação e desenvolvimento', color: '#27ae60' },
  { id: 2, name: 'Design', description: 'Tarefas de design e UX/UI', color: '#e74c3c' },
  { id: 3, name: 'Reuniões', description: 'Reuniões e planeamento', color: '#f39c12' },
  { id: 4, name: 'Marketing', description: 'Tarefas de marketing e vendas', color: '#9b59b6' },
  { id: 5, name: 'Suporte', description: 'Atendimento ao cliente e suporte', color: '#3498db' }
];

const people = [
  { id: 1, name: 'José Cabicho', email: 'jose.cabicho@email.com', role: 'Desenvolvedor' },
  { id: 2, name: 'Maria Silva', email: 'maria.silva@email.com', role: 'Designer' },
  { id: 3, name: 'Carlos Santos', email: 'carlos.santos@email.com', role: 'Gestor de Projeto' },
  { id: 4, name: 'Ana Oliveira', email: 'ana.oliveira@email.com', role: 'Marketing' },
  { id: 5, name: 'Pedro Fernandes', email: 'pedro.fernandes@email.com', role: 'Suporte' }
];

let tasks = [
  {
    id: 1,
    title: 'Implementar sistema de autenticação',
    description: 'Desenvolver login, registo e recuperação de password',
    priority: 'alta',
    status: 'pendente',
    project_id: 1,
    assigned_to: 1,
    project_name: 'Desenvolvimento',
    project_color: '#27ae60',
    assigned_name: 'José Cabicho',
    createdat: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Criar design do dashboard',
    description: 'Design da interface principal do sistema TaskFlow',
    priority: 'média',
    status: 'em-progresso',
    project_id: 2,
    assigned_to: 2,
    project_name: 'Design',
    project_color: '#e74c3c',
    assigned_name: 'Maria Silva',
    createdat: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Reunião de planeamento semanal',
    description: 'Discutir objetivos e tarefas da próxima semana',
    priority: 'baixa',
    status: 'concluída',
    project_id: 3,
    assigned_to: 3,
    project_name: 'Reuniões',
    project_color: '#f39c12',
    assigned_name: 'Carlos Santos',
    createdat: new Date().toISOString()
  },
  {
    id: 4,
    title: 'Campanha de lançamento',
    description: 'Preparar campanha de marketing para o lançamento',
    priority: 'alta',
    status: 'pendente',
    project_id: 4,
    assigned_to: 4,
    project_name: 'Marketing',
    project_color: '#9b59b6',
    assigned_name: 'Ana Oliveira',
    createdat: new Date().toISOString()
  }
];

// 🔥 GET /api/tasks - COM RELAÇÕES
app.get('/api/tasks', (req, res) => {
  try {
    console.log('📥 GET /api/tasks - Retornando', tasks.length, 'tarefas');
    res.json(tasks);
  } catch (error) {
    console.error('❌ Erro em GET /api/tasks:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🔥 GET /api/projects
app.get('/api/projects', (req, res) => {
  try {
    console.log('📁 GET /api/projects - Retornando', projects.length, 'projetos');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔥 GET /api/people
app.get('/api/people', (req, res) => {
  try {
    console.log('👥 GET /api/people - Retornando', people.length, 'pessoas');
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔥 POST /api/tasks - COM PROJETOS E PESSOAS
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, priority, project_id, assigned_to } = req.body;
    
    console.log('📝 POST /api/tasks - Nova tarefa:', { title, project_id, assigned_to });
    
    const project = projects.find(p => p.id == project_id);
    const person = people.find(p => p.id == assigned_to);
    
    const newTask = {
      id: tasks.length + 1,
      title: title || 'Nova tarefa',
      description: description || '',
      priority: priority || 'média',
      status: 'pendente',
      project_id: project_id || null,
      assigned_to: assigned_to || null,
      project_name: project ? project.name : 'Geral',
      project_color: project ? project.color : '#95a5a6',
      assigned_name: person ? person.name : 'Não atribuído',
      createdat: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    
    console.log('✅ Tarefa criada:', newTask.id);
    res.status(201).json(newTask);
    
  } catch (error) {
    console.error('❌ Erro em POST /api/tasks:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

// 🔥 PUT /api/tasks/:id
app.put('/api/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status, title, description, priority, project_id, assigned_to } = req.body;
    
    console.log(`🔄 PUT /api/tasks/${taskId}`, req.body);
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    // Atualiza apenas os campos fornecidos
    if (status !== undefined) tasks[taskIndex].status = status;
    if (title !== undefined) tasks[taskIndex].title = title;
    if (description !== undefined) tasks[taskIndex].description = description;
    if (priority !== undefined) tasks[taskIndex].priority = priority;
    
    // Atualiza projeto se fornecido
    if (project_id !== undefined) {
      const project = projects.find(p => p.id == project_id);
      tasks[taskIndex].project_id = project_id;
      tasks[taskIndex].project_name = project ? project.name : 'Geral';
      tasks[taskIndex].project_color = project ? project.color : '#95a5a6';
    }
    
    // Atualiza pessoa se fornecida
    if (assigned_to !== undefined) {
      const person = people.find(p => p.id == assigned_to);
      tasks[taskIndex].assigned_to = assigned_to;
      tasks[taskIndex].assigned_name = person ? person.name : 'Não atribuído';
    }
    
    console.log('✅ Tarefa atualizada:', taskId);
    res.json(tasks[taskIndex]);
    
  } catch (error) {
    console.error('❌ Erro em PUT /api/tasks:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// 🔥 DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    console.log(`🗑️ DELETE /api/tasks/${taskId}`);
    
    const initialLength = tasks.length;
    tasks = tasks.filter(task => task.id !== taskId);
    
    if (tasks.length === initialLength) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    console.log('✅ Tarefa excluída:', taskId);
    res.json({ message: 'Tarefa removida com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro em DELETE /api/tasks:', error);
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
});

// Rota para servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🎉 TASKFLOW PRO - SISTEMA COMPLETO!');
  console.log('📍 Porta:', PORT);
  console.log('📊 Estatísticas:');
  console.log('   •', projects.length, 'projetos configurados');
  console.log('   •', people.length, 'pessoas na equipa');
  console.log('   •', tasks.length, 'tarefas de exemplo');
  console.log('');
  console.log('🚀 Sistema pronto para uso!');
  console.log('='.repeat(60));
});