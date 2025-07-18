rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Suas regras existentes para categoria
    match /categoria/{docId} {
      allow read: if true;
      allow write: if false; // Mantendo como você configurou
    }

    // Suas regras existentes para metodo
    match /metodo/{docId} {
      allow read: if true;
      allow write: if false; // Mantendo como você configurou
    }

    // Novas regras para a coleção de transações
    match /transacao/{transactionId} {
      // ATENÇÃO: Esta é uma regra para DESENVOLVIMENTO.
      // Ela permite que qualquer um leia e escreva transações.
      // Para um ambiente de produção, esta regra PRECISA ser alterada
      // para garantir a segurança dos dados, por exemplo, usando autenticação:
      // allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow read, write: if true; 
    }
  }
}