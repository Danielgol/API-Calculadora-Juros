const express = require('express')
const router = express.Router()

const calculadoraController = require('../controllers/MockController')

router.get('/jurosSimples/capital/:capital/taxa/:taxa/tempo/:tempo', calculadoraController.get_juros_simples)
router.get('/jurosCompostos/capital/:capital/taxa/:taxa/tempo/:tempo', calculadoraController.get_juros_compostos)
router.get('/investimento/inicial/:inicial/mensal/:mensal/final/:final/tempo/:tempo', calculadoraController.get_opcoes_investimento)

module.exports = router
