let receitas = [1000, 500, 300];
let totalReceitas = 0;
let despesas = [200, 100, 50];
let totalDespesas = 0;

for (let i = 0; i < receitas.length; i++) {
  totalReceitas = totalReceitas + receitas[i];
}

for (let i = 0; i < despesas.length; i++) {
  totalDespesas = totalDespesas + despesas[i];
}

console.log("Total de receitas:", totalReceitas);
console.log("Total de despesas:", totalDespesas);
console.log("Saldo final:", totalReceitas - totalDespesas);
