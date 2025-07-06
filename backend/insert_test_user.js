const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'flashcard_db';

async function insertTestUser() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Verificar se o usuário já existe
    const existingUser = await usersCollection.findOne({ email: 'teste@teste.com' });
    if (existingUser) {
      console.log('Usuário teste@teste.com já existe');
      return;
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Criar usuário de teste
    const testUser = {
      email: 'teste@teste.com',
      name: 'Usuário Teste',
      password: hashedPassword,
      provider: 'email',
      plan: 'free',
      xp: 0,
      level: 1,
      streak: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(testUser);
    console.log('Usuário de teste criado com sucesso:', result.insertedId);
    console.log('Email: teste@teste.com');
    console.log('Senha: 123456');
    
  } catch (error) {
    console.error('Erro ao inserir usuário de teste:', error);
  } finally {
    await client.close();
  }
}

insertTestUser(); 