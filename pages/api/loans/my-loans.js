const db = require('../../../lib/database');
const { verifyToken } = require('../../../lib/auth');

export default function handler(req, res) {
  if (req.method !== 'GET') {
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

  // Get loans created by this user
  db.all(
    'SELECT * FROM loans WHERE lender_id = ? ORDER BY created_at DESC',
    [decoded.userId],
    (err, loans) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      // Get applications for each loan
      const loanIds = loans.map(loan => loan.id);
      
      if (loanIds.length === 0) {
        return res.json({ loans: [] });
      }

      const placeholders = loanIds.map(() => '?').join(',');
      
      db.all(
        `SELECT la.*, u.name as borrower_name, l.amount as loan_amount, l.interest_rate, l.term_months
         FROM loan_applications la 
         JOIN users u ON la.borrower_id = u.id 
         JOIN loans l ON la.loan_id = l.id
         WHERE la.loan_id IN (${placeholders})
         ORDER BY la.created_at DESC`,
        loanIds,
        (err, applications) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }

          // Group applications by loan
          const loansWithApplications = loans.map(loan => ({
            ...loan,
            applications: applications.filter(app => app.loan_id === loan.id)
          }));

          res.json({ loans: loansWithApplications });
        }
      );
    }
  );
}