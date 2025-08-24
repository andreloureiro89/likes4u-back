import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI não definido no .env');
  process.exit(1);
}

mongoose.set('strictQuery', true);

export async function connectDB() {
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    });
    console.log('✅ MongoDB ligado');
  } catch (err) {
    console.error('❌ Erro a ligar MongoDB:', err.message);
    process.exit(1);
  }
}