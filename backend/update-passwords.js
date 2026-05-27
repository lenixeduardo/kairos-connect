import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const db = getDb();

// Atualiza senhas de usuários existentes
const updates = [
  { email: 'admin@admin.com',   newPassword: 'admin1' },
  { email: 'ademir@kairos.com', newPassword: 'admin1' },
];

for (const u of updates) {
  const hash = await bcrypt.hash(u.newPassword, 10);
  const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, u.email);
  if (result.changes > 0) {
    console.log(`  ✓ Senha atualizada: ${u.email}`);
  } else {
    console.log(`  ⚠ Usuário não encontrado: ${u.email}`);
  }
}

// Insere novos usuários (ignora se já existir)
const newUsers = [
  { email: 'eduardo@kairos.com', password: 'admin1', name: 'Eduardo', role: 'admin' },
];

const insert = db.prepare('INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');

for (const u of newUsers) {
  const hash = await bcrypt.hash(u.password, 10);
  const result = insert.run(u.email, hash, u.name, u.role);
  if (result.changes > 0) {
    console.log(`  ✓ Usuário criado: ${u.email}`);
  } else {
    console.log(`  ⚠ Usuário já existe: ${u.email}`);
  }
}

console.log('\n✅ Concluído!');
console.log('   admin@admin.com / admin1');
console.log('   ademir@kairos.com / admin1');
console.log('   eduardo@kairos.com / admin1');
