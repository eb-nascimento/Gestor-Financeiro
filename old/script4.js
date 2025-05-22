// Sistema de Controle Financeiro - Versão com menus de opções para categorias e métodos
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let transacoes = [];
let totalEntrada = 0;
let totalSaida = 0;
let investido = 0;

let metodosPagamento = [];
let categoriasDespesa = [];
let categoriasReceita = [];

function formatarDataDigitada(input) {
  const hoje = new Date();
  const diaAtual = String(hoje.getDate()).padStart(2, "0");
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
  const anoAtual = hoje.getFullYear();

  if (input.trim() === "") {
    return `${diaAtual}/${mesAtual}/${anoAtual}`;
  }

  const partes = input.split("/");
  if (partes.length === 1) {
    return `${partes[0].padStart(2, "0")}/${mesAtual}/${anoAtual}`;
  }
  if (partes.length === 2) {
    return `${partes[0].padStart(2, "0")}/${partes[1].padStart(
      2,
      "0"
    )}/${anoAtual}`;
  }
  if (partes.length === 3) {
    let ano = partes[2];
    if (ano.length === 2) ano = "20" + ano;
    return `${partes[0].padStart(2, "0")}/${partes[1].padStart(2, "0")}/${ano}`;
  }

  return "";
}

function menuPrincipal() {
  console.log("\n=== MENU PRINCIPAL ===");
  console.log("[1] Adicionar métodos de pagamento");
  console.log("[2] Adicionar categorias de despesa");
  console.log("[3] Adicionar categorias de receita");
  console.log("[4] Inserir transação");
  console.log("[5] Finalizar e exibir relatório");

  rl.question("Escolha uma opção: ", (opcao) => {
    switch (opcao) {
      case "1":
        adicionarMetodo();
        break;
      case "2":
        adicionarCategoria("despesa");
        break;
      case "3":
        adicionarCategoria("receita");
        break;
      case "4":
        perguntarTransacao();
        break;
      case "5":
        finalizar();
        break;
      default:
        console.log("Opção inválida. Tente novamente.");
        menuPrincipal();
    }
  });
}

function adicionarMetodo() {
  rl.question("Digite o nome do novo método de pagamento: ", (nome) => {
    if (nome.trim()) metodosPagamento.push(nome);
    console.log("Método adicionado!");
    menuPrincipal();
  });
}

function adicionarCategoria(tipo) {
  rl.question(`Digite o nome da nova categoria de ${tipo}: `, (nome) => {
    if (nome.trim()) {
      if (tipo === "despesa") categoriasDespesa.push(nome);
      else if (tipo === "receita") categoriasReceita.push(nome);
    }
    console.log("Categoria adicionada!");
    menuPrincipal();
  });
}

function perguntarTransacao() {
  let transacao = {};

  rl.question("Tipo (receita ou despesa): ", (tipo) => {
    transacao.tipo = tipo.toLowerCase();

    if (transacao.tipo === "receita") {
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, "0");
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      const ano = hoje.getFullYear();
      transacao.data = `${dia}/${mes}/${ano}`;
      transacao.descricao = "-";
      transacao.metodo = "-";

      perguntarValorECategoria(transacao);
    } else if (transacao.tipo === "despesa") {
      rl.question("Data (dd/mm/yyyy) [ENTER para hoje]: ", (data) => {
        transacao.data = formatarDataDigitada(data);

        rl.question("Descrição: ", (descricao) => {
          transacao.descricao = descricao || "-";

          exibirOpcoes("Forma de pagamento", metodosPagamento, (metodo) => {
            transacao.metodo = metodo;
            perguntarValorECategoria(transacao);
          });
        });
      });
    } else {
      console.log('Tipo inválido. Use "receita" ou "despesa".');
      menuPrincipal();
    }
  });
}

function perguntarValorECategoria(transacao) {
  rl.question("Valor: ", (valor) => {
    const numero = parseFloat(valor);
    if (isNaN(numero)) {
      console.log("Valor inválido.");
      return perguntarValorECategoria(transacao);
    }
    transacao.valor = numero;

    const categorias =
      transacao.tipo === "receita" ? categoriasReceita : categoriasDespesa;
    exibirOpcoes("Categoria", categorias, (categoria) => {
      transacao.categoria = categoria;
      transacoes.push(transacao);

      if (transacao.tipo === "receita") {
        totalEntrada += numero;
        if (categoria.toLowerCase() === "investimento") investido += numero;
      } else {
        totalSaida += numero;
      }

      menuPrincipal();
    });
  });
}

function exibirOpcoes(titulo, lista, callback) {
  if (lista.length === 0) {
    console.log(`Nenhuma ${titulo.toLowerCase()} cadastrada.`);
    return menuPrincipal();
  }

  console.log(`\n${titulo}s disponíveis:`);
  lista.forEach((item, index) => {
    console.log(`[${index + 1}] ${item}`);
  });

  rl.question(`Escolha o número da ${titulo.toLowerCase()}: `, (num) => {
    const indice = parseInt(num) - 1;
    if (indice >= 0 && indice < lista.length) {
      callback(lista[indice]);
    } else {
      console.log("Opção inválida.");
      exibirOpcoes(titulo, lista, callback);
    }
  });
}

function finalizar() {
  const saldo = totalEntrada - totalSaida;

  console.log("\n=== RESUMO FINANCEIRO ===");
  console.log(`Total de receitas: R$ ${totalEntrada.toFixed(2)}`);
  console.log(`Total de despesas: R$ ${totalSaida.toFixed(2)}`);
  console.log(`Saldo: R$ ${saldo.toFixed(2)}`);
  console.log(`Investido: R$ ${investido.toFixed(2)}`);

  rl.close();
}

menuPrincipal();
