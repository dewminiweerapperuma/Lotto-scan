const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

const formatDrawRow = (row) => {
  if (!row) return null;
  let prizeDist = {};
  try {
    prizeDist = typeof row.prize_distribution === 'string' 
      ? JSON.parse(row.prize_distribution) 
      : (row.prize_distribution || {});
  } catch (e) {
    prizeDist = {};
  }

  return {
    id: row.id,
    _id: row.id,
    drawDate: row.draw_date ? new Date(row.draw_date) : null,
    drawName: row.draw_name,
    drawNumber: row.draw_number,
    prizeDistribution: prizeDist,
    uploadedAt: row.uploaded_at ? new Date(row.uploaded_at) : null,
    uploadedBy: row.uploaded_by,
    status: row.status
  };
};

class Draw {
  static async findOne(criteria = {}) {
    let sql = 'SELECT id, draw_date, draw_name, draw_number, prize_distribution, uploaded_at, uploaded_by, status FROM draws';
    const params = [];
    const conditions = [];

    if (criteria.drawNumber) {
      params.push(criteria.drawNumber);
      conditions.push(`draw_number = $${params.length}`);
    }

    if (criteria.status) {
      params.push(criteria.status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY draw_date DESC LIMIT 1';

    const res = await db.query(sql, params);
    if (res.rows.length === 0) return null;
    return formatDrawRow(res.rows[0]);
  }

  static async find(criteria = {}) {
    let sql = 'SELECT id, draw_date, draw_name, draw_number, prize_distribution, uploaded_at, uploaded_by, status FROM draws';
    const params = [];
    const conditions = [];

    if (criteria.status) {
      params.push(criteria.status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY draw_date DESC';

    const res = await db.query(sql, params);
    return res.rows.map(formatDrawRow);
  }

  static async create({ drawDate, drawName, drawNumber, prizeDistribution, uploadedBy, status = 'active' }) {
    const id = uuidv4();
    const drawDateIso = new Date(drawDate).toISOString();
    const uploadedAt = new Date().toISOString();
    const prizeDistJson = JSON.stringify(prizeDistribution || {});

    await db.query(
      `INSERT INTO draws (id, draw_date, draw_name, draw_number, prize_distribution, uploaded_at, uploaded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, drawDateIso, drawName, drawNumber, prizeDistJson, uploadedAt, uploadedBy || null, status]
    );

    return {
      id,
      _id: id,
      drawDate: new Date(drawDateIso),
      drawName,
      drawNumber,
      prizeDistribution,
      uploadedAt: new Date(uploadedAt),
      uploadedBy,
      status
    };
  }
}

module.exports = Draw;
