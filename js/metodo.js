import { db } from "./firebase.js";
export class Metodo {
  constructor(nome, dataFatura, tipo) {
    this.nome = nome;
    this.dataFatura = dataFatura;
    this.tipo = tipo; // 'entrada' ou 'saída'
  }
}
