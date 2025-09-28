// Configuração
const API_BASE_URL = window.location.origin;
const API_URLS = {
  tasks: `${API_BASE_URL}/api/tasks`,
  projects: `${API_BASE_URL}/api/projects`,
  people: `${API_BASE_URL}/api/people`
};

console.log('🚀 TaskFlow Pro - Sistema Completo Iniciado');

// Estado global
let tasks = [];
let projects = [];
let people = [];
let currentFilters = {
  project: '',
  person: '',
  status: 'all'
};

// Elementos DOM
const elements = {
  taskForm: document.getElementById('taskForm'),
  tasksContainer: document.getElementById('tasksContainer'),
  projectsContainer: document.getElementById('projectsContainer'),
  peopleContainer: document.getElementById('peopleContainer'),
  projectFilter: document.getElementById('projectFilter'),
  personFilter: document.getElementById('personFilter'),
  statusFilter: document.getElementById('statusFilter'),
  projectSelect: document.getElementById('project_id'),
  personSelect: document.getElementById('assigned_to'),
  searchInput: document.getElementById('searchInput')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Inicializando TaskFlow Pro...');
  loadInitialData();
  setupEventListeners();
});

// Carregar dados iniciais
async function loadInitialData() {
  try {
    showLoading(true);
    
    const [tasksData, projectsData, peopleData] = await Promise.all([
      fetch(API_URLS.tasks).then(r => r.json()),
      fetch(API_URLS.projects).then(r => r.json()),
      fetch(API_URLS.people).then(r => r.json())
    ]);
    
    tasks = tasksData;
    projects = projectsData;
    people = peopleData;
    
    console.log(`✅ Dados carregados: ${tasks.length} tarefas, ${projects.length} projetos, ${people.length} pessoas`);
    
    renderAll();
    showNotification('🎉 Sistema carregado com sucesso!', 'success');
    
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    showNotification('⚠️ Erro ao carregar dados da API', 'error');
  } finally {
    showLoading(false);
  }
}

// Renderizar tudo
function renderAll() {
  renderTasks();
  renderProjects();
  renderPeople();
  updateSelects();
  updateFilters();
}

// Renderizar tarefas
function renderTasks() {
  const container = elements.tasksContainer;
  if (!container) return;
  
  let filteredTasks = tasks.filter(task => {
    const projectMatch = !currentFilters.project || task.project_id == currentFilters.project;
    const personMatch = !currentFilters.person || task.assigned_to == currentFilters.person;
    const statusMatch = currentFilters.status === 'all' || task.status === currentFilters.status;
    const searchMatch = !currentFilters.search || 
      task.title.toLowerCase().includes(currentFilters.search) ||
      task.description.toLowerCase().includes(currentFilters.search);
    
    return projectMatch && personMatch && statusMatch && searchMatch;
  });
  
  container.innerHTML = filteredTasks.map(task => `
    <div class="task-item prioridade-${task.priority} ${task.status === 'concluída' ? 'concluída' : ''}">
      <div class="task-badges">
        ${task.project_name ? `<span class="badge-project" style="background: ${task.project_color}">${task.project_name}</span>` : ''}
        ${task.assigned_name ? `<span class="badge-person">👤 ${task.assigned_name}</span>` : ''}
        <span class="badge-priority badge-priority-${task.priority}">${getPriorityIcon(task.priority)} ${task.priority}</span>
        <span class="badge-status">${getStatusIcon(task.status)} ${task.status}</span>
      </div>
      <h4>${task.title}</h4>
      ${task.description ? `<p>${task.description}</p>` : ''}
      <small>📅 Criada em: ${formatDate(task.createdat)}</small>
      <div class="task-actions">
        ${task.status !== 'concluída' ? 
          `<button class="btn-concluir" onclick="updateTask(${task.id}, 'concluída')">✅ Concluir</button>` : 
          `<button class="btn-reabrir" onclick="updateTask(${task.id}, 'pendente')">↩️ Reabrir</button>`
        }
        <button class="btn-editar" onclick="editTask(${task.id})">✏️ Editar</button>
        <button class="btn-excluir" onclick="deleteTask(${task.id})">🗑️ Excluir</button>
      </div>
    </div>
  `).join('');
  
  // Atualizar estatísticas
  updateStats();
}

