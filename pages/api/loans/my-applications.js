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

  db.all(
    `SELECT la.*, l.amount as loan_amount, l.interest_rate, l.term_months, u.name as lender_name
     FROM loan_applications la 
     JOIN loans l ON la.loan_id = l.id 
     JOIN users u ON l.lender_id = u.id
     WHERE la.borrower_id = ? 
     ORDER BY la.created_at DESC`,
    [decoded.userId],
    (err, applications) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ applications });
    }
  );
}