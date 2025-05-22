const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Objeto que vai armazenar a transação
let transacao = {};

// Etapas de perguntas (em ordem)
const perguntas = [
  { chave: "tipo", texto: "É uma receita ou despesa? " },
  { chave: "data", texto: "Digite a data (formato YYYY-MM-DD): " },
  { chave: "valor", texto: "Digite o valor: " },
  {
    chave: "metodo",
    texto: "Forma de pagamento (dinheiro, cartão, pix, etc): ",
  },
  { chave: "categoria", texto: "Categoria (alimentação, transporte, etc): " },
  { chave: "descricao", texto: "Digite uma descrição: " },
];

let etapaAtual = 0;

// Função para perguntar uma coisa de cada vez
function perguntarProxima() {
  if (etapaAtual < perguntas.length) {
    const perguntaAtual = perguntas[etapaAtual];
    rl.question(perguntaAtual.texto, (resposta) => {
      let chave = perguntaAtual.chave;

      // Se for valor, converte para número
      if (chave === "valor") {
        transacao[chave] = parseFloat(resposta);
        if (isNaN(transacao[chave])) {
          console.log("❌ Valor inválido. Digite um número.");
          return perguntarProxima();
        }
      } else {
        transacao[chave] = resposta;
      }

      etapaAtual++;
      perguntarProxima();
    });
  } else {
    // Finalizou o preenchimento
    console.log("\n✅ Transação registrada com sucesso:");
    console.log(transacao);
    rl.close();
  }
}

// Início
console.log("=== Registro de Receita/Despesa ===");
perguntarProxima();
