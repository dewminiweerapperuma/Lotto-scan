const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

class Agent {
  static async create({
    userId,
    agencyName,
    agentCode,
    email,
    phone = '',
    boardAffiliation = 'BOTH',
    location = 'Colombo',
    status = 'active'
  }) {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const code = (agentCode || `AGN-${Date.now().toString().slice(-4)}`).toUpperCase().trim();

    await db.query(
      `INSERT INTO agents (id, user_id, agency_name, agent_code, email, phone, board_affiliation, location, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        userId,
        agencyName.trim(),
        code,
        email.toLowerCase().trim(),
        phone.trim(),
        boardAffiliation.toUpperCase().trim(),
        location.trim(),
        status,
        createdAt
      ]
    );

    return {
      id,
      userId,
      agencyName: agencyName.trim(),
      agentCode: code,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      boardAffiliation: boardAffiliation.toUpperCase().trim(),
      location: location.trim(),
      status,
      createdAt
    };
  }

  static async findByUserId(userId) {
    if (!userId) return null;
    const res = await db.query('SELECT * FROM agents WHERE user_id = $1 LIMIT 1', [userId]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      agencyName: r.agency_name,
      agentCode: r.agent_code,
      email: r.email,
      phone: r.phone,
      boardAffiliation: r.board_affiliation,
      location: r.location,
      status: r.status,
      createdAt: r.created_at
    };
  }

  static async findByAgentCode(agentCode) {
    if (!agentCode) return null;
    const res = await db.query(
      'SELECT * FROM agents WHERE upper(agent_code) = upper($1) LIMIT 1',
      [agentCode.trim()]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      agencyName: r.agency_name,
      agentCode: r.agent_code,
      email: r.email,
      phone: r.phone,
      boardAffiliation: r.board_affiliation,
      location: r.location,
      status: r.status,
      createdAt: r.created_at
    };
  }

  static async findByEmail(email) {
    if (!email) return null;
    const res = await db.query(
      'SELECT * FROM agents WHERE lower(email) = lower($1) LIMIT 1',
      [email.trim()]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      agencyName: r.agency_name,
      agentCode: r.agent_code,
      email: r.email,
      phone: r.phone,
      boardAffiliation: r.board_affiliation,
      location: r.location,
      status: r.status,
      createdAt: r.created_at
    };
  }

  static async updateStatus(id, status) {
    if (!id || !status) return null;
    const cleanStatus = status.toLowerCase().trim();
    await db.query(
      `UPDATE agents SET status = $1 WHERE id = $2 OR user_id = $2`,
      [cleanStatus, id]
    );

    // Also update associated user role/status if relevant
    const agent = await db.query('SELECT * FROM agents WHERE id = $1 OR user_id = $1 LIMIT 1', [id]);
    if (agent.rows.length === 0) return null;
    const r = agent.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      agencyName: r.agency_name,
      agentCode: r.agent_code,
      email: r.email,
      phone: r.phone,
      boardAffiliation: r.board_affiliation,
      location: r.location,
      status: r.status,
      createdAt: r.created_at
    };
  }

  static async getAllWithMetrics() {
    const agentsRes = await db.query('SELECT * FROM agents ORDER BY created_at DESC');
    const empRes = await db.query('SELECT id, agent_id, status FROM employees WHERE status != \'deleted\'');
    
    // Group active sellers per agent
    const empCountMap = new Map();
    empRes.rows.forEach(emp => {
      const aid = emp.agent_id;
      empCountMap.set(aid, (empCountMap.get(aid) || 0) + 1);
    });

    return agentsRes.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      agencyName: r.agency_name,
      agentCode: r.agent_code,
      email: r.email,
      phone: r.phone,
      boardAffiliation: r.board_affiliation,
      location: r.location,
      status: r.status,
      createdAt: r.created_at,
      activeSellersCount: empCountMap.get(r.id) || empCountMap.get(r.user_id) || empCountMap.get('default-agent') || 0
    }));
  }

  static async getAll() {
    const res = await db.query('SELECT * FROM agents ORDER BY created_at DESC');
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      agencyName: r.agency_name,
      agentCode: r.agent_code,
      email: r.email,
      phone: r.phone,
      boardAffiliation: r.board_affiliation,
      location: r.location,
      status: r.status,
      createdAt: r.created_at
    }));
  }

  /**
   * Seed a verified demo agent account if none exists.
   */
  static async seedDefaultAgent(User) {
    try {
      const demoEmail = 'agent@agency.lk';
      const demoCode = 'AGN-001';

      let user = await User.findByEmail(demoEmail);
      if (!user) {
        console.log('[Agent Seed] Creating demo agent user credentials...');
        user = await User.create({
          email: demoEmail,
          password: 'Agent123!',
          role: 'agent'
        });
      }

      let agent = await Agent.findByUserId(user.id);
      if (!agent) {
        console.log('[Agent Seed] Creating demo agency profile in QuestDB...');
        agent = await Agent.create({
          userId: user.id,
          agencyName: 'Lanka Mega Lottery Agency (Pettah Central)',
          agentCode: demoCode,
          email: demoEmail,
          phone: '+94 77 123 4567',
          boardAffiliation: 'BOTH',
          location: 'Pettah Main Bus Stand, Colombo 11'
        });
      }
      return agent;
    } catch (err) {
      console.warn('[Agent Seed Notice]:', err.message);
      return null;
    }
  }
}

module.exports = Agent;
