// Script para inicializar configurações admin padrão
// Execute com: node init_admin_config.js

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'flashcard_app';

async function initAdminConfig() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const configCollection = db.collection('admin_config');
    
    // Verificar se já existe configuração
    const existingConfig = await configCollection.findOne({});
    
    if (existingConfig) {
      console.log('Admin config already exists:', existingConfig);
      return;
    }
    
    // Criar configuração padrão
    const defaultConfig = {
      freePlanDeckLimit: 3,
      freePlanCardLimit: 60,
      premiumPlanDeckLimit: -1, // unlimited
      premiumPlanCardLimit: -1, // unlimited
      publicDeckLimit: 2,
      publicCardLimit: 20,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await configCollection.insertOne(defaultConfig);
    console.log('Admin config created with ID:', result.insertedId);
    console.log('Default config:', defaultConfig);
    
  } catch (error) {
    console.error('Error initializing admin config:', error);
  } finally {
    await client.close();
  }
}

initAdminConfig(); 