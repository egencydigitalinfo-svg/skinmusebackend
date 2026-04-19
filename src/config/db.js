import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://syedumerhassni:naibtana123@cluster0.8kun6ji.mongodb.net/beauty_store_testing?retryWrites=true&w=majority&appName=Cluster0", {
      dbName: 'beauty_store_testing',
    });
    console.log('✅ MongoDB Connected');
    console.log("Mongo URI:", process.env.MONGODB_URI);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
