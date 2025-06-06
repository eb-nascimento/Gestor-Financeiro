// Imports das suas classes locais
import { Metodo } from "./metodo.js";
import { Categoria } from "./categoria.js";
import { Transacao } from "./transacao.js";

// Import da instância 'db' do seu arquivo firebase.js
import { db } from "./firebase.js";

// Imports de funções específicas do Firestore SDK que você usará no script.js
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc, // << VERIFIQUE SE ESTÁ AQUI
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// BOTÃO ENTRADA/SAÍDA------------------------------------------------------------------------

// Função para carregar e popular as categorias e metodos no dropdown
async function carregarCategorias(tipoFiltro = null) {
  // Adicionado tipoFiltro como parâmetro
  console.log(
    `1. Função carregarCategorias iniciada. Filtro de tipo: ${tipoFiltro}`
  );
  const categoriaSelect = document.getElementById("categoria");
  console.log("2. Elemento select 'categoria':", categoriaSelect);

  if (!categoriaSelect) {
    console.error(
      "ERRO: Elemento select com id 'categoria' não foi encontrado!"
    );
    return;
  }

  categoriaSelect.innerHTML =
    '<option value="">Selecione uma categoria</option>';

  try {
    let consultaFB; // Variável para armazenar a consulta do Firebase
    const baseCollection = collection(db, "categoria");
    if (tipoFiltro) {
      // Assume que o campo 'tipo' no Firestore está padronizado (ex: "saida", "entrada")
      console.log(
        `3. Aplicando filtro ao carregar categorias: where("tipo", "==", "${tipoFiltro}")`
      );
      consultaFB = query(
        baseCollection,
        where("tipo", "==", tipoFiltro),
        orderBy("nome")
      );
    } else {
      console.log("3. Buscando todas as categorias (sem filtro de tipo).");
      consultaFB = query(baseCollection, orderBy("nome")); // Carrega todas, mas ordenadas
    }

    const querySnapshot = await getDocs(consultaFB);
    console.log("4. Snapshot da query recebido:", querySnapshot);
    console.log(
      `5. Número de documentos na coleção 'categoria' (filtro: ${
        tipoFiltro || "nenhum"
      }):`,
      querySnapshot.size
    );

    if (querySnapshot.empty) {
      console.warn(
        `Atenção: Nenhum documento encontrado na coleção 'categoria' para o tipo '${
          tipoFiltro || "todos"
        }'.`
      );
    }

    querySnapshot.forEach((doc) => {
      const categoriaData = doc.data();
      console.log("6. Processando documento:", doc.id, categoriaData);
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = categoriaData.nome;
      categoriaSelect.appendChild(option);
    });
    console.log("7. População do dropdown de categorias concluída.");
  } catch (error) {
    console.error("ERRO DETALHADO ao carregar categorias:", error);
    alert(
      "Ocorreu um erro ao carregar as categorias. Verifique o console para mais detalhes."
    );
  }
}

async function carregarMetodos() {
  console.log("1.1 Função carregarMetodos iniciada."); // Usando prefixo diferente para logs
  const metodoSelect = document.getElementById("metodo");
  console.log("2.1 Elemento select 'metodo':", metodoSelect);

  if (!metodoSelect) {
    console.error("ERRO: Elemento select com id 'metodo' não foi encontrado!");
    return;
  }

  // Limpa as opções existentes e adiciona a opção padrão
  metodoSelect.innerHTML = '<option value="">Selecione um método</option>';

  try {
    console.log(
      "3.1 Tentando buscar dados da coleção 'metodo' no Firestore..."
    );
    // Busca da coleção 'metodo' (singular), conforme sua imagem
    const consultaFB = query(collection(db, "metodo"), orderBy("nome"));
    const querySnapshot = await getDocs(consultaFB);
    console.log("4.1 Snapshot da query de métodos recebido:", querySnapshot);
    console.log(
      "5.1 Número de documentos na coleção 'metodo':",
      querySnapshot.size
    );

    if (querySnapshot.empty) {
      console.warn(
        "Atenção: Nenhum documento encontrado na coleção 'metodo'. O dropdown ficará vazio exceto pela opção padrão."
      );
    }

    querySnapshot.forEach((doc) => {
      const metodoData = doc.data();
      console.log("6.1 Processando método:", doc.id, metodoData); // Log para cada método
      const option = document.createElement("option");
      option.value = doc.id; // O valor da opção será o ID do documento no Firestore
      option.textContent = metodoData.nome; // O texto visível será o nome do método
      metodoSelect.appendChild(option);
    });
    console.log(
      "7.1 População do dropdown de métodos concluída (se houveram documentos)."
    );
  } catch (error) {
    console.error("ERRO DETALHADO ao carregar métodos:", error);
    alert(
      "Ocorreu um erro ao carregar os métodos. Verifique o console para mais detalhes."
    );
  }
}

