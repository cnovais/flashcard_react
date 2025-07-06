const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'flashcard_db';

async function checkUsers() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Buscar todos os usuários
    const users = await usersCollection.find({}).toArray();
    
    console.log(`Total de usuários: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\nUsuário ${index + 1}:`);
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Nome:', user.name);
      console.log('Tem senha:', !!user.password);
      console.log('Provider:', user.provider);
      console.log('Plan:', user.plan);
      console.log('XP:', user.xp);
      console.log('Level:', user.level);
      console.log('Streak:', user.streak);
      console.log('Criado em:', user.createdAt);
      console.log('Atualizado em:', user.updatedAt);
    });
    
  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
  } finally {
    await client.close();
  }
}

checkUsers(); 