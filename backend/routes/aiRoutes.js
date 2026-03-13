const express = require('express');
const Hours = require('../models/Hours');
const Staff = require('../models/Staff');
const Shift = require('../models/Shift');
const { generateInsights } = require('../utils/aiAgent');

const router = express.Router();

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

router.get('/insights', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const lookbackStart = new Date(todayStart);
    lookbackStart.setDate(lookbackStart.getDate() - 60);

    const [staff, recentHours, currentWeekApproved, currentWeekPending, lastWeekApproved, monthApproved, lastMonthApproved, recentShifts] = await Promise.all([
      Staff.find({}).lean(),
      Hours.find({ date: { $gte: lookbackStart, $lte: endOfDay(now) } }).sort({ date: -1 }).lean(),
      Hours.find({ status: 'approved', date: { $gte: weekStart, $lte: endOfDay(now) } }).lean(),
      Hours.find({ status: 'pending', date: { $gte: weekStart, $lte: endOfDay(now) } }).lean(),
      Hours.find({ status: 'approved', date: { $gte: lastWeekStart, $lte: lastWeekEnd } }).lean(),
      Hours.find({ status: 'approved', date: { $gte: monthStart, $lte: endOfDay(now) } }).lean(),
      Hours.find({ status: 'approved', date: { $gte: lastMonthStart, $lte: lastMonthEnd } }).lean(),
      Shift.find({ date: { $gte: lookbackStart, $lte: endOfDay(now) } }).lean(),
    ]);

    const staffById = new Map(staff.map((person) => [person._id.toString(), person]));

    const sumHoursByUser = (rows) => rows.reduce((map, row) => {
      const key = row.userId.toString();
      map.set(key, (map.get(key) || 0) + (Number(row.totalHours) || 0));
      return map;
    }, new Map());

    const countByUser = (rows) => rows.reduce((map, row) => {
      const key = row.userId.toString();
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map());

    const currentWeekApprovedByUser = sumHoursByUser(currentWeekApproved);
    const currentWeekPendingByUser = countByUser(currentWeekPending);
    const lastWeekApprovedByUser = sumHoursByUser(lastWeekApproved);
    const monthApprovedByUser = sumHoursByUser(monthApproved);

    const staffData = staff.map((person) => {
      const id = person._id.toString();
      const totalHours = currentWeekApprovedByUser.get(id) || 0;
      const lastWeekHours = lastWeekApprovedByUser.get(id) || 0;
      const overtimeHours = Math.max(totalHours - 40, 0);
      const hourlyRate = (Number(person.salary) || 0) / 2080;

      return {
        employeeId: id,
        employeeName: person.name,
        totalHours,
        overtimeHours,
        pendingApprovals: currentWeekPendingByUser.get(id) || 0,
        approvalStatus: (currentWeekPendingByUser.get(id) || 0) > 0 ? 'pending-review' : 'reviewed',
        estimatedPayroll: totalHours * hourlyRate,
        lastWeekHours,
      };
    });

    const submissions = recentHours.map((row) => {
      const person = staffById.get(row.userId.toString());
      return {
        employeeName: person?.name || 'Unknown',
        date: dateKey(row.date),
        hours: Number(row.totalHours) || 0,
        submittedAt: row.createdAt,
      };
    });

    const currentHoursByStaff = {};
    monthApproved.forEach((row) => {
      const key = row.userId.toString();
      currentHoursByStaff[key] = (currentHoursByStaff[key] || 0) + (Number(row.totalHours) || 0);
    });

    const lastMonthSpend = lastMonthApproved.reduce((sum, row) => {
      const person = staffById.get(row.userId.toString());
      const hourlyRate = ((Number(person?.salary) || 0) / 2080);
      return sum + ((Number(row.totalHours) || 0) * hourlyRate);
    }, 0);

    const shiftsByUserDate = new Set(recentShifts.map((shift) => `${shift.userId.toString()}:${dateKey(shift.date)}`));
    const employeeMetrics = staff.map((person) => {
      const id = person._id.toString();
      const personHours = recentHours
        .filter((row) => row.userId.toString() === id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const last14 = personHours.filter((row) => new Date(row.date) >= new Date(endOfDay(now).getTime() - 14 * 24 * 60 * 60 * 1000));
      const previous14 = personHours.filter((row) => {
        const date = new Date(row.date);
        const start = new Date(endOfDay(now).getTime() - 28 * 24 * 60 * 60 * 1000);
        const end = new Date(endOfDay(now).getTime() - 14 * 24 * 60 * 60 * 1000);
        return date >= start && date < end;
      });
      const last14Hours = last14.reduce((sum, row) => sum + (Number(row.totalHours) || 0), 0);
      const previous14Hours = previous14.reduce((sum, row) => sum + (Number(row.totalHours) || 0), 0);
      const hoursTrendPercent = previous14Hours ? ((last14Hours - previous14Hours) / previous14Hours) * 100 : 0;
      const lateSubmissions = personHours.filter((row) => {
        const createdAt = row.createdAt ? new Date(row.createdAt) : null;
        return createdAt && createdAt.getHours() > 20;
      }).length;
      const missedShifts = recentShifts.filter((shift) => {
        return shift.userId.toString() === id && !personHours.some((row) => dateKey(row.date) === dateKey(shift.date));
      }).length;
      const lastActivity = personHours[0] ? new Date(personHours[0].createdAt || personHours[0].date) : null;
      const daysSinceActivity = lastActivity ? Math.floor((endOfDay(now) - lastActivity) / (24 * 60 * 60 * 1000)) : 999;
      const tenureDays = person.startDate ? Math.floor((todayStart - startOfDay(new Date(person.startDate))) / (24 * 60 * 60 * 1000)) : 0;

      return {
        employeeName: person.name,
        missedShifts,
        lateSubmissions,
        tenureDays,
        hoursTrendPercent,
        daysSinceActivity,
      };
    });

    const insights = await generateInsights({
      staffData,
      submissions,
      staff: staff.map((person) => ({ id: person._id.toString(), name: person.name, salary: person.salary || 0 })),
      approvedHours: {
        currentHoursByStaff,
        daysElapsed: now.getDate(),
        daysInMonth,
        lastMonthSpend,
      },
      employees: employeeMetrics,
    });

    res.json(insights);
  } catch (err) {
    console.error('GET /api/ai/insights error:', err);
    res.status(500).json({ error: 'Failed to generate smart insights' });
  }
});

module.exports = router;
