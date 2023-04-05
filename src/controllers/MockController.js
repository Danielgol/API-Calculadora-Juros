
const axios = require('axios');

const {
    HTTP_OK,
    HTTP_NOT_FOUND,
    SELIC_URL,
    POUPANCA_URL,
    CDB_URL
} = require('../utils/Constants');

// https://www.youtube.com/watch?v=f9in_JZ__F8&ab_channel=TudoMaisConstante
// https://www3.bcb.gov.br/sgspub/localizarseries/localizarSeries.do?method=prepararTelaLocalizarSeries

function calcularValorFinal(valorInicial, tempoInvestimentoMeses, aporteMensal, taxa_anual) {
    const taxa_mensal = (taxa_anual/12)/100
    //return (valorInicial*((1+taxa)**tempoInvestimentoMeses)) + ((aporteMensal * (((1+taxa)**tempoInvestimentoMeses)-1))/taxa)
    var valorFinal = valorInicial;
    for (var i = 0; i < tempoInvestimentoMeses; i++) {
        valorFinal += aporteMensal;
        valorFinal *= 1 + taxa_mensal;
    }
    return valorFinal;
}

function calcularTaxaJuros(vf, vp, pmt, n, tol=0.0001, maxIter=100000) {
    let a = 0.0;  // Taxa de juros mínima possível
    let b = 1.0;  // Taxa de juros máxima possível
    let i = (a + b) / 2.0;  // Taxa de juros inicial
  
    for (let iter = 0; iter < maxIter; iter++) {
        const f = vp * Math.pow(1 + i/12, n*12) + pmt * (((Math.pow(1 + i/12, n*12) - 1) / (i/12))) - vf;

        if (i < 0.005){
            console.log(i, "small enough!")
            return i
        }
    
        if (Math.abs(f) < tol) {
            console.log("found!")
            return i;
        }
    
        if (f > 0) {
            b = i;
        } else {
            a = i;
        }
    
        i = (a + b) / 2.0;
        }

    return i
}
  
function calcularTempoParaAtingirValorFinal(valorInicial, valorFinal, aporteMensal, taxa_anual) {
    const taxa_mensal = (taxa_anual/12)/100
    let tempo = 0;
    let valorAtual = valorInicial;
    while (valorAtual < valorFinal) {
        valorAtual += aporteMensal;
        valorAtual *= 1 + taxa_mensal;
        tempo++;
    }
    return tempo;
}

class Resultado{
    constructor(nome, taxa_anual, n_aportes, valor_final){
        this.nome = nome;
        this.taxa_anual = taxa_anual;
        this.n_aportes = n_aportes;
        this.valor_final = valor_final;
    }
}



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
    },

    async get_opcoes_investimento(req, res) {
        try{
            const {inicial, mensal, final, tempo} = req.params

            const meses = tempo*12
            const investido = parseFloat(inicial) + parseFloat((mensal*meses))
            const diferenca = final - investido

            const taxa_anual_necessaria = calcularTaxaJuros(parseFloat(final), parseFloat(inicial), parseFloat(mensal), parseInt(tempo))*100

            let taxas = [];

            const selic_response = await axios.get(SELIC_URL);
            const selic = parseFloat(selic_response.data[0].valor)
            const selic_tempo = calcularTempoParaAtingirValorFinal(parseFloat(inicial), parseFloat(final), parseFloat(mensal), parseFloat(selic))
            const selic_total = calcularValorFinal(parseFloat(inicial), parseInt(selic_tempo), parseFloat(mensal), parseFloat(selic))
            console.log("selic", selic, selic_tempo, selic_total)
            const res_selic = new Resultado("SELIC", selic, selic_tempo, selic_total)
            if (selic) {
                taxas.push(res_selic)
            }

            const cdb_response = await axios.get(CDB_URL);
            const cdb = parseFloat(cdb_response.data[0].valor)
            const cdb_tempo = calcularTempoParaAtingirValorFinal(parseFloat(inicial), parseFloat(final), parseFloat(mensal), parseFloat(cdb))
            const cdb_total = calcularValorFinal(parseFloat(inicial), parseInt(cdb_tempo), parseFloat(mensal), parseFloat(cdb))
            console.log("cdb", cdb, cdb_tempo, cdb_total)
            const res_cdb = new Resultado("CDB", cdb, cdb_tempo, cdb_total)
            if (cdb) {
                taxas.push(res_cdb)
            }

            const poupanca_response = await axios.get(POUPANCA_URL);
            const poupanca = parseFloat(poupanca_response.data[0].valor)*12
            const poupanca_tempo = calcularTempoParaAtingirValorFinal(parseFloat(inicial), parseFloat(final), parseFloat(mensal), parseFloat(poupanca))
            const poupanca_total = calcularValorFinal(parseFloat(inicial), parseInt(poupanca_tempo), parseFloat(mensal), parseFloat(poupanca))
            console.log("poupanca", poupanca, poupanca_tempo, poupanca_total)
            const res_poupanca = new Resultado("Poupança", poupanca, poupanca_tempo, poupanca_total)
            if (poupanca) {
                taxas.push(res_poupanca)
            }

            if (taxas.length === 0){
                res.send("Houve um durante o cálculo das opções de investimentos!");
            }

            taxas.sort((objeto1, objeto2) => {
                if (objeto1.n_aportes < objeto2.n_aportes) {
                    return -1;
                } else if (objeto1.n_aportes > objeto2.n_aportes) {
                    return 1;
                } else {
                    return 0;
                }
            });

            const in_time = taxas.filter((elemento) => elemento.taxa_anual > taxa_anual_necessaria);
            const not_in_time = taxas.filter((elemento) => elemento.taxa_anual < taxa_anual_necessaria);
            res.send({
                investido: investido,
                diferenca: diferenca,
                taxa: taxa_anual_necessaria,
                in_time: in_time,
                not_in_time: not_in_time
            });
            
        }catch(error){
            res.send("Houve um durante o cálculo das opções de investimentos!");
        }
    }

}
