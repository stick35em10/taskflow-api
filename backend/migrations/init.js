const { pool } = require('../database');

async function runMigrations() {
  try {
    // Tabela de Projetos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3498db',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Pessoas/Usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Tarefas (atualizada com relações)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) DEFAULT 'média',
        status VARCHAR(50) DEFAULT 'pendente',
        due_date DATE,
        
        -- Relações
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        assigned_to INTEGER REFERENCES people(id) ON DELETE SET NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de relação muitos-para-muitos (tarefas podem ter múltiplas pessoas)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_assignees (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, person_id)
      )
    `);

    // Dados iniciais
    await pool.query(`
      INSERT INTO projects (name, description, color) VALUES
      ('Desenvolvimento', 'Tarefas de desenvolvimento de software', '#27ae60'),
      ('Design', 'Tarefas de design e UX/UI', '#e74c3c'),
      ('Reuniões', 'Reuniões e planeamento', '#f39c12')
      ON CONFLICT DO NOTHING
    `);

    await pool.query(`
      INSERT INTO people (name, email) VALUES
      ('José Cabicho', 'jose.cabicho@email.com'),
      ('Maria Silva', 'maria.silva@email.com'),
      ('Carlos Santos', 'carlos.santos@email.com')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Database schema criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro nas migrações:', error);
    throw error;
  }
}

module.exports = runMigrations;