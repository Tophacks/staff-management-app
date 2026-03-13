function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function safePercentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function generateWeeklySummary(staffData) {
  const rows = Array.isArray(staffData) ? staffData : [];
  const totalHours = rows.reduce((sum, item) => sum + (Number(item.totalHours) || 0), 0);
  const previousTotalHours = rows.reduce((sum, item) => sum + (Number(item.lastWeekHours) || 0), 0);
  const pendingApprovals = rows.reduce((sum, item) => sum + (Number(item.pendingApprovals) || 0), 0);
  const payrollEstimate = rows.reduce((sum, item) => sum + (Number(item.estimatedPayroll) || 0), 0);
  const overtimeStaff = rows.filter((item) => Number(item.overtimeHours) > 0);
  const percentChange = safePercentChange(totalHours, previousTotalHours);
  const trendEmoji = percentChange >= 0 ? '📈' : '🔻';

  const summaryParts = [
    `✅ This week logged ${totalHours.toFixed(1)} approved hours across ${rows.length} team member${rows.length === 1 ? '' : 's'}, with an estimated payroll impact of ${formatCurrency(payrollEstimate)}.`,
    `${trendEmoji} Compared with last week, hours are ${Math.abs(percentChange).toFixed(1)}% ${percentChange >= 0 ? 'higher' : 'lower'}${previousTotalHours ? '' : ' with no prior-week baseline available'}.`,
  ];

  if (overtimeStaff.length) {
    summaryParts.push(
      `⚠️ Overtime was recorded for ${overtimeStaff.map((item) => `${item.employeeName} (${Number(item.overtimeHours).toFixed(1)}h)`).join(', ')}.`
    );
  } else {
    summaryParts.push('✅ No overtime spikes were detected this week.');
  }

  if (pendingApprovals > 0) {
    summaryParts.push(`🔴 ${pendingApprovals} approval${pendingApprovals === 1 ? '' : 's'} still need manager review.`);
  } else {
    summaryParts.push('✅ All submitted hours are fully reviewed.');
  }

  return summaryParts.join(' ');
}

function detectAnomalies(submissions) {
  const rows = Array.isArray(submissions) ? submissions : [];
  const anomalies = [];
  const byEmployeeDate = new Map();
  const avgByEmployee = new Map();

  rows.forEach((item) => {
    const employeeName = item.employeeName || 'Unknown';
    const date = item.date || '';
    const hours = Number(item.hours) || 0;
    const averageEntry = avgByEmployee.get(employeeName) || { total: 0, count: 0 };
    averageEntry.total += hours;
    averageEntry.count += 1;
    avgByEmployee.set(employeeName, averageEntry);

    const key = `${employeeName}:${date}`;
    byEmployeeDate.set(key, (byEmployeeDate.get(key) || 0) + 1);
  });

  rows.forEach((item) => {
    const employeeName = item.employeeName || 'Unknown';
    const date = item.date || '';
    const hours = Number(item.hours) || 0;
    const submittedAt = item.submittedAt ? new Date(item.submittedAt) : null;
    const average = avgByEmployee.get(employeeName);
    const personalAverage = average && average.count ? average.total / average.count : 0;
    const day = date ? new Date(date).getDay() : -1;
    const key = `${employeeName}:${date}`;

    if (hours > 14) {
      anomalies.push({ employeeName, flag: 'Logged more than 14 hours in one day', severity: 'high', date });
    }
    if (day === 0 || day === 6) {
      anomalies.push({ employeeName, flag: 'Weekend submission detected', severity: 'medium', date });
    }
    if ((byEmployeeDate.get(key) || 0) > 1) {
      anomalies.push({ employeeName, flag: 'Duplicate date entry found', severity: 'high', date });
    }
    if (personalAverage > 0 && hours > personalAverage * 1.5) {
      anomalies.push({ employeeName, flag: 'Hours are 50% above personal average', severity: 'medium', date });
    }
    if (submittedAt) {
      const submittedHour = submittedAt.getHours();
      if (submittedHour < 6 || submittedHour > 20) {
        anomalies.push({ employeeName, flag: 'Submission was made outside business hours', severity: 'low', date });
      }
    }
  });

  return anomalies;
}

function forecastPayroll(staff, approvedHours) {
  const people = Array.isArray(staff) ? staff : [];
  const data = approvedHours || {};
  const hoursByStaff = data.currentHoursByStaff || {};
  const lastMonthSpend = Number(data.lastMonthSpend) || 0;
  const daysElapsed = Math.max(Number(data.daysElapsed) || 0, 1);
  const daysInMonth = Math.max(Number(data.daysInMonth) || daysElapsed, 1);

  const currentSpend = people.reduce((sum, person) => {
    const annualSalary = Number(person.salary) || 0;
    const hourlyRate = annualSalary / 2080;
    const approved = Number(hoursByStaff[person.id || person._id?.toString()] || 0);
    return sum + approved * hourlyRate;
  }, 0);

  const dailyBurnRate = currentSpend / daysElapsed;
  const projected = dailyBurnRate * daysInMonth;
  const percentChange = safePercentChange(projected, lastMonthSpend);
  const alert = projected > lastMonthSpend * 1.1 && lastMonthSpend > 0;
  const status = alert
    ? 'warning'
    : projected >= currentSpend
      ? 'stable'
      : 'down';

  return {
    currentSpend,
    projected,
    percentChange,
    status,
    alert,
    dailyBurnRate,
    lastMonthSpend,
    formattedCurrentSpend: formatCurrency(currentSpend),
    formattedProjected: formatCurrency(projected),
    formattedDailyBurnRate: formatCurrency(dailyBurnRate),
    formattedLastMonthSpend: formatCurrency(lastMonthSpend),
  };
}

function getTurnoverRisk(employees) {
  const rows = Array.isArray(employees) ? employees : [];
  return rows
    .map((employee) => {
      let score = 0;
      const reasons = [];

      if (employee.missedShifts > 0) {
        score += Math.min(employee.missedShifts * 18, 36);
        reasons.push(`${employee.missedShifts} missed shift${employee.missedShifts === 1 ? '' : 's'}`);
      }
      if (employee.lateSubmissions > 0) {
        score += Math.min(employee.lateSubmissions * 8, 24);
        reasons.push(`${employee.lateSubmissions} late submission${employee.lateSubmissions === 1 ? '' : 's'}`);
      }
      if (employee.tenureDays < 90) {
        score += 14;
        reasons.push('tenure under 90 days');
      }
      if (employee.hoursTrendPercent < -20) {
        score += 16;
        reasons.push('declining hours trend');
      }
      if (employee.daysSinceActivity > 7) {
        score += 20;
        reasons.push('no activity in the last 7 days');
      }

      const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
      const risk = boundedScore >= 60 ? 'High' : boundedScore >= 30 ? 'Medium' : 'Low';

      return {
        employeeName: employee.employeeName,
        risk,
        score: boundedScore,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function generateInsights(allData) {
  const summary = generateWeeklySummary(allData.staffData);
  const anomalies = detectAnomalies(allData.submissions);
  const forecast = forecastPayroll(allData.staff, allData.approvedHours);
  const turnoverRisk = getTurnoverRisk(allData.employees);

  return {
    summary,
    anomalies,
    forecast,
    turnoverRisk,
  };
}

module.exports = {
  generateWeeklySummary,
  detectAnomalies,
  forecastPayroll,
  getTurnoverRisk,
  generateInsights,
  formatCurrency,
};