// E não se esqueça de chamar a nova função dentro do seu listener DOMContentLoaded:
window.addEventListener("DOMContentLoaded", () => {
  console.log("A. Evento DOMContentLoaded disparado.");

  // 1. Preencher a data (uma vez)
  const inputDataHoje = document.getElementById("data");
  if (inputDataHoje && !inputDataHoje.value) {
    const hoje = new Date();
    const dataFormatada = hoje.toISOString().split("T")[0];
    inputDataHoje.value = dataFormatada;
  }

  // 2. Carregar dropdowns com filtro inicial para "Saída"
  carregarCategorias("saida"); // MODIFICADO: Chama com filtro "saida"
  carregarMetodos();
});

//BOTÃO ENTRADA/SAÍDA------------------------------------------------------------------------
const btSaida = document.getElementById("btSaida");
const label = document.getElementById("gastoFixoLabel");
const btEntrada = document.getElementById("btEntrada");
const metodoInput = document.getElementById("metodo");
const descricaoInput = document.getElementById("descricao");

let tipoMovimentacao = "Saída";
// Ao carregar a página, preencher o campo data com a data de hoje
const inputData = document.getElementById("data");
const hoje = new Date();
const dataFormatada = hoje.toISOString().split("T")[0]; // Formato YYYY-MM-DD
inputData.value = dataFormatada;
// Preencher o campo data com a data de hoje
window.addEventListener("DOMContentLoaded", () => {
  const inputData = document.getElementById("data");
  const hoje = new Date();
  const dataFormatada = hoje.toISOString().split("T")[0];
  inputData.value = dataFormatada;
});
const valorInput = document.getElementById("valor");

valorInput.addEventListener("input", (e) => {
  let numeros = e.target.value.replace(/\D/g, ""); // Só dígitos

  if (numeros === "") {
    e.target.value = "";
    return;
  }

  // Limite de 9 dígitos para evitar valores absurdos (até 9.999.999,99)
  if (numeros.length > 9) numeros = numeros.slice(0, 9);

  // Converte centavos → reais mantendo as casas decimais
  const valorNumero = parseFloat(numeros) / 100;

  // Formata como moeda brasileira
  const valorFormatado = valorNumero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Atualiza o campo
  e.target.value = valorFormatado;

  // Coloca o cursor no fim
  const len = e.target.value.length;
  valorInput.setSelectionRange(len, len);
});

// Inicialmente, o botão de saída está ativo
btSaida.classList.add("active"); //BOTÃO ATIVO

btSaida.addEventListener("click", function () {
  tipoMovimentacao = "Saída";
  btSaida.classList.add("active");
  btEntrada.classList.remove("active");

  carregarCategorias("saida"); // MODIFICADO: Chama com filtro "saida"

  metodoInput.classList.remove("hidden");
  descricaoInput.classList.remove("hidden");
  label.classList.remove("hidden");
  const categoriaSelect = document.getElementById("categoria");
  if (categoriaSelect) {
    categoriaSelect.classList.remove("margem");
  }
  console.log(tipoMovimentacao);
});

btEntrada.addEventListener("click", function () {
  tipoMovimentacao = "Entrada";
  btEntrada.classList.add("active");
  btSaida.classList.remove("active");

  carregarCategorias("entrada"); // SUGESTÃO: Chama com filtro "entrada" (confirme se é isso)

  metodoInput.classList.add("hidden"); // Método oculto para Entrada (conforme sua última decisão)
  descricaoInput.classList.add("hidden");
  label.classList.add("hidden");
  const categoriaSelect = document.getElementById("categoria");
  if (categoriaSelect) {
    categoriaSelect.classList.add("margem");
  }
  console.log(tipoMovimentacao);
});

