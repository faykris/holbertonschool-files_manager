import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const ObjectId = require('mongodb').ObjectID;

const UsersController = class UsersController {
  constructor() {
    this.collection = 'users';
  }

  async postNew(email, password) {
    if (!email) return { error: 'Missing email' };
    if (!password) return { error: 'Missing password' };

    const db = await dbClient.client.db(dbClient.database);
    const collection = await db.collection(this.collection);
    const nUsers = await collection.find({ email }).toArray();

    if (nUsers.length > 0) return { error: 'Already exist' };

    const sha = crypto.createHash('sha1');
    sha.update(password);
    const hashPass = sha.digest('hex');
    const result = await collection.insertOne({ email, password: hashPass });

    return { id: result.insertedId, email };
  }

  async getMe(token) {
    const authToken = `auth_${token}`;
    const userId = await redisClient.get(authToken);

    if (userId !== null) {
      const db = await dbClient.client.db(dbClient.database);
      const collection = await db.collection(this.collection);
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (user !== null) {
        return { id: user._id, email: user.email };
      }
    }
    return { error: 'Unauthorized' };
  }
};

export default new UsersController();
