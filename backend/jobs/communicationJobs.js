const cron = require('node-cron');
const Hours = require('../models/Hours');
const Staff = require('../models/Staff');
const { sendEmail } = require('../lib/email');

function startCommunicationJobs() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const pendingHoursCount = await Hours.countDocuments({ status: 'pending' });
      if (!pendingHoursCount) return;

      const managers = await Staff.find({ role: 'Manager' }).lean();
      await Promise.allSettled(
        managers.map((manager) =>
          sendEmail({
            to: manager.email,
            subject: 'Pending hours reminder',
            html: `
              <p>Hello ${manager.name || 'Manager'},</p>
              <p>You have <strong>${pendingHoursCount}</strong> pending hour entr${pendingHoursCount === 1 ? 'y' : 'ies'} awaiting review.</p>
              <p>Please review them in the staff management app.</p>
            `,
          })
        )
      );
    } catch (err) {
      console.error('Daily pending hours reminder failed:', err.message);
    }
  });
}

module.exports = { startCommunicationJobs };
