const db = require('../../../../lib/database');
const { verifyToken } = require('../../../../lib/auth');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const { id } = req.query;

  // Get application details and verify ownership
  db.get(
    `SELECT la.*, l.lender_id, l.id as loan_id
     FROM loan_applications la 
     JOIN loans l ON la.loan_id = l.id 
     WHERE la.id = ?`,
    [id],
    (err, application) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (application.lender_id !== decoded.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      if (application.status !== 'pending') {
        return res.status(400).json({ message: 'Application already processed' });
      }

      // Update application status and loan
      db.serialize(() => {
        db.run('UPDATE loan_applications SET status = "approved" WHERE id = ?', [id]);
        db.run(
          'UPDATE loans SET status = "funded", borrower_id = ?, funded_at = CURRENT_TIMESTAMP WHERE id = ?',
          [application.borrower_id, application.loan_id]
        );
        db.run('UPDATE loan_applications SET status = "rejected" WHERE loan_id = ? AND id != ?', 
          [application.loan_id, id]);
      });

      res.json({ message: 'Application approved successfully' });
    }
  );
}