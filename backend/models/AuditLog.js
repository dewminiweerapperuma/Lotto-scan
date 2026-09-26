const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

class AuditLog {
  static async log({
    actorId = 'system',
    actorRole = 'SUPER_ADMIN',
    actionType,
    details = {},
    ipAddress = '127.0.0.1'
  }) {
    try {
      const id = uuidv4();
      const timestamp = new Date().toISOString();
      const serializedDetails = typeof details === 'string' ? details : JSON.stringify(details);

      await db.query(
        `INSERT INTO audit_logs (id, actor_id, actor_role, action_type, details, ip_address, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, String(actorId), String(actorRole), String(actionType), serializedDetails, String(ipAddress), timestamp]
      );

      return {
        id,
        actorId,
        actorRole,
        actionType,
        details: serializedDetails,
        ipAddress,
        timestamp
      };
    } catch (err) {
      console.warn('[AuditLog] Failed to record audit log:', err.message);
      return null;
    }
  }

  static async getRecent(limit = 100) {
    try {
      const res = await db.query(
        'SELECT id, actor_id, actor_role, action_type, details, ip_address, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT $1',
        [parseInt(limit, 10) || 100]
      );
      return (res.rows || []).map(r => {
        let parsedDetails = r.details;
        try {
          parsedDetails = JSON.parse(r.details);
        } catch {}
        return {
          id: r.id,
          actorId: r.actor_id,
          actorRole: r.actor_role,
          actionType: r.action_type,
          details: parsedDetails,
          ipAddress: r.ip_address,
          timestamp: r.timestamp
        };
      });
    } catch (err) {
      console.warn('[AuditLog] Query error:', err.message);
      return [];
    }
  }
}

module.exports = AuditLog;
