const express = require('express');
const router = express.Router();
const { generateDocsController } = require('../controllers/docController');

router.post('/', generateDocsController);
module.exports = router;