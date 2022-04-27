import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import crypto from 'crypto';
import { uuid } from 'uuidv4';

const authController = class AuthController {
  async getConnect(base64Auth) {
    const encoded = base64Auth.split(' ')[1];
    const decoded = new Buffer(encoded,'base64').toString();
    const email = decoded.split(':')[0];
    const password = decoded.split(':')[1];
    const sha = crypto.createHash('sha1');
    sha.update(password);
    const hashPass = sha.digest('hex');

    const db = dbClient.client.db(dbClient.database);
    const collection = db.collection('users');
    const findUser = await collection.findOne({ email: email, password: hashPass });

    if (findUser !== null) {
      const uuidString = uuid();
      await redisClient.set(`auth_${uuidString}`, findUser._id, 86400);

      return { token: uuidString };
    }
    else
      return { error : 'Unauthorized' };
  }

  async getDisconnect(token) {
    const authToken = `auth_${token}`
    const userId = await redisClient.get(authToken);

    if (userId !== null) {
      await redisClient.del(authToken);
      return { authToken : userId }
    } else {
      return { error : 'Unauthorized' };
    }
  }
}

export default new authController;
