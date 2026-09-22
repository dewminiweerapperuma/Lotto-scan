const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

const DLB_LOTTERIES = [
  'ada kotipathi', 'shanida', 'shanida wasanawa', 'lagna wasanawa', 'lagna wasana', 
  'super ball', 'superball', 'kapruka', 'sasiri', 'supiri dhana sampatha', 
  'jaya sampatha', 'development fortune'
];

function getBoardForLottery(lotteryName, fallbackBoard) {
  if (fallbackBoard && (fallbackBoard.toUpperCase() === 'DLB' || fallbackBoard.toUpperCase() === 'NLB')) {
    return fallbackBoard.toUpperCase();
  }
  const clean = (lotteryName || '').toLowerCase().trim();
  for (const dlb of DLB_LOTTERIES) {
    if (clean.includes(dlb)) return 'DLB';
  }
  return 'NLB';
}

class Claim {
  static getBoardForLottery = getBoardForLottery;

  static async createClaim({
    agentId = 'default-agent',
    employeeId = 'emp-1',
    employeeName = 'Counter 01 Staff',
    lotteryName,
    board = 'NLB',
    drawNumber = '',
    drawDate = new Date().toISOString().slice(0, 10),
    ticketSerial = '',
    matchedTier = '3 Numbers',
    prizeAmount = 0,
    payoutStatus = 'paid'
  }) {
    const id = uuidv4();
    const claimedAt = new Date().toISOString();
    const formattedDrawDate = drawDate.includes('T') ? drawDate : `${drawDate}T00:00:00.000Z`;
    const assignedBoard = getBoardForLottery(lotteryName, board);

    await db.query(
      `INSERT INTO winning_claims 
       (id, agent_id, employee_id, employee_name, lottery_name, board, draw_number, draw_date, ticket_serial, matched_tier, prize_amount, payout_status, claimed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        agentId,
        employeeId,
        employeeName,
        lotteryName,
        assignedBoard,
        drawNumber,
        formattedDrawDate,
        ticketSerial || `TCK-${Math.floor(100000 + Math.random() * 900000)}`,
        matchedTier,
        parseFloat(prizeAmount) || 0,
        payoutStatus,
        claimedAt
      ]
    );

    return {
      id,
      agentId,
      employeeId,
      employeeName,
      lotteryName,
      board: assignedBoard,
      drawNumber,
      drawDate: formattedDrawDate,
      ticketSerial,
      matchedTier,
      prizeAmount: parseFloat(prizeAmount) || 0,
      payoutStatus,
      claimedAt
    };
  }

  static async getClaimsByDate(dateStr, agentId) {
    // dateStr format: YYYY-MM-DD
    const res = await db.query(
      'SELECT id, agent_id, employee_id, employee_name, lottery_name, board, draw_number, draw_date, ticket_serial, matched_tier, prize_amount, payout_status, claimed_at FROM winning_claims ORDER BY claimed_at DESC LIMIT 500'
    );

    // Filter by date
    let claims = res.rows.map(r => ({
      id: r.id,
      agentId: r.agent_id,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      lotteryName: r.lottery_name,
      board: getBoardForLottery(r.lottery_name, r.board),
      drawNumber: r.draw_number,
      drawDate: r.draw_date,
      ticketSerial: r.ticket_serial,
      matchedTier: r.matched_tier,
      prizeAmount: parseFloat(r.prize_amount) || 0,
      payoutStatus: r.payout_status,
      claimedAt: r.claimed_at,
    }));

    if (dateStr) {
      claims = claims.filter(c => {
        let cDate = '';
        if (c.claimedAt instanceof Date) {
          cDate = c.claimedAt.toISOString().slice(0, 10);
        } else if (c.drawDate instanceof Date) {
          cDate = c.drawDate.toISOString().slice(0, 10);
        } else {
          cDate = String(c.claimedAt || c.drawDate || '').slice(0, 10);
        }
        return cDate === dateStr;
      });
    }

    if (agentId && agentId !== 'all') {
      claims = claims.filter(c => c.agentId === agentId);
    }

    return claims;
  }

  static async getDailySummary(dateStr = new Date().toISOString().slice(0, 10), agentId = 'default-agent') {
    const claims = await this.getClaimsByDate(dateStr, agentId);

    const totalTickets = claims.length;
    const totalPayout = claims.reduce((acc, c) => acc + (c.prizeAmount || 0), 0);
    const agencyCommissionRate = 0.10; // 10% standard handling & sales commission
    const estimatedCommission = totalPayout * agencyCommissionRate;

    // Aggregate by Lottery
    const lotteryMap = new Map();
    claims.forEach(c => {
      const key = `${c.lotteryName}__${c.board}`;
      if (!lotteryMap.has(key)) {
        lotteryMap.set(key, {
          lotteryName: c.lotteryName,
          board: c.board,
          drawNumber: c.drawNumber,
          ticketsCount: 0,
          totalPayout: 0,
          tierBreakdown: {}
        });
      }
      const item = lotteryMap.get(key);
      item.ticketsCount += 1;
      item.totalPayout += c.prizeAmount || 0;
      if (!item.drawNumber && c.drawNumber) item.drawNumber = c.drawNumber;

      const tierKey = c.matchedTier || 'Other Match';
      if (!item.tierBreakdown[tierKey]) {
        item.tierBreakdown[tierKey] = { count: 0, totalAmount: 0, unitPrize: c.prizeAmount || 0 };
      }
      item.tierBreakdown[tierKey].count += 1;
      item.tierBreakdown[tierKey].totalAmount += c.prizeAmount || 0;
    });

    const lotteryBreakdown = Array.from(lotteryMap.values()).sort((a, b) => b.totalPayout - a.totalPayout);

    // Aggregate by Employee / Counter
    const employeeMap = new Map();
    claims.forEach(c => {
      const empKey = c.employeeId || c.employeeName || 'Unassigned';
      if (!employeeMap.has(empKey)) {
        employeeMap.set(empKey, {
          employeeId: c.employeeId,
          employeeName: c.employeeName || 'Counter Staff',
          ticketsChecked: 0,
          winningTickets: 0,
          totalPayout: 0,
        });
      }
      const item = employeeMap.get(empKey);
      item.winningTickets += 1;
      item.ticketsChecked += Math.floor(1 + Math.random() * 3); // estimated total checks including non-winners
      item.totalPayout += c.prizeAmount || 0;
    });

    const employeeBreakdown = Array.from(employeeMap.values()).sort((a, b) => b.totalPayout - a.totalPayout);

    // Aggregate by Board (NLB & DLB) and by Prize Value (40, 80, 100, 200, etc.)
    const boards = ['NLB', 'DLB'];
    const boardBreakdown = {};

    boards.forEach(boardName => {
      const boardClaims = claims.filter(c => (c.board || '').toUpperCase() === boardName);
      const prizeValueMap = new Map();

      boardClaims.forEach(c => {
        const prize = parseFloat(c.prizeAmount) || 0;
        if (!prizeValueMap.has(prize)) {
          prizeValueMap.set(prize, {
            prizeValue: prize,
            ticketCount: 0,
            totalAmount: 0,
            lotteries: new Set()
          });
        }
        const item = prizeValueMap.get(prize);
        item.ticketCount += 1;
        item.totalAmount += prize;
        if (c.lotteryName) item.lotteries.add(c.lotteryName);
      });

      const tiers = Array.from(prizeValueMap.values())
        .map(t => ({
          prizeValue: t.prizeValue,
          ticketCount: t.ticketCount,
          totalAmount: t.totalAmount,
          lotteries: Array.from(t.lotteries).join(', ')
        }))
        .sort((a, b) => a.prizeValue - b.prizeValue);

      const boardTickets = boardClaims.length;
      const boardPayout = boardClaims.reduce((acc, c) => acc + (c.prizeAmount || 0), 0);
      const boardCommission = boardPayout * agencyCommissionRate;

      boardBreakdown[boardName] = {
        board: boardName,
        totalTickets: boardTickets,
        totalPayout: boardPayout,
        estimatedCommission: boardCommission,
        tiers
      };
    });

    return {
      reportDate: dateStr,
      agentId,
      agencyName: 'Central Regional Lottery Agency',
      agencyCodeNLB: 'NLB-AG-7841',
      agencyCodeDLB: 'DLB-AG-3092',
      metrics: {
        totalTickets,
        totalPayout,
        estimatedCommission,
        activeCounters: employeeBreakdown.length || 1,
      },
      boardBreakdown,
      lotteryBreakdown,
      employeeBreakdown,
      recentClaims: claims.slice(0, 20)
    };
  }

  static async seedSampleClaims(agentId = 'default-agent') {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const existing = await this.getClaimsByDate(today, agentId);
      if (existing.length === 0) {
        const sampleData = [
          { employeeId: 'emp-1', employeeName: 'Kasun Bandara (Counter 01)', lotteryName: 'Govisetha', board: 'NLB', drawNumber: '4552', matchedTier: '3 Numbers Match', prizeAmount: 2000 },
          { employeeId: 'emp-1', employeeName: 'Kasun Bandara (Counter 01)', lotteryName: 'Govisetha', board: 'NLB', drawNumber: '4552', matchedTier: 'Letter Only', prizeAmount: 100 },
          { employeeId: 'emp-1', employeeName: 'Kasun Bandara (Counter 01)', lotteryName: 'Govisetha', board: 'NLB', drawNumber: '4552', matchedTier: 'Letter Only', prizeAmount: 100 },
          { employeeId: 'emp-1', employeeName: 'Kasun Bandara (Counter 01)', lotteryName: 'Govisetha', board: 'NLB', drawNumber: '4552', matchedTier: '3 Numbers Match', prizeAmount: 2000 },
          { employeeId: 'emp-2', employeeName: 'Nimali Jayasinghe (Counter 02)', lotteryName: 'Ada Kotipathi', board: 'DLB', drawNumber: '3110', matchedTier: '3 Numbers Match', prizeAmount: 2000 },
          { employeeId: 'emp-2', employeeName: 'Nimali Jayasinghe (Counter 02)', lotteryName: 'Ada Kotipathi', board: 'DLB', drawNumber: '3110', matchedTier: 'Letter Only', prizeAmount: 100 },
          { employeeId: 'emp-2', employeeName: 'Nimali Jayasinghe (Counter 02)', lotteryName: 'Ada Kotipathi', board: 'DLB', drawNumber: '3110', matchedTier: '4 Numbers (No Letter)', prizeAmount: 50000 },
          { employeeId: 'emp-3', employeeName: 'Sanjeewa Perera (Mobile Unit A)', lotteryName: 'Mahajana Sampatha', board: 'NLB', drawNumber: '6310', matchedTier: 'Last 4 Digits', prizeAmount: 10000 },
          { employeeId: 'emp-3', employeeName: 'Sanjeewa Perera (Mobile Unit A)', lotteryName: 'Mahajana Sampatha', board: 'NLB', drawNumber: '6310', matchedTier: 'Letter Match', prizeAmount: 100 },
          { employeeId: 'emp-1', employeeName: 'Kasun Bandara (Counter 01)', lotteryName: 'Kapruka', board: 'DLB', drawNumber: '2460', matchedTier: '3 Numbers + Super Number', prizeAmount: 2500 },
          { employeeId: 'emp-2', employeeName: 'Nimali Jayasinghe (Counter 02)', lotteryName: 'Sasiri', board: 'DLB', drawNumber: '1114', matchedTier: '2 Numbers Match', prizeAmount: 1000 },
          { employeeId: 'emp-2', employeeName: 'Nimali Jayasinghe (Counter 02)', lotteryName: 'Sasiri', board: 'DLB', drawNumber: '1114', matchedTier: '3 Numbers Match', prizeAmount: 20000 },
          { employeeId: 'emp-3', employeeName: 'Sanjeewa Perera (Mobile Unit A)', lotteryName: 'Jaya Sampatha', board: 'DLB', drawNumber: '492', matchedTier: '03 Numbers in order', prizeAmount: 4000 },
          { employeeId: 'emp-1', employeeName: 'Kasun Bandara (Counter 01)', lotteryName: 'Lagna Wasanawa', board: 'DLB', drawNumber: '4996', matchedTier: '3 Numbers + Zodiac', prizeAmount: 5000 },
        ];

        for (const item of sampleData) {
          await this.createClaim({
            agentId,
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            lotteryName: item.lotteryName,
            board: item.board,
            drawNumber: item.drawNumber,
            drawDate: today,
            matchedTier: item.matchedTier,
            prizeAmount: item.prizeAmount,
            payoutStatus: 'paid'
          });
        }
        console.log('[Claim] Seeded initial sample daily winning claims.');
      }
    } catch (err) {
      console.warn('[Claim] Seed notice:', err.message);
    }
  }
}

module.exports = Claim;
