const express = require('express');
const router = express.Router();
const { generateDocsController } = require('../controllers/docController');
const {apiValidator} = require("../utils/apiValidation")

router.post('/',apiValidator, generateDocsController);
module.exports = router;