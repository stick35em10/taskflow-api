// Configuração da API URL para Render
const getApiBaseUrl = () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:10000' : '';
};

const API_BASE_URL = getApiBaseUrl();
const API_URL = `${API_BASE_URL}/api/tasks`;

// Atualiza o display da URL da API
document.getElementById('apiUrl').textContent = API_URL || '/api/tasks';

// Estado da aplicação
let tasks = [];
let currentFilter = 'all';
let currentSearch = '';

// Elementos DOM
const elements = {
    taskForm: document.getElementById('taskForm'),
    tasksContainer: document.getElementById('tasksContainer'),
    loadingMessage: document.getElementById('loadingMessage'),
    errorMessage: document.getElementById('errorMessage'),
    totalTasks: document.getElementById('totalTasks'),
    pendingTasks: document.getElementById('pendingTasks'),
    completedTasks: document.getElementById('completedTasks'),
    searchInput: document.getElementById('searchInput'),
    submitBtn: document.getElementById('submitBtn')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 TaskFlow Frontend Iniciado');
    console.log('🔗 API URL:', API_URL);
    
    loadTasks();
    setupEventListeners();
});

// Configura event listeners
function setupEventListeners() {
    // Formulário de nova tarefa
    elements.taskForm.addEventListener('submit', handleAddTask);
    
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });
    
    // Busca
    elements.searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderTasks();
    });
}

// Carrega tarefas da API
async function loadTasks() {
    try {
        elements.loadingMessage.style.display = 'block';
        elements.errorMessage.style.display = 'none';
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        tasks = await response.json();
        renderTasks();
        updateStats();
        
    } catch (error) {
        console.error('❌ Erro ao carregar tarefas:', error);
        elements.errorMessage.style.display = 'block';
        elements.errorMessage.innerHTML = `
            ❌ Erro ao conectar com a API: ${error.message}<br>
            <small>Verifique se o servidor está rodando em ${API_URL}</small>
        `;
    } finally {
        elements.loadingMessage.style.display = 'none';
    }
}

// Adiciona nova tarefa
async function handleAddTask(e) {
    e.preventDefault();
    
    const formData = new FormData(elements.taskForm);
    const taskData = {
        title: formData.get('title') || document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value
    };
    
    if (!taskData.title.trim()) {
        showNotification('⚠️ Por favor, insira um título para a tarefa', 'warning');
        return;
    }
    
    try {
        setLoadingState(true);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const newTask = await response.json();
        tasks.unshift(newTask);
        
        elements.taskForm.reset();
        renderTasks();
        updateStats();
        showNotification('✅ Tarefa adicionada com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar tarefa:', error);
        showNotification('❌ Erro ao adicionar tarefa', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Renderiza as tarefas na tela
function renderTasks() {
    let filteredTasks = tasks;
    
    // Aplica filtro
    if (currentFilter !== 'all') {
        filteredTasks = tasks.filter(task => task.status === currentFilter);
    }
    
    // Aplica busca
    if (currentSearch) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(currentSearch) ||
            task.description.toLowerCase().includes(currentSearch)
        );
    }
    
    elements.tasksContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        elements.tasksContainer.innerHTML = `
            <div class="empty-state">
                <p>${currentSearch || currentFilter !== 'all' ? 'Nenhuma tarefa encontrada com os filtros aplicados' : 'Nenhuma tarefa encontrada. Adicione sua primeira tarefa!'}</p>
            </div>
        `;
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        elements.tasksContainer.appendChild(taskElement);
    });
}

// Cria elemento HTML para uma tarefa
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item prioridade-${task.priority} ${task.status === 'concluída' ? 'concluída' : ''}`;
    
    taskElement.innerHTML = `
        <h4>${escapeHtml(task.title)}</h4>
        ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
        <small>
            📊 <strong>Prioridade:</strong> ${task.priority} | 
            📝 <strong>Status:</strong> ${task.status} | 
            📅 <strong>Criada em:</strong> ${formatDate(task.createdAt)}
        </small>
        <div class="task-actions">
            ${task.status !== 'concluída' ? 
                `<button class="btn-concluir" onclick="updateTask(${task.id}, 'concluída')">✅ Concluir</button>` : 
                `<button class="btn-concluir" onclick="updateTask(${task.id}, 'pendente')">↩️ Reabrir</button>`
            }
            <button class="btn-editar" onclick="editTask(${task.id})">✏️ Editar</button>
            <button class="btn-excluir" onclick="deleteTask(${task.id})">🗑️ Excluir</button>
        </div>
    `;
    
    return taskElement;
}

// Atualiza estatísticas
function updateStats() {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pendente').length;
    const completed = tasks.filter(t => t.status === 'concluída').length;
    
    elements.totalTasks.textContent = total;
    elements.pendingTasks.textContent = pending;
    elements.completedTasks.textContent = completed;
}

// Atualiza status da tarefa
async function updateTask(id, status) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const updatedTask = await response.json();
        const taskIndex = tasks.findIndex(t => t.id === id);
        
        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
            renderTasks();
            updateStats();
            showNotification('✅ Status da tarefa atualizado!', 'success');
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar tarefa:', error);
        showNotification('❌ Erro ao atualizar tarefa', 'error');
    }
}

// Exclui tarefa
async function deleteTask(id) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
        updateStats();
        showNotification('✅ Tarefa excluída com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao excluir tarefa:', error);
        showNotification('❌ Erro ao excluir tarefa', 'error');
    }
}

// Funções auxiliares
function setLoadingState(loading) {
    const btnText = elements.submitBtn.querySelector('.btn-text');
    const btnLoading = elements.submitBtn.querySelector('.btn-loading');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        elements.submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        elements.submitBtn.disabled = false;
    }
}

function showNotification(message, type) {
    // Implementação simples de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#e74c3c'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Funções para modal de edição (para implementação futura)
function editTask(id) {
    showNotification('✏️ Funcionalidade de edição em desenvolvimento...', 'info');
}

// Teste de conexão com a API
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Conexão com a API estabelecida');
        }
    } catch (error) {
        console.warn('⚠️ Não foi possível conectar com a API');
    }
}

// Testa a conexão ao carregar
testConnection();

// 🔧 CORREÇÃO: Funções globais para os eventos onclick
window.updateTask = async function(id, status) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const updatedTask = await response.json();
        const taskIndex = tasks.findIndex(t => t.id === id);
        
        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
            renderTasks();
            updateStats();
            showNotification('✅ Status da tarefa atualizado!', 'success');
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar tarefa:', error);
        showNotification('❌ Erro ao atualizar tarefa', 'error');
    }
};

window.deleteTask = async function(id) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
        updateStats();
        showNotification('✅ Tarefa excluída com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao excluir tarefa:', error);
        showNotification('❌ Erro ao excluir tarefa', 'error');
    }
};

window.editTask = function(id) {
    showNotification('✏️ Funcionalidade de edição em desenvolvimento...', 'info');
};

// 🔧 CORREÇÃO: Também torne estas funções globais
window.renderTasks = renderTasks;
window.updateStats = updateStats;
window.showNotification = showNotification