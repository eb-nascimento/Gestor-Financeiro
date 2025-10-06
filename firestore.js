{
  "indexes": [
    {
      "collectionGroup": "categoria",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tipo", "order": "ASCENDING" },
        { "fieldPath": "nome", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "transacao",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orcamentos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "mes", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "transacao",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "idParcelamento", "order": "ASCENDING" }
      ]
    }
  ]
}