const { Pool } = require('pg');
require('dotenv').config();

// Configuração do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/taskflow',
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro fatal na conexão PostgreSQL:', err);
  process.exit(-1);
});

// Inicializar database
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) DEFAULT 'média',
        status VARCHAR(50) DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabela tasks verificada/criada');
    
    // Inserir dados de exemplo se a tabela estiver vazia
    const result = await pool.query('SELECT COUNT(*) FROM tasks');
    if (parseInt(result.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO tasks (title, description, priority, status) VALUES
        ('Bem-vindo ao TaskFlow!', 'Sistema com PostgreSQL', 'alta', 'pendente'),
        ('Tarefa de exemplo', 'Esta é uma tarefa de teste', 'média', 'concluída')
      `);
      console.log('✅ Dados de exemplo inseridos');
    }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar database:', error);
  }
}

module.exports = { pool, initDatabase };