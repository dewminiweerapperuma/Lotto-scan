const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');
const Claim = require('./Claim');
const Employee = require('./Employee');

const CACHE_FILE = path.join(__dirname, '..', 'data', 'scan_sessions.json');

// Standard Sri Lankan lottery agent payout tiers (from physical voucher)
const STANDARD_TIERS = [40, 80, 120, 160, 200, 240, 400, 500, 1000, 2000, 4000];

// In-memory sessions store initialized from disk
let inMemorySessions = [];

try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemorySessions = parsed;
    }
  }
} catch (err) {
  console.warn('[ScanSession] Could not read sessions cache:', err.message);
}

function persistCacheToDisk() {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(inMemorySessions, null, 2), 'utf8');
  } catch (err) {
    console.warn('[ScanSession] Could not persist sessions cache:', err.message);
  }
}

class ScanSession {
  static getStandardTiers() {
    return STANDARD_TIERS;
  }

  /**
   * Calculate live tier counts & totals from a list of tickets
   */
  static computeTierBreakdown(tickets = []) {
    const countMap = {};
    STANDARD_TIERS.forEach(t => {
      countMap[t] = 0;
    });

    let extraTiers = {};
    let totalWinningAmount = 0;
    let winningTicketsCount = 0;
    let nonWinningTicketsCount = 0;

    tickets.forEach(ticket => {
      const prize = parseFloat(ticket.prizeAmount) || 0;
      const isWin = !!(ticket.isWinner && !ticket.isExpired && prize > 0);

      if (isWin) {
        winningTicketsCount += 1;
        totalWinningAmount += prize;

        if (STANDARD_TIERS.includes(prize)) {
          countMap[prize] = (countMap[prize] || 0) + 1;
        } else {
          extraTiers[prize] = (extraTiers[prize] || 0) + 1;
        }
      } else {
        nonWinningTicketsCount += 1;
      }
    });

    // Form array for standard tiers
    const tiers = STANDARD_TIERS.map(prize => ({
      prize,
      count: countMap[prize] || 0,
      subtotal: (countMap[prize] || 0) * prize
    }));

    // Form extra tiers (sorted)
    const extras = Object.keys(extraTiers)
      .map(k => parseFloat(k))
      .sort((a, b) => a - b)
      .map(prize => ({
        prize,
        count: extraTiers[prize] || 0,
        subtotal: (extraTiers[prize] || 0) * prize
      }));

    return {
      tiers,
      extras,
      allTiers: [...tiers, ...extras],
      winningTicketsCount,
      nonWinningTicketsCount,
      totalTicketsCount: tickets.length,
      totalWinningAmount
    };
  }

