import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const AppController = class AppController {
  getStatus() {
    return { "redis": redisClient.isAlive(), "db": dbClient.isAlive() };
  }
  getStats() {
    let users = 0;
    let files = 0;

    (async () => {
      users = await dbClient.nbUsers()
      files = await dbClient.nbFiles()
    })();

    return { "users": users, "files": files };
  }
}

export default new AppController();