//BOTÃO SALVAR-------------------------------------------------------------------------------
const form = document.getElementById("campos");

form.addEventListener("submit", async function (event) {
  // << ADICIONE 'async' AQUI
  event.preventDefault(); // Impede o recarregamento do formulário
  let valorBruto = document.getElementById("valor").value;
  let valor = parseFloat(
    valorBruto
      .replace("R$", "") // remove o símbolo de moeda
      .replace(/\./g, "") // remove todos os pontos (milhar)
      .replace(",", ".") // troca vírgula decimal por ponto
      .trim()
  );
  if (isNaN(valor) || valor <= 0) {
    alert("Digite um valor numérico válido!");
    return;
  }
  const checkbox = document.getElementById("gastoFixo");
  const gastoFixo = checkbox.checked;
  const descricao = document.getElementById("descricao").value;
  const data = document.getElementById("data").value;
  // Verifica se o valor é uma data válida
  const regexData = /^\d{4}-\d{2}-\d{2}$/;
  if (!regexData.test(data)) {
    alert("Data inválida! Use o formato DD-MM-AAAA.");
    return;
  }
  const categoria = document.getElementById("categoria").value;
  const metodo = document.getElementById("metodo").value;
  const corpoTabela = document.getElementById("tabelaMovimentacoes");
  const novaLinha = document.createElement("tr");
  const classeValor =
    tipoMovimentacao === "Entrada" ? "valorEntrada" : "valorSaida";

  if (tipoMovimentacao === "Saída") {
    if (!metodo || !descricao) {
      alert("Preencha todos os campos!");
      return;
    }
  }

  if (!data || !valor || !categoria) {
    alert("Preencha todos os campos!");
    return;
  }

  console.log("Dados validados. Preparando para salvar:", {
    valor,
    gastoFixo,
    descricao,
    data,
    categoriaId: categoria,
    metodoId: metodo,
    tipoMovimentacao,
  });

  //---------------------------------------------------------------------
  //---------------------------------------------------------------------
  //---------------------------------------------------------------------
  //---------------------------------------------------------------------
  //---------------------------------------------------------------------
  //---------------------------------------------------------------------
  //---------------------------------------------------------------------

  const novaTransacao = new Transacao(
    valor,
    tipoMovimentacao === "Saída" ? gastoFixo : false,
    tipoMovimentacao === "Saída" ? descricao : "-",
    data,
    undefined, // parcelas (usará o default 1 da classe Transacao)
    undefined, // parcelaAtual (usará o default 1 da classe Transacao)
    tipoMovimentacao,
    categoria, // << Usando sua variável 'categoria' que contém o ID da categoria
    tipoMovimentacao === "Saída" ? metodo : null // << Usando sua variável 'metodo' que contém o ID do método
  );

  // Convertendo a instância da classe para um objeto simples para o Firestore
  const transacaoParaSalvar = { ...novaTransacao };

  // Opcional: Adicionar um timestamp de quando o registro foi criado
  // transacaoParaSalvar.criadoEm = new Date(); // Data/hora do cliente
  // Ou, para usar a data/hora do servidor Firestore:
  // (você precisaria importar 'serverTimestamp' do Firestore)
  // transacaoParaSalvar.criadoEm = serverTimestamp();

  // 2. TENTAR SALVAR NO FIREBASE
  try {
    console.log("Tentando salvar transação no Firestore:", transacaoParaSalvar);
    // Certifique-se de que sua coleção é 'transacao' (singular)
    const docRef = await addDoc(
      collection(db, "transacao"),
      transacaoParaSalvar
    );
    console.log("Transação salva com ID no Firestore: ", docRef.id);
    alert("Transação salva com sucesso!");

    // 3. SE O SALVAMENTO NO FIREBASE FOI BEM-SUCEDIDO, ATUALIZE A INTERFACE LOCAL
    //    MOVA O SEU CÓDIGO EXISTENTE PARA ADICIONAR À TABELA VISUAL E LIMPAR O FORMULÁRIO PARA DENTRO DESTE BLOCO 'TRY', AQUI.
    //    Seu código original (que vem DEPOIS deste bloco que estou te passando)
    //    para 'console.log(valor, gastoFixo, ...)', 'form.reset()',
    //    'novaLinha.innerHTML = ...', 'corpoTabela.appendChild(novaLinha)'
    //    DEVE SER MOVIDO PARA CÁ.

    // Exemplo de como ficaria com seu código movido para cá:
    console.log("Atualizando tabela visual e resetando formulário.");
    // SEU CÓDIGO PARA CRIAR NOVA LINHA NA TABELA (copie e cole aqui)
    // const corpoTabela = document.getElementById("tabelaMovimentacoes"); // Já definido antes
    // const novaLinha = document.createElement("tr"); // Já definido antes
    // const classeValor = tipoMovimentacao === "Entrada" ? "valorEntrada" : "valorSaida"; // Já definido antes
    const nomeCategoriaParaTabela =
      document.getElementById("categoria").selectedOptions[0]?.textContent ||
      categoria;
    const nomeMetodoParaTabela =
      tipoMovimentacao === "Saída"
        ? document.getElementById("metodo").selectedOptions[0]?.textContent ||
          metodo
        : "-";
    const valorFormatadoParaTabela = valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    novaLinha.innerHTML = `
      <td>${new Date(data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
      <td class="${classeValor}">${valorFormatadoParaTabela}${
      tipoMovimentacao === "Saída" && gastoFixo ? "*" : ""
    }</td>
      <td>${nomeMetodoParaTabela}</td>
      <td>${nomeCategoriaParaTabela}</td>
      <td>${tipoMovimentacao === "Saída" && descricao ? descricao : "-"}</td>
    `;
    corpoTabela.appendChild(novaLinha); // 'corpoTabela' e 'novaLinha' devem estar definidos como no seu código original

    form.reset(); // Limpa o formulário

    // Repõe a data de hoje e o estado padrão do formulário para "Saída"
    document.getElementById("data").value = new Date()
      .toISOString()
      .split("T")[0];
    tipoMovimentacao = "Saída";

    btSaida.classList.add("active");
    btEntrada.classList.remove("active");
    carregarCategorias("saida"); // Atualiza categorias para "saida"
    metodoInput.classList.remove("hidden");
    descricaoInput.classList.remove("hidden");
    // 'label' aqui é o seu 'gastoFixoLabel', que já deve estar definido no escopo externo.
    if (label) label.classList.remove("hidden");

    const categoriaSelectElement = document.getElementById("categoria");
    if (categoriaSelectElement)
      categoriaSelectElement.classList.remove("margem");
  } catch (e) {
    console.error("Erro ao salvar transação no Firestore: ", e);
    alert("Erro ao salvar transação. Verifique o console e tente novamente.");
    // Não fazemos nada na interface visual se deu erro ao salvar.
  }

  // IMPORTANTE: Remova ou comente o seu código original de 'console.log(valor, gastoFixo, ...)',
  // 'form.reset()', e a criação/adição da novaLinha à tabela que estiver FORA
  // e APÓS este bloco try...catch, pois agora essas ações estão DENTRO do 'try'
  // para ocorrerem apenas em caso de sucesso no salvamento.
}); // Este é o fechamento do seu form.addEventListener
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
// Adicionar a nova transação na tabela

//   console.log(valor, gastoFixo, descricao, data, categoria, metodo);
//   //Limpar os campos do formulário
//   form.reset();

//   //CRIAR NOVA LINHA NA TABELA

//   const valorFormatado = valor.toLocaleString("pt-BR", {
//     style: "currency",
//     currency: "BRL",
//   });

//   novaLinha.innerHTML = `
//     <td>${data}</td>
//     <td class="${classeValor}">${valorFormatado}${gastoFixo ? "*" : ""}</td>
//     <td>${tipoMovimentacao === "Saída" ? metodo : "-"}</td>
//     <td>${categoria}</td>
//     <td>${tipoMovimentacao === "Saída" ? descricao : "-"}</td>
//   `;

//   corpoTabela.appendChild(novaLinha);
// });
