const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

class User {
  static async findByEmail(email) {
    if (!email) return null;
    const res = await db.query(
      'SELECT id, email, password, role, created_at FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email.trim()]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      _id: row.id, // compatibility fallback
      email: row.email,
      password: row.password,
      role: row.role,
      createdAt: row.created_at
    };
  }

  static async findById(id) {
    if (!id) return null;
    const res = await db.query(
      'SELECT id, email, password, role, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      _id: row.id,
      email: row.email,
      password: row.password,
      role: row.role,
      createdAt: row.created_at
    };
  }

  static async create({ email, password, role = 'user' }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await db.query(
      'INSERT INTO users (id, email, password, role, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, email.trim().toLowerCase(), hashedPassword, role, createdAt]
    );

    return {
      id,
      _id: id,
      email: email.trim().toLowerCase(),
      role,
      createdAt
    };
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User;
