import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const AppController = class AppController {
  constructor() {
    this.connection = { redis: false, db: false };
    (async () => {
      this.users = await dbClient.nbUsers();
      this.files = await dbClient.nbFiles();
    })();
  }

  getStatus() {
    this.connection.redis = redisClient.isAlive();
    this.connection.db = dbClient.isAlive();
    return this.connection;
  }

  getStats() {
    return { users: this.users, files: this.files };
  }
};

export default new AppController();
