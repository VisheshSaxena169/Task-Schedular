const redis = require('redis');

// Because of our port mapping in docker-compose, 
// Node.js can connect directly to localhost:6379
const redisClient = redis.createClient({
    url: 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Docker Redis successfully!'));

// Initialize connection
redisClient.connect().catch(console.error);

module.exports = redisClient;