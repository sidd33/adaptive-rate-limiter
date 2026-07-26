const redisClient = require('./src/store/redisClient');

async function testConnection() {
  await redisClient.set('test-key', 'hello from node');
  const value = await redisClient.get('test-key');
  console.log('Value from Redis:', value);
  process.exit(0);
}

testConnection();