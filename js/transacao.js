import { db } from "./firebase.js";
export class Transacao {
  constructor(
    valor,
    gastoFixo,
    descricao,
    data,
    parcelas,
    parcelaAtual,
    tipo,
    idCategoria,
    idMetodo
  ) {
    this.valor = valor; // Número, ex: 1000.00
    this.gastoFixo = gastoFixo; // Booleano, indica se é um gasto fixo
    this.descricao = descricao; // Texto
    this.data = data; // Data (string ou objeto Date)
    this.parcelas = parcelas || 1; // Número total de parcelas (padrão 1)
    this.parcelaAtual = parcelaAtual || 1; // Número da parcela atual (padrão 1)
    this.tipo = tipo; // 'entrada' ou 'saída'
    this.idCategoria = idCategoria; // id da categoria (número)
    this.idMetodo = idMetodo; // id do método (número)
  }
}
