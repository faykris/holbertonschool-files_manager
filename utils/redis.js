import redis from 'redis';
import { promisify } from 'util';

const RedisClient = class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.GET_ASYNC = promisify(this.client.get).bind(this.client);
    this.SET_ASYNC = promisify(this.client.set).bind(this.client);
    this.DEL_ASYNC = promisify(this.client.del).bind(this.client);
    this.EXP_ASYNC = promisify(this.client.expire).bind(this.client);
    this.client.on('error', (err) => {
      this.connection = false;
      console.log(err);
    })
      .on('connect', () => {
        this.connection = true;
      });
  }

  isAlive() {
    return this.connection;
  }

  async get(key) {
    return this.GET_ASYNC(key);
  }

  async set(key, value, duration) {
    await this.SET_ASYNC(key, value);
    await this.EXP_ASYNC(key, duration);
    return value;
  }

  async del(key) {
    await this.DEL_ASYNC(key);
  }
};

export default new RedisClient();
