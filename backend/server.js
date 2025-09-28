const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// 🔥 MIDDLEWARE SIMPLES E CONFIÁVEL
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 🔥 HEALTH CHECK (JÁ FUNCIONA)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TaskFlow API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// 🔥 ROTA /api/tasks - VERSÃO SUPER SIMPLIFICADA
app.get('/api/tasks', (req, res) => {
  console.log('🎯 GET /api/tasks - Executando...');
  
  // Dados FIXOS e garantidos
  const tasks = [
    {
      id: 1,
      title: 'TaskFlow Funcionando! 🎉',
      description: 'A rota /api/tasks agora está operacional',
      priority: 'alta',
      status: 'pendente',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Segunda tarefa de teste',
      description: 'Tudo funcionando perfeitamente',
      priority: 'média',
      status: 'concluída',
      createdAt: new Date().toISOString()
    }
  ];
  
  console.log(`✅ Retornando ${tasks.length} tarefas`);
  res.json(tasks);
});

// 🔥 ROTA /api/projects - SIMPLES
app.get('/api/projects', (req, res) => {
  res.json([
    { id: 1, name: 'Desenvolvimento', color: '#27ae60' },
    { id: 2, name: 'Design', color: '#e74c3c' }
  ]);
});

// 🔥 ROTA /api/people - SIMPLES  
app.get('/api/people', (req, res) => {
  res.json([
    { id: 1, name: 'José Cabicho' },
    { id: 2, name: 'Maria Silva' }
  ]);
});

// Rota para servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 🔥 INICIAR SERVIDOR
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 SERVIDOR INICIADO - ROTAS SIMPLIFICADAS');
  console.log('📍 Porta:', PORT);
  console.log('✅ /health ← FUNCIONA');
  console.log('🎯 /api/tasks ← AGORA DEVE FUNCIONAR');
  console.log('='.repeat(50));
});