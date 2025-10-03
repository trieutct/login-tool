const express = require('express');
const router = express.Router();
const hitClubController = require('../controller/hitClub.controller');
router.get('/registerHitClub', hitClubController.registerAccountApi);
module.exports = router;
