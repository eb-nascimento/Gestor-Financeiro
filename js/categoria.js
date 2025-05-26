import { db } from "./firebase.js";
export class Categoria {
  constructor(nome, tipo) {
    this.nome = nome;
    this.tipo = tipo; // 'entrada' ou 'saída'
  }
}
