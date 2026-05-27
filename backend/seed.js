import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const db = getDb();

// Verifica se já existem usuários
const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (existingUsers.count > 0) {
  console.log('📦 Banco já possui dados. Executando atualizações e inserções incrementais de usuários...');
  
  const updates = [
    { email: 'admin@admin.com',   newPassword: 'admin1' },
    { email: 'ademir@kairos.com', newPassword: 'admin1' },
  ];
  for (const u of updates) {
    const hash = await bcrypt.hash(u.newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, u.email);
    console.log(`  ✓ Senha atualizada: ${u.email}`);
  }

  const newUsers = [
    { email: 'eduardo@kairos.com', password: 'admin1', name: 'Eduardo', role: 'admin' },
  ];
  const insert = db.prepare('INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
  for (const u of newUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    const result = insert.run(u.email, hash, u.name, u.role);
    if (result.changes > 0) {
      console.log(`  ✓ Novo usuário criado: ${u.email}`);
    }
  }
  
  console.log('✅ Atualizações incrementais concluídas!');
  process.exit(0);
}

// ─── USUÁRIOS ────────────────────────────────────────────────────────────────
const users = [
  { email: 'admin@admin.com',      password: 'admin1',    name: 'Admin',        role: 'admin'    },
  { email: 'ademir@kairos.com',    password: 'admin1',    name: 'Ademir',       role: 'operator' },
  { email: 'operador@kairos.com',  password: 'kairos123', name: 'Operador 01',  role: 'operator' },
  { email: 'eduardo@kairos.com',   password: 'admin1',    name: 'Eduardo',      role: 'admin'    },
];

const insertUser = db.prepare(
  'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
);

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 10);
  insertUser.run(u.email, hash, u.name, u.role);
  console.log(`  ✓ Usuário: ${u.email}`);
}

// ─── MÁQUINAS ────────────────────────────────────────────────────────────────
const machines = [
  { name: 'Forno Industrial 01', sector: 'Produção',   model: 'FT-3000', code: 'MCH-001', factory: 'Matriz', maintenance: '2025-08-15' },
  { name: 'Prensa Hidráulica 02', sector: 'Prensagem',  model: 'PH-1500', code: 'MCH-002', factory: 'Matriz', maintenance: '2025-06-10' },
  { name: 'Esteira Transportadora', sector: 'Logística', model: 'ET-800',  code: 'MCH-003', factory: 'Filial 1', maintenance: '2025-07-20' },
  { name: 'Compressor 04',         sector: 'Utilidades', model: 'CP-2000', code: 'MCH-004', factory: 'Matriz', maintenance: '2025-09-01' },
  { name: 'Caldeira 01',           sector: 'Utilidades', model: 'CL-500',  code: 'MCH-005', factory: 'Matriz', maintenance: '2025-05-10' },
];

const insertMachine = db.prepare(
  'INSERT INTO machines (name, sector, model, code, factory, next_preventive_maintenance) VALUES (?, ?, ?, ?, ?, ?)'
);

for (const m of machines) {
  insertMachine.run(m.name, m.sector, m.model, m.code, m.factory, m.maintenance);
  console.log(`  ✓ Máquina: ${m.name}`);
}

// ─── ORDENS DE SERVIÇO ──────────────────────────────────────────────────────
const workOrders = [
  { title: 'Troca do Termopar',           description: 'Substituir termopar do Forno Industrial 01 — leitura instável.',        status: 'IN_PROGRESS', priority: 'HIGH',    service_type: 'ELECTRICAL', machine: 1 },
  { title: 'Lubrificação Geral',          description: 'Lubrificar mancais e rolamentos da Prensa Hidráulica.',                 status: 'PENDING',     priority: 'MEDIUM',  service_type: 'MECHANICAL', machine: 2 },
  { title: 'Alinhamento Correia',         description: 'Ajustar tensionamento e alinhamento da correia transportadora.',         status: 'COMPLETED',   priority: 'NORMAL',  service_type: 'MECHANICAL', machine: 3 },
  { title: 'Vazamento de Óleo',           description: 'Reparar vazamento no sistema hidráulico do Compressor 04.',             status: 'PENDING',     priority: 'URGENT',  service_type: 'MECHANICAL', machine: 4 },
  { title: 'Manutenção Anual Caldeira',   description: 'Inspeção completa e limpeza dos queimadores da Caldeira 01.',           status: 'PAUSED',      priority: 'CRITICAL', service_type: 'GENERAL',    machine: 5 },
  { title: 'Substituição Sensor Pressão', description: 'Trocar sensor de pressão — leitura divergente nos painéis.',             status: 'COMPLETED',   priority: 'HIGH',    service_type: 'ELECTRICAL', machine: 1 },
  { title: 'Balanceamento Rotor',         description: 'Balanceamento dinâmico do rotor do motor principal.',                     status: 'IN_PROGRESS', priority: 'MEDIUM',  service_type: 'MECHANICAL', machine: 2 },
  { title: 'Inspeção Elétrica',           description: 'Inspeção geral do quadro elétrico e painéis de comando.',                status: 'PENDING',     priority: 'NORMAL',  service_type: 'ELECTRICAL', machine: 5 },
  { title: 'Troca Filtros Ar',            description: 'Substituir filtros de ar comprimido — sistema pneumático.',               status: 'COMPLETED',   priority: 'LOW',     service_type: 'GENERAL',    machine: 4 },
  { title: 'Ajuste de Válvulas',          description: 'Regular válvulas de controle do circuito hidráulico.',                   status: 'IN_PROGRESS', priority: 'MEDIUM',  service_type: 'MECHANICAL', machine: 3 },
];

const insertOrder = db.prepare(
  'INSERT INTO work_orders (title, description, status, priority, service_type, machine_id) VALUES (?, ?, ?, ?, ?, ?)'
);

for (const wo of workOrders) {
  insertOrder.run(wo.title, wo.description, wo.status, wo.priority, wo.service_type, wo.machine);
  console.log(`  ✓ OS: ${wo.title}`);
}

console.log('\n✅ Seed concluído com sucesso!');
console.log(`   • ${users.length} usuários`);
console.log(`   • ${machines.length} máquinas`);
console.log(`   • ${workOrders.length} ordens de serviço`);
console.log('\n📧 Credenciais:');
console.log('   admin@admin.com / admin1');
console.log('   ademir@kairos.com / admin1');
console.log('   eduardo@kairos.com / admin1');
console.log('   operador@kairos.com / kairos123');

process.exit(0);
