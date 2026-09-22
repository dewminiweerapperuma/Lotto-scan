const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');
const Employee = require('./Employee');

const ORDER_LOTTERIES = [
  { name: 'Lagna Wasanawa', board: 'DLB' },
  { name: 'Ada Kotipathi', board: 'DLB' },
  { name: 'Shanida', board: 'DLB' },
  { name: 'Super Ball', board: 'DLB' },
  { name: 'Kapruka', board: 'DLB' },
  { name: 'Sasiri', board: 'DLB' },
  { name: 'Supiri Dhana Sampatha', board: 'DLB' },
  { name: 'Jaya Sampatha', board: 'DLB' },
  { name: 'Govisetha', board: 'NLB' },
  { name: 'Mahajana Sampatha', board: 'NLB' },
  { name: 'Mega Power', board: 'NLB' },
  { name: 'Dhana Nidhanaya', board: 'NLB' },
  { name: 'Handahana', board: 'NLB' },
  { name: 'NLB Jaya', board: 'NLB' },
  { name: 'Ada Sampatha', board: 'NLB' },
  { name: 'Suba Dawasak', board: 'NLB' },
];

class Order {
  static getLotteriesList() {
    return ORDER_LOTTERIES;
  }

  static async getOrdersByDate(dateStr, agentId = 'default-agent') {
    const res = await db.query(
      'SELECT id, agent_id, order_date, employee_id, employee_name, lottery_name, board, ordered_qty, additional_qty, returned_qty, remaining_qty, commission_rate, created_at FROM daily_orders ORDER BY created_at DESC LIMIT 1000'
    );

    let rows = res.rows.map(r => {
      let oDate = '';
      if (r.order_date instanceof Date) {
        // Convert to local YYYY-MM-DD or UTC YYYY-MM-DD
        const y = r.order_date.getFullYear();
        const m = String(r.order_date.getMonth() + 1).padStart(2, '0');
        const d = String(r.order_date.getDate()).padStart(2, '0');
        oDate = `${y}-${m}-${d}`;
      } else {
        oDate = String(r.order_date || '').slice(0, 10);
      }

      return {
        id: r.id,
        agentId: r.agent_id,
        orderDate: oDate,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        lotteryName: r.lottery_name,
        board: r.board,
        orderedQty: parseInt(r.ordered_qty, 10) || 0,
        additionalQty: parseInt(r.additional_qty, 10) || 0,
        returnedQty: parseInt(r.returned_qty, 10) || 0,
        remainingQty: parseInt(r.remaining_qty, 10) || 0,
        commissionRate: parseFloat(r.commission_rate) || 2.5,
        createdAt: r.created_at
      };
    });

    if (dateStr) {
      rows = rows.filter(r => r.orderDate === dateStr);
    }
    if (agentId && agentId !== 'all') {
      rows = rows.filter(r => r.agentId === agentId);
    }

    return rows;
  }

