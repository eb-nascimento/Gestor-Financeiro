// Importa o módulo 'readline' para permitir leitura de dados do usuário via terminal
const readline = require("readline");

// Cria a interface para entrada e saída no terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Cria um array vazio para armazenar as receitas digitadas
let receitas = [];

// Variável que irá guardar o total das receitas somadas
let totalReceitas = 0;

// Função que pergunta ao usuário os valores das receitas
function perguntarReceita() {
  rl.question('Digite uma receita (ou "fim" para terminar): ', (entrada) => {
    // Se o usuário digitar "fim", encerra o programa e calcula o total
    if (entrada.toLowerCase() === "fim") {
      // Soma todas as receitas usando um laço for
      for (let i = 0; i < receitas.length; i++) {
        totalReceitas += receitas[i];
      }

      // Mostra o total de receitas com duas casas decimais
      console.log(`\nTotal de receitas: R$${totalReceitas.toFixed(2)}`);

      // Fecha a interface readline
      rl.close();
    } else {
      // Tenta converter o valor digitado para número (float)
      let valor = parseFloat(entrada);

      // Verifica se o valor é um número válido
      if (!isNaN(valor)) {
        receitas.push(valor); // Adiciona ao array
        perguntarReceita(); // Pergunta de novo
      } else {
        // Se o valor não for válido, avisa e pergunta de novo
        console.log("Por favor, digite um número válido.");
        perguntarReceita();
      }
    }
  });
}

// Exibe o título e inicia o processo
console.log("=== Calculadora de Receitas ===");
perguntarReceita();
