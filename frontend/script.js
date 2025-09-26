//const API_URL = 'http://localhost:5000/api/tasks';
// Usa o nome do serviço do Docker Compose
//const API_URL = 'http://localhost:3003/api/tasks'; // Para desenvolvimento local
// const API_URL = '/api/tasks'; // Para produção com proxy

// Configuração automática da API URL
const getApiBaseUrl = () => {
    if (window.location.hostname.includes('render.com')) {
        return '/api'; // Mesmo domínio no Render
    }
    return 'http://localhost:10000/api'; // Desenvolvimento local
};

const API_URL = `${getApiBaseUrl()}/tasks`;

// Carregar tarefas ao iniciar
document.addEventListener('DOMContentLoaded', loadTasks);

// Adicionar nova tarefa
document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            document.getElementById('taskForm').reset();
            loadTasks();
        }
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
    }
});

// Carregar tarefas
async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
    }
}

// Exibir tarefas na tela
function displayTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item prioridade-${task.priority}`;
        taskElement.innerHTML = `
            <h4>${task.title}</h4>
            <p>${task.description || 'Sem descrição'}</p>
            <small>Prioridade: ${task.priority} | Status: ${task.status}</small>
            <div class="task-actions">
                <button class="btn-concluir" onclick="updateTask('${task._id}', 'concluída')">Concluir</button>
                <button class="btn-editar" onclick="editTask('${task._id}')">Editar</button>
                <button class="btn-excluir" onclick="deleteTask('${task._id}')">Excluir</button>
            </div>
        `;
        container.appendChild(taskElement);
    });
}

// Atualizar status da tarefa
async function updateTask(id, status) {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        loadTasks();
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
    }
}

// Excluir tarefa
async function deleteTask(id) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            loadTasks();
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
        }
    }
}

// ... resto do código permanece igual
console.log('🔗 API URL:', API_URL);