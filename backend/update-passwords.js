import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const db = getDb();

const updates = [
  { email: 'admin@admin.com',     newPassword: 'admin1' },
  { email: 'ademir@kairos.com',   newPassword: 'admin1' },
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

console.log('\n✅ Senhas atualizadas com sucesso!');
console.log('   admin@admin.com / admin1');
console.log('   ademir@kairos.com / admin1');
