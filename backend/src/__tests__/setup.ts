import mongoose from 'mongoose';

// Setup for tests
beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdzanning-test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up database and close connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  // Clean up after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

