
const https = require('https');


module.exports = {

    get_juros_simples(req, res) {
        try{
            const {capital, taxa, tempo} = req.params
            const juros = parseFloat(capital) * parseFloat(taxa) * parseFloat(tempo)
            const montante = parseFloat(capital) + parseFloat(juros)
            const resposta = String(montante) !== "NaN" ? String(montante) : "Parâmetros inválidos!"
            res.send(resposta);
        }catch(error){
            res.send(error);
        }
    },

    get_juros_compostos(req, res) {
        try{
            const {capital, taxa, tempo} = req.params
            const montante = parseFloat(capital) * ((1 + parseFloat(taxa))**parseFloat(tempo))
            const resposta = String(montante) !== "NaN" ? String(montante) : "Parâmetros inválidos!"
            res.send(resposta);
        }catch(error){
            res.send(error);
        }   
    }

}