  static async getDailyOrderMatrix(dateStr = new Date().toISOString().slice(0, 10), agentId = 'default-agent') {
    const employees = await Employee.listByAgent(agentId);
    const orderRows = await this.getOrdersByDate(dateStr, agentId);

    // Build 2D matrix: matrix[lotteryName][employeeId] = orderedQty
    const matrix = {};
    const additional = {};
    const returns = {};
    const remaining = {};
    const employeeCommissionRates = {};

    ORDER_LOTTERIES.forEach(l => {
      matrix[l.name] = {};
      employees.forEach(emp => {
        matrix[l.name][emp.id] = 0;
      });
    });

    employees.forEach(emp => {
      additional[emp.id] = 0;
      returns[emp.id] = 0;
      remaining[emp.id] = 0;
      employeeCommissionRates[emp.id] = emp.commissionRate || 2.5;
    });

    // Populate saved values (orderRows are ordered by created_at DESC so the first encountered value is the newest)
    const seenMatrix = new Set();
    const seenAdditional = new Set();
    const seenReturns = new Set();
    const seenRemaining = new Set();
    const seenRates = new Set();

    orderRows.forEach(row => {
      const matKey = `${row.lotteryName}_${row.employeeId}`;
      if (!seenMatrix.has(matKey) && matrix[row.lotteryName]) {
        matrix[row.lotteryName][row.employeeId] = row.orderedQty || 0;
        seenMatrix.add(matKey);
      }
      if (!seenAdditional.has(row.employeeId) && row.additionalQty !== undefined && row.additionalQty !== null) {
        additional[row.employeeId] = row.additionalQty;
        seenAdditional.add(row.employeeId);
      }
      if (!seenReturns.has(row.employeeId) && row.returnedQty !== undefined && row.returnedQty !== null) {
        returns[row.employeeId] = row.returnedQty;
        seenReturns.add(row.employeeId);
      }
      if (!seenRemaining.has(row.employeeId) && row.remainingQty !== undefined && row.remainingQty !== null) {
        remaining[row.employeeId] = row.remainingQty;
        seenRemaining.add(row.employeeId);
      }
      if (!seenRates.has(row.employeeId) && row.commissionRate) {
        employeeCommissionRates[row.employeeId] = row.commissionRate;
        seenRates.add(row.employeeId);
      }
    });

    // If remaining is empty (0) but returns had values, seed remaining from returns so existing data carries over cleanly
    employees.forEach(emp => {
      if ((remaining[emp.id] === 0 || remaining[emp.id] === undefined) && (returns[emp.id] || 0) > 0 && !seenRemaining.has(emp.id)) {
        remaining[emp.id] = returns[emp.id];
      }
    });

    // Calculate Row Totals (Total Tickets per Lottery across all employees)
    const lotteryTotals = {};
    ORDER_LOTTERIES.forEach(l => {
      let sum = 0;
      employees.forEach(emp => {
        sum += (matrix[l.name][emp.id] || 0);
      });
      lotteryTotals[l.name] = sum;
    });

    // Calculate Column Totals (Total per Employee, Net Sold, and Commission Amount)
    const employeeTotals = {};
    const totalIssued = {};
    const netSold = {};
    const commissionAmounts = {};

    employees.forEach(emp => {
      let empOrderedSum = 0;
      ORDER_LOTTERIES.forEach(l => {
        empOrderedSum += (matrix[l.name][emp.id] || 0);
      });
      employeeTotals[emp.id] = empOrderedSum;
      const empAdd = additional[emp.id] || 0;
      const empRem = remaining[emp.id] || 0;
      const empRet = returns[emp.id] || 0;

      totalIssued[emp.id] = empOrderedSum + empAdd;
      // Net Sold = (Ordered + Additional) - Remaining of the day - Unsold Returns
      const empNet = Math.max(0, empOrderedSum + empAdd - empRem - empRet);
      netSold[emp.id] = empNet;
      const rate = employeeCommissionRates[emp.id] || 2.5;
      commissionAmounts[emp.id] = empNet * rate;
    });

    // Grand Totals
    const grandTotalOrdered = Object.values(lotteryTotals).reduce((a, b) => a + b, 0);
    const grandTotalAdditional = Object.values(additional).reduce((a, b) => a + b, 0);
    const grandTotalIssued = grandTotalOrdered + grandTotalAdditional;
    const grandTotalRemaining = Object.values(remaining).reduce((a, b) => a + b, 0);
    const grandTotalReturns = Object.values(returns).reduce((a, b) => a + b, 0);
    const grandTotalNetSold = Object.values(netSold).reduce((a, b) => a + b, 0);
    const grandTotalCommission = Object.values(commissionAmounts).reduce((a, b) => a + b, 0);

    return {
      orderDate: dateStr,
      agentId,
      lotteries: ORDER_LOTTERIES,
      employees,
      matrix,
      additional,
      returns,
      remaining,
      employeeCommissionRates,
      lotteryTotals,
      employeeTotals,
      totalIssued,
      netSold,
      commissionAmounts,
      summary: {
        grandTotalOrdered,
        grandTotalAdditional,
        grandTotalIssued,
        grandTotalRemaining,
        grandTotalReturns,
        grandTotalNetSold,
        grandTotalCommission,
        totalEmployees: employees.length
      }
    };
  }

