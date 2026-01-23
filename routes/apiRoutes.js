// routes/apiRoutes.js
const router = require('express').Router();
const { 
  createSession, 
  joinSession, 
  reclaimAdmin, 
  rejoinSession 
} = require('../controllers/muralControllers');

// The endpoints
router.post('/mural/create', createSession);
router.post('/mural/join', joinSession);
router.post('/mural/reclaim', reclaimAdmin);
router.post('/mural/rejoin', rejoinSession);

module.exports = router;