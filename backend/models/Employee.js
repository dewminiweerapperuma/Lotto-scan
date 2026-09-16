const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

class Employee {
  static async create({ agentId, name, email = '', phone = '', counterName = 'Main Counter', commissionRate = 2.5, status = 'active' }) {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const parsedCommission = parseFloat(commissionRate) || 2.5;

    await db.query(
      `INSERT INTO employees (id, agent_id, name, email, phone, counter_name, commission_rate, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, agentId || 'default-agent', name.trim(), email.trim(), phone.trim(), counterName.trim(), parsedCommission, status, createdAt]
    );

    return {
      id,
      agentId: agentId || 'default-agent',
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      counterName: counterName.trim(),
      commissionRate: parsedCommission,
      status,
      createdAt
    };
  }

  static async listByAgent(agentId) {
    let q = 'SELECT id, agent_id, name, email, phone, counter_name, commission_rate, status, created_at FROM employees';
    let params = [];
    if (agentId && agentId !== 'all') {
      q += ' WHERE agent_id = $1';
      params.push(agentId);
    }
    q += ' ORDER BY created_at ASC';

    const res = await db.query(q, params);
    return res.rows.map(r => ({
      id: r.id,
      agentId: r.agent_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      counterName: r.counter_name,
      commissionRate: parseFloat(r.commission_rate) || 2.5,
      status: r.status,
      createdAt: r.created_at
    }));
  }

  static async seedSampleEmployees(agentId = 'default-agent') {
    try {
      const existing = await this.listByAgent(agentId);
      if (existing.length < 5) {
        const sampleEmployees = [
          { name: 'Wijethunga', counterName: 'Counter 01 - Pettah', commissionRate: 2.5 },
          { name: 'Rekshman', counterName: 'Counter 02 - Fort', commissionRate: 2.5 },
          { name: 'Lalith', counterName: 'Counter 03 - Maradana', commissionRate: 2.0 },
          { name: 'Ranjith', counterName: 'Route Seller A', commissionRate: 2.5 },
          { name: 'Noel', counterName: 'Route Seller B', commissionRate: 2.0 },
          { name: 'Nimal', counterName: 'Counter 04 - Borella', commissionRate: 2.5 },
          { name: 'Padmini', counterName: 'Counter 05 - Kotte', commissionRate: 2.5 },
          { name: 'Wimalasena', counterName: 'Route Seller C', commissionRate: 2.5 },
          { name: 'Lakshman', counterName: 'Counter 06 - Nugegoda', commissionRate: 2.0 },
          { name: 'Ajith', counterName: 'Route Seller D', commissionRate: 2.5 },
          { name: 'Priyantha', counterName: 'Route Seller E', commissionRate: 2.5 },
          { name: 'Samarapala', counterName: 'Counter 07 - Maharagama', commissionRate: 2.0 },
          { name: 'Guruge', counterName: 'Route Seller F', commissionRate: 2.5 },
          { name: 'Jagath', counterName: 'Route Seller G', commissionRate: 2.5 },
          { name: 'Prasanna', counterName: 'Counter 08 - Dehiwala', commissionRate: 2.0 },
          { name: 'Ranjani', counterName: 'Counter 09 - Mount Lavinia', commissionRate: 2.5 },
          { name: 'Premarathna', counterName: 'Route Seller H', commissionRate: 2.5 },
          { name: 'Chandrasena', counterName: 'Route Seller I', commissionRate: 2.0 },
          { name: 'Jayathissa', counterName: 'Counter 10 - Moratuwa', commissionRate: 2.5 },
          { name: 'Wasantha', counterName: 'Route Seller J', commissionRate: 2.5 },
          { name: 'Chandana', counterName: 'Route Seller K', commissionRate: 2.0 },
        ];

        for (const emp of sampleEmployees) {
          await this.create({
            agentId,
            name: emp.name,
            counterName: emp.counterName,
            commissionRate: emp.commissionRate
          });
        }
        console.log(`[Employee] Seeded ${sampleEmployees.length} initial sample employees with commission rates.`);
      }
    } catch (err) {
      console.warn('[Employee] Seed notice:', err.message);
    }
  }
}

module.exports = Employee;
