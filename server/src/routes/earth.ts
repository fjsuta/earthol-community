
import express from 'express';
import { populationService } from '../services/populationService';
import pool from '../config/database';

const router = express.Router();

router.get('/data', (req, res) => {
  const data = populationService.getCurrentData();
  res.json({ success: true, data });
});

router.get('/regions', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM region_data ORDER BY is_continuous DESC, population DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get regions' });
  }
});

export default router;
