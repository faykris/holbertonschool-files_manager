import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AuthController = class AuthController {
  constructor() {
    this.collection = 'users';
    this.duration = 86400;
    this.auth_text = 'auth_';
  }

  async getConnect(base64Auth) {
    const encoded = base64Auth.split(' ')[1];
    if (encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString();
      const email = decoded.split(':')[0];
      const password = decoded.split(':')[1];
      if (email && password) {
        const sha = crypto.createHash('sha1');
        sha.update(password);
        const hashPass = sha.digest('hex');
        const db = dbClient.client.db(dbClient.database);
        const collection = db.collection(this.collection);
        const findUser = await collection.findOne({ email, password: hashPass });
        if (findUser !== null) {
          const uuidString = uuidv4();
          await redisClient.set(`${this.auth_text}${uuidString}`,
            findUser._id.toString(),
            this.duration);
          return { token: uuidString };
        }
      }
    }
    return { error: 'Unauthorized' };
  }

  async getDisconnect(token) {
    const authToken = `${this.auth_text}${token}`;
    const userId = await redisClient.get(authToken);

    if (userId !== null) {
      await redisClient.del(authToken);
      return { authToken: userId };
    }
    return { error: 'Unauthorized' };
  }
};

export default new AuthController();
