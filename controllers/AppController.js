import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const AppController = class AppController {
  static getStatus() {
    return {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
  }

  static async getStats() {
    return {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
  }
};

export default AppController;
