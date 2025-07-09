const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sarandaos:tracker123@expense-tracker-cluster.y7uowi2.mongodb.net/expense-tracker?retryWrites=true&w=majority&appName=expense-tracker-cluster';

console.log('Testing MongoDB connection...');
console.log('URI:', MONGODB_URI.replace(/tracker123/, '***'));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
  process.exit(1);
}); 