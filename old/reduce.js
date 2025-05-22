let receitas = [1000, 500, 300];
let despesas = [200, 100, 50];

let totalReceitas = receitas.reduce((soma, valor) => soma + valor, 0);
let totalDespesas = despesas.reduce((soma, valor) => soma + valor, 0);

let saldo = totalReceitas - totalDespesas;

console.log("Total de receitas:", totalReceitas);
console.log("Total de despesas:", totalDespesas);
console.log("Saldo final:", saldo);
