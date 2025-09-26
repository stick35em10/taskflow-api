const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000; // Render usa porta automática

// "Database" em memória (simples para demo)
let tasks = [];
let currentId = 1;

// Middleware
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 🔁 ROTAS DA API
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'TaskFlow API is running!',
        timestamp: new Date().toISOString(),
        taskCount: tasks.length
    });
});

app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
    const newTask = {
        id: currentId++,
        title: req.body.title,
        description: req.body.description || '',
        priority: req.body.priority || 'média',
        status: 'pendente',
        createdAt: new Date()
    };
    
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    
    tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
    res.json(tasks[taskIndex]);
});

app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    tasks = tasks.filter(task => task.id !== taskId);
    res.json({ message: 'Tarefa removida com sucesso' });
});

// Rota para servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TaskFlow rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
});