const db = require('../../lib/database');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  db.all(
    `SELECT l.*, u.name as lender_name, u.user_type as lender_type
     FROM loans l 
     JOIN users u ON l.lender_id = u.id 
     WHERE l.status = 'available' 
     ORDER BY l.created_at DESC`,
    [],
    (err, loans) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      return res.json({ loans });
    }
  );
}