
import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

client.on('error', (err) => console.error('Redis Client Error', err));

export default client;