  static async saveDailyOrders({
    dateStr = new Date().toISOString().slice(0, 10),
    agentId = 'default-agent',
    matrix = {},
    additional = {},
    returns = {},
    remaining = {},
    employeeCommissionRates = {}
  }) {
    const employees = await Employee.listByAgent(agentId);
    const createdAt = new Date().toISOString();
    const formattedDate = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00.000Z`;

    for (const lot of ORDER_LOTTERIES) {
      const lotRow = matrix[lot.name] || {};
      for (const emp of employees) {
        const qty = parseInt(lotRow[emp.id], 10) || 0;
        const addQty = parseInt(additional[emp.id], 10) || 0;
        const retQty = parseInt(returns[emp.id], 10) || 0;
        const remQty = parseInt(remaining[emp.id], 10) || 0;
        const rate = parseFloat(employeeCommissionRates[emp.id]) || emp.commissionRate || 2.5;

        const id = uuidv4();
        await db.query(
          `INSERT INTO daily_orders 
           (id, agent_id, order_date, employee_id, employee_name, lottery_name, board, ordered_qty, additional_qty, returned_qty, remaining_qty, commission_rate, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [id, agentId, formattedDate, emp.id, emp.name, lot.name, lot.board, qty, addQty, retQty, remQty, rate, createdAt]
        );
      }
    }

    return await this.getDailyOrderMatrix(dateStr, agentId);
  }

  static async seedSampleOrders(dateStr = new Date().toISOString().slice(0, 10), agentId = 'default-agent') {
    try {
      const existing = await this.getOrdersByDate(dateStr, agentId);
      if (existing.length === 0) {
        const employees = await Employee.listByAgent(agentId);
        if (employees.length === 0) return;

        // Sample realistic allocation numbers matching Excel sheet
        const sampleAllocations = {
          'Lagna Wasanawa': [160, 60, 40, 50, 40, 60, 40, 70, 40, 30, 30, 20, 20, 10, 5, 5, 40, 30, 5, 10, 5, 10],
          'Ada Kotipathi': [100, 30, 30, 30, 10, 30, 20, 40, 10, 20, 20, 10, 10, 5, 5, 5, 20, 10, 5, 5, 5, 5],
          'Shanida': [80, 40, 20, 30, 10, 20, 20, 30, 10, 10, 10, 10, 10, 5, 5, 5, 20, 10, 0, 10, 5, 5],
          'Super Ball': [60, 30, 10, 20, 10, 10, 20, 30, 10, 10, 10, 10, 5, 5, 5, 0, 20, 10, 0, 10, 0, 5],
          'Kapruka': [150, 40, 30, 30, 20, 60, 30, 60, 50, 20, 20, 10, 10, 5, 5, 5, 20, 20, 5, 10, 5, 5],
          'Sasiri': [30, 10, 10, 10, 5, 10, 10, 20, 5, 5, 5, 5, 0, 5, 5, 5, 10, 5, 0, 5, 0, 0],
          'Supiri Dhana Sampatha': [20, 10, 10, 10, 5, 10, 10, 30, 10, 5, 5, 5, 5, 5, 0, 0, 10, 5, 0, 5, 0, 0],
          'Jaya Sampatha': [20, 20, 10, 10, 0, 10, 10, 30, 5, 5, 5, 5, 0, 0, 5, 5, 10, 5, 0, 5, 0, 0],
          'Govisetha': [170, 70, 40, 40, 20, 60, 40, 90, 30, 25, 30, 20, 10, 5, 5, 5, 40, 30, 5, 10, 5, 5],
          'Mahajana Sampatha': [80, 30, 20, 20, 10, 30, 20, 40, 20, 15, 10, 10, 5, 5, 5, 5, 20, 15, 5, 10, 5, 5],
          'Mega Power': [80, 20, 20, 20, 10, 20, 20, 30, 10, 10, 10, 10, 5, 0, 5, 0, 20, 10, 0, 5, 5, 5],
          'Dhana Nidhanaya': [70, 30, 20, 10, 10, 20, 20, 30, 10, 10, 10, 5, 5, 0, 5, 0, 20, 10, 0, 5, 0, 5],
          'Handahana': [50, 20, 20, 20, 10, 20, 20, 30, 10, 10, 10, 10, 10, 5, 10, 0, 20, 10, 0, 5, 5, 5],
          'NLB Jaya': [30, 20, 10, 10, 10, 10, 20, 40, 10, 5, 10, 5, 5, 0, 0, 0, 10, 10, 0, 5, 0, 5],
          'Ada Sampatha': [60, 60, 20, 20, 10, 20, 20, 40, 10, 10, 5, 10, 5, 0, 0, 0, 10, 5, 0, 5, 5, 5],
          'Suba Dawasak': [40, 20, 20, 10, 10, 20, 20, 30, 10, 10, 10, 10, 10, 5, 5, 0, 10, 15, 0, 5, 5, 5],
        };

        const sampleRemaining = [20, 10, 5, 8, 0, 12, 10, 15, 5, 5, 5, 4, 2, 0, 0, 0, 8, 5, 0, 2, 0, 0];

        const matrix = {};
        const additional = {};
        const returns = {};
        const remaining = {};
        const employeeCommissionRates = {};

        ORDER_LOTTERIES.forEach(lot => {
          matrix[lot.name] = {};
          const rowValues = sampleAllocations[lot.name] || [];
          employees.forEach((emp, eIdx) => {
            matrix[lot.name][emp.id] = rowValues[eIdx] !== undefined ? rowValues[eIdx] : 10;
          });
        });

        employees.forEach((emp, eIdx) => {
          additional[emp.id] = 0;
          returns[emp.id] = 0;
          remaining[emp.id] = sampleRemaining[eIdx] !== undefined ? sampleRemaining[eIdx] : 0;
          employeeCommissionRates[emp.id] = emp.commissionRate || 2.5;
        });

        await this.saveDailyOrders({
          dateStr,
          agentId,
          matrix,
          additional,
          returns,
          remaining,
          employeeCommissionRates
        });

        console.log(`[Order] Seeded sample daily order matrix for ${dateStr}.`);
      }
    } catch (err) {
      console.warn('[Order] Seed notice:', err.message);
    }
  }
}

module.exports = Order;
