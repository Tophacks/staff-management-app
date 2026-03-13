const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { requireManager } = require('../middleware/auth');
const Hours = require('../models/Hours');
const Staff = require('../models/Staff');

const router = express.Router();

function buildDefaultRange() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6); // past 7 days including today
  return { start, end };
}

router.get('/weekly-summary', requireManager, async (req, res) => {
  let data = [];
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    let { from, to } = req.query;
    let startDate;
    let endDate;

    if (from || to) {
      if (from) {
        startDate = new Date(from);
        if (Number.isNaN(startDate.getTime())) {
          return res.status(400).json({ error: 'Invalid from date' });
        }
      }
      if (to) {
        endDate = new Date(to);
        if (Number.isNaN(endDate.getTime())) {
          return res.status(400).json({ error: 'Invalid to date' });
        }
      }
    } else {
      const range = buildDefaultRange();
      startDate = range.start;
      endDate = range.end;
    }

    const dateFilter = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;

    const approvedQuery = {
      status: 'approved',
    };
    const pendingQuery = {
      status: 'pending',
    };
    if (Object.keys(dateFilter).length > 0) {
      approvedQuery.date = dateFilter;
      pendingQuery.date = dateFilter;
    }

    const [approvedHours, pendingHours, staffMap] = await Promise.all([
      Hours.find(approvedQuery).lean(),
      Hours.find(pendingQuery).lean(),
      Staff.find({}).select('name').lean().then((docs) => {
        const map = new Map();
        docs.forEach((s) => {
          map.set(s._id.toString(), s.name);
        });
        return map;
      }),
    ]);

    const byEmployee = new Map();

    function ensureEmp(userId) {
      const id = userId.toString();
      if (!byEmployee.has(id)) {
        byEmployee.set(id, {
          employeeId: id,
          employeeName: staffMap.get(id) || 'Unknown',
          totalHours: 0,
          overtimeHours: 0,
          pendingHours: 0,
        });
      }
      return byEmployee.get(id);
    }

    approvedHours.forEach((h) => {
      const emp = ensureEmp(h.userId);
      const hrs = Number(h.totalHours) || 0;
      emp.totalHours += hrs;
    });

    pendingHours.forEach((h) => {
      const emp = ensureEmp(h.userId);
      const hrs = Number(h.totalHours) || 0;
      emp.pendingHours += hrs;
    });

    byEmployee.forEach((emp) => {
      if (emp.totalHours > 40) {
        emp.overtimeHours = emp.totalHours - 40;
      }
    });

    data = Array.from(byEmployee.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName)
    );

    const staffData = {
      range: {
        from: startDate?.toISOString() ?? null,
        to: endDate?.toISOString() ?? null,
      },
      employees: data,
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt =
      'You are a professional HR assistant. Provide a concise, business-friendly summary. ' +
      'Highlight total hours, anyone in overtime, and any pending approvals. Do not invent data.\n\n' +
      'Staff hours data (JSON): ' +
      JSON.stringify(staffData) +
      '\n\n' +
      'Provide a concise 2–4 paragraph summary for managers: overall utilization, employees in overtime, and significant pending hours.';

    const result = await model.generateContent(prompt);
    const response = result.response;
    let summary = '';
    if (response && typeof response.text === 'function') {
      try {
        summary = response.text();
      } catch (e) {
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
          summary = response.candidates[0].content.parts.map((p) => p.text || '').join('');
        }
      }
    }

    res.json({ summary, data });
  } catch (err) {
    console.error('GET /api/ai/weekly-summary error:', err);
    const message = err.message || String(err);
    const isQuota = message.includes('429') || message.includes('quota');
    if (isQuota) {
      res.json({
        summary: 'Summary temporarily unavailable (Gemini API quota exceeded). See the data table below. Try again later for an AI summary.',
        data,
      });
      return;
    }
    const safeMessage =
      message.includes('API key') || message.includes('401') || message.includes('403')
        ? 'Invalid or missing Gemini API key. Check GEMINI_API_KEY in .env'
        : message.includes('404') || message.includes('model')
            ? 'Gemini model unavailable. Try again later.'
            : 'Failed to generate weekly summary';
    res.status(500).json({ error: safeMessage });
  }
});

module.exports = router;
