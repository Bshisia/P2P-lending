const db = require('../../../lib/database');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  db.get(
    `SELECT l.*, u.name as lender_name 
     FROM loans l 
     JOIN users u ON l.lender_id = u.id 
     WHERE l.id = ?`,
    [id],
    (err, loan) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }

      return res.json({ loan });
    }
  );
}