  /**
   * Create and record a completed or active scan session
   */
  static async createSession({
    agentId = 'default-agent',
    employeeId,
    employeeName,
    counterName = 'Main Counter',
    startedAt = new Date().toISOString(),
    endedAt = null,
    status = 'completed',
    tickets = [],
    returnShortageAmount = 0,
    notes = '',
    recordClaims = true
  }) {
    if (!employeeName || !employeeName.trim()) {
      throw new Error('Employee name is required to start/save a scanning session.');
    }

    // Auto find or create employee profile if employeeId was not provided
    let emp = null;
    if (employeeId) {
      emp = await Employee.findById(employeeId);
    }
    if (!emp) {
      emp = await Employee.findOrCreateByName(employeeName.trim(), counterName, agentId);
    }

    const resolvedEmployeeId = emp ? emp.id : (employeeId || uuidv4());
    const resolvedEmployeeName = emp ? emp.name : employeeName.trim();
    const resolvedCounterName = emp ? emp.counterName : counterName;

    const id = uuidv4();
    const sessionNumber = `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const breakdown = this.computeTierBreakdown(tickets);
    const returnShortage = parseFloat(returnShortageAmount) || 0;
    const netTotal = Math.max(0, breakdown.totalWinningAmount - returnShortage);

    const sessionObj = {
      id,
      sessionNumber,
      agentId,
      employeeId: resolvedEmployeeId,
      employeeName: resolvedEmployeeName,
      counterName: resolvedCounterName,
      startedAt: startedAt || createdAt,
      endedAt: endedAt || (status === 'completed' ? new Date().toISOString() : null),
      status,
      totalTickets: tickets.length,
      winningTickets: breakdown.winningTicketsCount,
      nonWinningTickets: breakdown.nonWinningTicketsCount,
      totalWinningAmount: breakdown.totalWinningAmount,
      returnShortageAmount: returnShortage,
      netTotalAmount: netTotal,
      prizeBreakdown: breakdown,
      tickets,
      notes: notes || '',
      createdAt
    };

    // Save to QuestDB
    try {
      await db.query(
        `INSERT INTO scan_sessions 
         (id, session_number, agent_id, employee_id, employee_name, counter_name, started_at, ended_at, status, total_tickets, winning_tickets, non_winning_tickets, total_winning_amount, return_shortage_amount, net_total_amount, prize_breakdown, tickets_data, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          id,
          sessionNumber,
          agentId,
          resolvedEmployeeId,
          resolvedEmployeeName,
          resolvedCounterName,
          sessionObj.startedAt,
          sessionObj.endedAt || sessionObj.startedAt,
          status,
          sessionObj.totalTickets,
          sessionObj.winningTickets,
          sessionObj.nonWinningTickets,
          sessionObj.totalWinningAmount,
          sessionObj.returnShortageAmount,
          sessionObj.netTotalAmount,
          JSON.stringify(breakdown),
          JSON.stringify(tickets),
          notes,
          createdAt
        ]
      );
    } catch (dbErr) {
      console.warn('[ScanSession] QuestDB insert notice (using memory/file cache):', dbErr.message);
    }

    // Persist to in-memory + file cache
    inMemorySessions.unshift(sessionObj);
    persistCacheToDisk();

    // If requested, record winning claims automatically in winning_claims table
    if (recordClaims && status === 'completed') {
      for (const t of tickets) {
        const prize = parseFloat(t.prizeAmount) || 0;
        if (t.isWinner && !t.isExpired && prize > 0) {
          try {
            await Claim.createClaim({
              agentId,
              employeeId: resolvedEmployeeId,
              employeeName: `${resolvedEmployeeName} (${resolvedCounterName})`,
              lotteryName: t.cleanLotteryName || t.lotteryName,
              board: t.board || 'NLB',
              drawNumber: t.drawNumber || '',
              drawDate: t.drawDate || new Date().toISOString().slice(0, 10),
              ticketSerial: t.serial,
              matchedTier: t.prizeCategory || `${prize} LKR Match`,
              prizeAmount: prize,
              payoutStatus: 'paid'
            });
          } catch (cErr) {
            console.warn('[ScanSession] Auto-claim notice for ticket', t.serial, cErr.message);
          }
        }
      }
    }

    return sessionObj;
  }

  /**
   * Update an existing session
   */
  static async updateSession(id, data = {}) {
    const session = inMemorySessions.find(s => s.id === id);
    if (!session) {
      throw new Error(`Session ${id} not found.`);
    }

    if (data.tickets) {
      session.tickets = data.tickets;
      const breakdown = this.computeTierBreakdown(data.tickets);
      session.totalTickets = data.tickets.length;
      session.winningTickets = breakdown.winningTicketsCount;
      session.nonWinningTickets = breakdown.nonWinningTicketsCount;
      session.totalWinningAmount = breakdown.totalWinningAmount;
      session.prizeBreakdown = breakdown;
    }

    if (data.returnShortageAmount !== undefined) {
      session.returnShortageAmount = parseFloat(data.returnShortageAmount) || 0;
    }

    session.netTotalAmount = Math.max(0, session.totalWinningAmount - session.returnShortageAmount);

    if (data.status) session.status = data.status;
    if (data.endedAt) session.endedAt = data.endedAt;
    if (data.notes !== undefined) session.notes = data.notes;

    persistCacheToDisk();

    try {
      await db.query(
        `UPDATE scan_sessions 
         SET status = $1, ended_at = $2, total_tickets = $3, winning_tickets = $4, non_winning_tickets = $5, total_winning_amount = $6, return_shortage_amount = $7, net_total_amount = $8, prize_breakdown = $9, tickets_data = $10, notes = $11
         WHERE id = $12`,
        [
          session.status,
          session.endedAt || session.startedAt,
          session.totalTickets,
          session.winningTickets,
          session.nonWinningTickets,
          session.totalWinningAmount,
          session.returnShortageAmount,
          session.netTotalAmount,
          JSON.stringify(session.prizeBreakdown),
          JSON.stringify(session.tickets),
          session.notes,
          id
        ]
      );
    } catch (e) {
      console.warn('[ScanSession] QuestDB update notice:', e.message);
    }

    return session;
  }

  /**
   * List sessions with optional filters
   */
  static async getSessions({ employeeId, date, agentId, status } = {}) {
    let list = [...inMemorySessions];

    if (agentId && agentId !== 'all') {
      list = list.filter(s => s.agentId === agentId);
    }

    if (employeeId && employeeId !== 'all') {
      list = list.filter(s => s.employeeId === employeeId || (s.employeeName && s.employeeName.toLowerCase() === employeeId.toLowerCase()));
    }

    if (date) {
      list = list.filter(s => {
        const sDate = (s.startedAt || '').slice(0, 10);
        return sDate === date;
      });
    }

    if (status) {
      list = list.filter(s => s.status === status);
    }

    return list.sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
  }

  /**
   * Get single session by ID
   */
  static async getById(id) {
    const found = inMemorySessions.find(s => s.id === id);
    if (found) return found;

    try {
      const res = await db.query('SELECT * FROM scan_sessions WHERE id = $1 LIMIT 1', [id]);
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        let prizeBreakdown = {};
        let tickets = [];
        try { prizeBreakdown = JSON.parse(r.prize_breakdown || '{}'); } catch(e){}
        try { tickets = JSON.parse(r.tickets_data || '[]'); } catch(e){}

        return {
          id: r.id,
          sessionNumber: r.session_number,
          agentId: r.agent_id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          counterName: r.counter_name,
          startedAt: r.started_at,
          endedAt: r.ended_at,
          status: r.status,
          totalTickets: parseInt(r.total_tickets, 10) || 0,
          winningTickets: parseInt(r.winning_tickets, 10) || 0,
          nonWinningTickets: parseInt(r.non_winning_tickets, 10) || 0,
          totalWinningAmount: parseFloat(r.total_winning_amount) || 0,
          returnShortageAmount: parseFloat(r.return_shortage_amount) || 0,
          netTotalAmount: parseFloat(r.net_total_amount) || 0,
          prizeBreakdown,
          tickets,
          notes: r.notes || '',
          createdAt: r.created_at
        };
      }
    } catch (e) {
      console.warn('[ScanSession] QuestDB getById notice:', e.message);
    }

    return null;
  }

  /**
   * Get complete Employee Profile including all sessions, statistics, and winning claims
   */
  static async getEmployeeProfile(employeeId, agentId = 'default-agent') {
    let employee = await Employee.findById(employeeId);
    if (!employee) {
      // Try searching in employee list by name or fallback
      const emps = await Employee.listByAgent(agentId);
      employee = emps.find(e => e.id === employeeId || e.name.toLowerCase() === employeeId.toLowerCase());
    }

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found.`);
    }

    // Get all sessions conducted by this employee
    const sessions = await this.getSessions({ employeeId: employee.id, agentId });

    // Get all claims credited to this employee
    const allClaims = await Claim.getClaimsByDate(null, agentId);
    const employeeClaims = allClaims.filter(c => 
      c.employeeId === employee.id || 
      (c.employeeName && c.employeeName.toLowerCase().includes(employee.name.toLowerCase()))
    );

    // Cumulative stats
    const totalSessions = sessions.length;
    const totalTicketsScanned = sessions.reduce((sum, s) => sum + (s.totalTickets || 0), 0);
    const totalWinningTickets = sessions.reduce((sum, s) => sum + (s.winningTickets || 0), 0);
    const totalWinningAmount = sessions.reduce((sum, s) => sum + (s.totalWinningAmount || 0), 0);
    const totalReturnShortage = sessions.reduce((sum, s) => sum + (s.returnShortageAmount || 0), 0);
    const totalNetPayout = sessions.reduce((sum, s) => sum + (s.netTotalAmount || 0), 0);
    
    // Commission rate on sales/handling
    const commissionRate = employee.commissionRate || 2.5;
    const estimatedCommission = (totalWinningAmount * (commissionRate / 100));

    // Tier distribution aggregation across all sessions
    const aggregatedTiers = {};
    STANDARD_TIERS.forEach(t => { aggregatedTiers[t] = 0; });
    let extraTierAgg = {};

    sessions.forEach(s => {
      const breakdown = s.prizeBreakdown || {};
      if (Array.isArray(breakdown.tiers)) {
        breakdown.tiers.forEach(item => {
          if (aggregatedTiers[item.prize] !== undefined) {
            aggregatedTiers[item.prize] += (item.count || 0);
          }
        });
      }
      if (Array.isArray(breakdown.extras)) {
        breakdown.extras.forEach(item => {
          extraTierAgg[item.prize] = (extraTierAgg[item.prize] || 0) + (item.count || 0);
        });
      }
    });

    const standardTierList = STANDARD_TIERS.map(prize => ({
      prize,
      count: aggregatedTiers[prize] || 0,
      subtotal: (aggregatedTiers[prize] || 0) * prize
    }));

    const extraTierList = Object.keys(extraTierAgg)
      .map(k => parseFloat(k))
      .sort((a, b) => a - b)
      .map(prize => ({
        prize,
        count: extraTierAgg[prize] || 0,
        subtotal: (extraTierAgg[prize] || 0) * prize
      }));

    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySessions = sessions.filter(s => (s.startedAt || '').slice(0, 10) === todayStr);

    return {
      employee: {
        id: employee.id,
        name: employee.name,
        counterName: employee.counterName,
        phone: employee.phone,
        email: employee.email,
        commissionRate: employee.commissionRate,
        status: employee.status,
        createdAt: employee.createdAt
      },
      stats: {
        totalSessions,
        totalTicketsScanned,
        totalWinningTickets,
        totalWinningAmount,
        totalReturnShortage,
        totalNetPayout,
        commissionRate,
        estimatedCommission,
        today: {
          sessionsCount: todaySessions.length,
          ticketsScanned: todaySessions.reduce((sum, s) => sum + (s.totalTickets || 0), 0),
          winningTickets: todaySessions.reduce((sum, s) => sum + (s.winningTickets || 0), 0),
          winningAmount: todaySessions.reduce((sum, s) => sum + (s.totalWinningAmount || 0), 0),
          netPayout: todaySessions.reduce((sum, s) => sum + (s.netTotalAmount || 0), 0)
        }
      },
      tierSummary: [...standardTierList, ...extraTierList],
      recentSessions: sessions,
      claims: employeeClaims
    };
  }
}

module.exports = ScanSession;
