const express = require('express')
const router = express.Router()

const mockController = require('../controllers/MockController')

router.get('/jurosSimples/capital/:capital/taxa/:taxa/tempo/:tempo', mockController.get_juros_simples)
router.get('/jurosCompostos/capital/:capital/taxa/:taxa/tempo/:tempo', mockController.get_juros_compostos)

module.exports = router
