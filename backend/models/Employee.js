const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

class Employee {
  static async create({ agentId, name, email = '', phone = '', counterName = 'Main Counter', status = 'active' }) {
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await db.query(
      `INSERT INTO employees (id, agent_id, name, email, phone, counter_name, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, agentId || 'default-agent', name.trim(), email.trim(), phone.trim(), counterName.trim(), status, createdAt]
    );

    return {
      id,
      agentId: agentId || 'default-agent',
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      counterName: counterName.trim(),
      status,
      createdAt
    };
  }

  static async listByAgent(agentId) {
    let q = 'SELECT id, agent_id, name, email, phone, counter_name, status, created_at FROM employees';
    let params = [];
    if (agentId && agentId !== 'all') {
      q += ' WHERE agent_id = $1';
      params.push(agentId);
    }
    q += ' ORDER BY created_at DESC';

    const res = await db.query(q, params);
    return res.rows.map(r => ({
      id: r.id,
      agentId: r.agent_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      counterName: r.counter_name,
      status: r.status,
      createdAt: r.created_at
    }));
  }

  static async seedSampleEmployees(agentId = 'default-agent') {
    try {
      const existing = await this.listByAgent(agentId);
      if (existing.length === 0) {
        await this.create({
          agentId,
          name: 'Kasun Bandara',
          email: 'kasun@agency.lk',
          phone: '077-1234567',
          counterName: 'Counter 01 - Pettah Central'
        });
        await this.create({
          agentId,
          name: 'Nimali Jayasinghe',
          email: 'nimali@agency.lk',
          phone: '071-9876543',
          counterName: 'Counter 02 - Fort Station'
        });
        await this.create({
          agentId,
          name: 'Sanjeewa Perera',
          email: 'sanjeewa@agency.lk',
          phone: '076-5554321',
          counterName: 'Mobile Unit A - Maradana'
        });
        console.log('[Employee] Seeded initial sample counter employees.');
      }
    } catch (err) {
      console.warn('[Employee] Seed notice:', err.message);
    }
  }
}

module.exports = Employee;