// Renderizar projetos
function renderProjects() {
  const container = elements.projectsContainer;
  if (!container) return;
  
  container.innerHTML = projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id).length;
    return `
      <div class="project-card" style="border-left-color: ${project.color}">
        <div class="card-header">
          <h4>${project.name}</h4>
          <span class="task-count">${projectTasks}</span>
        </div>
        <p>${project.description || 'Sem descrição'}</p>
        <div class="project-actions">
          <button onclick="filterByProject(${project.id})" class="btn-filter">🔍 Ver tarefas</button>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar pessoas
function renderPeople() {
  const container = elements.peopleContainer;
  if (!container) return;
  
  container.innerHTML = people.map(person => {
    const personTasks = tasks.filter(t => t.assigned_to === person.id).length;
    return `
      <div class="person-card">
        <div class="card-header">
          <h4>${person.name}</h4>
          <span class="task-count">${personTasks}</span>
        </div>
        <p>${person.email || 'Sem email'}</p>
        <small>${person.role || 'Membro da equipa'}</small>
        <div class="person-actions">
          <button onclick="filterByPerson(${person.id})" class="btn-filter">🔍 Ver tarefas</button>
        </div>
      </div>
    `;
  }).join('');
}

// Atualizar selects
function updateSelects() {
  if (elements.projectSelect) {
    elements.projectSelect.innerHTML = '<option value="">Selecionar Projeto</option>' +
      projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
  
  if (elements.personSelect) {
    elements.personSelect.innerHTML = '<option value="">Atribuir a...</option>' +
      people.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
}

// Atualizar filtros
function updateFilters() {
  if (elements.projectFilter) {
    elements.projectFilter.innerHTML = '<option value="">Todos os Projetos</option>' +
      projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
  
  if (elements.personFilter) {
    elements.personFilter.innerHTML = '<option value="">Todas as Pessoas</option>' +
      people.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Formulário de tarefa
  if (elements.taskForm) {
    elements.taskForm.addEventListener('submit', handleAddTask);
  }
  
  // Filtros
  if (elements.projectFilter) {
    elements.projectFilter.addEventListener('change', (e) => {
      currentFilters.project = e.target.value;
      renderTasks();
    });
  }
  
  if (elements.personFilter) {
    elements.personFilter.addEventListener('change', (e) => {
      currentFilters.person = e.target.value;
      renderTasks();
    });
  }
  
  if (elements.statusFilter) {
    elements.statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      renderTasks();
    });
  }
  
  // Busca
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.toLowerCase();
      renderTasks();
    });
  }
}

// Adicionar nova tarefa
async function handleAddTask(e) {
  e.preventDefault();
  
  const formData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value,
    project_id: document.getElementById('project_id').value || null,
    assigned_to: document.getElementById('assigned_to').value || null
  };
  
  try {
    const response = await fetch(API_URLS.tasks, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      const newTask = await response.json();
      tasks.unshift(newTask);
      renderAll();
      elements.taskForm.reset();
      showNotification('✅ Tarefa criada com sucesso!', 'success');
    } else {
      throw new Error('Erro ao criar tarefa');
    }
  } catch (error) {
    console.error('❌ Erro ao criar tarefa:', error);
    showNotification('❌ Erro ao criar tarefa', 'error');
  }
}

// 🔧 FUNÇÕES GLOBAIS
window.updateTask = async function(id, status) {
  try {
    const response = await fetch(`${API_URLS.tasks}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (response.ok) {
      const updatedTask = await response.json();
      const taskIndex = tasks.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTask;
      }
      renderTasks();
      showNotification('✅ Status atualizado!', 'success');
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error);
    showNotification('❌ Erro ao atualizar tarefa', 'error');
  }
};

window.deleteTask = async function(id) {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
  
  try {
    const response = await fetch(`${API_URLS.tasks}/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      tasks = tasks.filter(t => t.id !== id);
      renderAll();
      showNotification('🗑️ Tarefa excluída!', 'success');
    }
  } catch (error) {
    console.error('❌ Erro ao excluir tarefa:', error);
    showNotification('❌ Erro ao excluir tarefa', 'error');
  }
};

window.filterByProject = function(projectId) {
  currentFilters.project = projectId;
  if (elements.projectFilter) elements.projectFilter.value = projectId;
  renderTasks();
  showNotification(`🔍 Filtrando por: ${projects.find(p => p.id === projectId)?.name}`, 'info');
};

window.filterByPerson = function(personId) {
  currentFilters.person = personId;
  if (elements.personFilter) elements.personFilter.value = personId;
  renderTasks();
  showNotification(`🔍 Filtrando por: ${people.find(p => p.id === personId)?.name}`, 'info');
};

window.editTask = function(id) {
  showNotification('✏️ Funcionalidade de edição em desenvolvimento...', 'info');
};

// Funções auxiliares
function updateStats() {
  const totalTasks = document.getElementById('totalTasks');
  const pendingTasks = document.getElementById('pendingTasks');
  const completedTasks = document.getElementById('completedTasks');
  
  if (totalTasks) totalTasks.textContent = tasks.length;
  if (pendingTasks) pendingTasks.textContent = tasks.filter(t => t.status === 'pendente').length;
  if (completedTasks) completedTasks.textContent = tasks.filter(t => t.status === 'concluída').length;
}

function showLoading(loading) {
  const loader = document.getElementById('loadingMessage');
  if (loader) loader.style.display = loading ? 'block' : 'none';
}

function getPriorityIcon(priority) {
  const icons = { alta: '🔴', média: '🟡', baixa: '🟢' };
  return icons[priority] || '⚪';
}

function getStatusIcon(status) {
  const icons = { pendente: '⏳', 'em-progresso': '🔄', concluída: '✅' };
  return icons[status] || '📝';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

function showNotification(message, type) {
  // Implementação simples
  alert(`📢 ${message}`);
}