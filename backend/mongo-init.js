// MongoDB initialization script
db = db.getSiblingDB('flashcard_db');

// Create collections with validation
db.createCollection("users", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["email", "name"],
         properties: {
            email: {
               bsonType: "string",
               pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
            },
            name: {
               bsonType: "string",
               minLength: 1
            }
         }
      }
   }
});

db.createCollection("decks", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["name", "userId"],
         properties: {
            name: {
               bsonType: "string",
               minLength: 1
            },
            userId: {
               bsonType: "string"
            }
         }
      }
   }
});

db.createCollection("cards", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["question", "answer", "deckId"],
         properties: {
            question: {
               bsonType: "string",
               minLength: 1
            },
            answer: {
               bsonType: "string",
               minLength: 1
            },
            deckId: {
               bsonType: "string"
            }
         }
      }
   }
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.decks.createIndex({ "userId": 1 });
db.decks.createIndex({ "isPublic": 1 });
db.cards.createIndex({ "deckId": 1 });
db.cards.createIndex({ "tags": 1 });

// Insert sample data
print("Inserting sample data...");

// Sample user
db.users.insertOne({
   _id: ObjectId(),
   email: "user@example.com",
   name: "Usuário Exemplo",
   plan: "free",
   createdAt: new Date(),
   updatedAt: new Date()
});

// Sample decks
const deck1 = db.decks.insertOne({
   _id: ObjectId(),
   name: "História do Brasil",
   description: "Principais eventos da história brasileira",
   userId: "user@example.com",
   isPublic: true,
   tags: ["história", "brasil"],
   cardCount: 5,
   createdAt: new Date(),
   updatedAt: new Date()
});

const deck2 = db.decks.insertOne({
   _id: ObjectId(),
   name: "Matemática Básica",
   description: "Conceitos fundamentais de matemática",
   userId: "user@example.com",
   isPublic: true,
   tags: ["matemática", "básico"],
   cardCount: 3,
   createdAt: new Date(),
   updatedAt: new Date()
});

const deck3 = db.decks.insertOne({
   _id: ObjectId(),
   name: "Inglês Intermediário",
   description: "Vocabulário e gramática intermediária",
   userId: "user@example.com",
   isPublic: false,
   tags: ["inglês", "idioma"],
   cardCount: 2,
   createdAt: new Date(),
   updatedAt: new Date()
});

// Sample cards for deck 1 (História do Brasil)
db.cards.insertMany([
   {
      _id: ObjectId(),
      question: "Em que ano o Brasil foi descoberto?",
      answer: "1500",
      deckId: deck1.insertedId.toString(),
      tags: ["descoberta", "1500"],
      difficulty: "easy",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      _id: ObjectId(),
      question: "Quem foi o primeiro imperador do Brasil?",
      answer: "Dom Pedro I",
      deckId: deck1.insertedId.toString(),
      tags: ["imperador", "independência"],
      difficulty: "medium",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      _id: ObjectId(),
      question: "Em que ano o Brasil se tornou independente?",
      answer: "1822",
      deckId: deck1.insertedId.toString(),
      tags: ["independência", "1822"],
      difficulty: "easy",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      _id: ObjectId(),
      question: "Qual foi a primeira capital do Brasil?",
      answer: "Salvador",
      deckId: deck1.insertedId.toString(),
      tags: ["capital", "salvador"],
      difficulty: "medium",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      _id: ObjectId(),
      question: "Quem proclamou a República no Brasil?",
      answer: "Marechal Deodoro da Fonseca",
      deckId: deck1.insertedId.toString(),
      tags: ["república", "deodoro"],
      difficulty: "hard",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   }
]);

// Sample cards for deck 2 (Matemática Básica)
db.cards.insertMany([
   {
      _id: ObjectId(),
      question: "Quanto é 2 + 2?",
      answer: "4",
      deckId: deck2.insertedId.toString(),
      tags: ["adição", "básico"],
      difficulty: "easy",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      _id: ObjectId(),
      question: "Quanto é 5 x 6?",
      answer: "30",
      deckId: deck2.insertedId.toString(),
      tags: ["multiplicação", "básico"],
      difficulty: "easy",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      _id: ObjectId(),
      question: "Qual é a raiz quadrada de 16?",
      answer: "4",
      deckId: deck2.insertedId.toString(),
      tags: ["raiz quadrada", "básico"],
      difficulty: "medium",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   }
]);

// Sample cards for deck 3 (Inglês Intermediário)
db.cards.insertMany([
   {
      _id: ObjectId(),
      question: "Como se diz 'bom dia' em inglês?",
      answer: "Good morning",
      deckId: deck3.insertedId.toString(),
      tags: ["saudação", "básico"],
      difficulty: "easy",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      _id: ObjectId(),
      question: "Qual é o passado do verbo 'to go'?",
      answer: "Went",
      deckId: deck3.insertedId.toString(),
      tags: ["verbo", "passado"],
      difficulty: "medium",
      lastReviewed: null,
      nextReview: null,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
   }
]);

print("Sample data inserted successfully!");
print("MongoDB initialization completed successfully!"); 