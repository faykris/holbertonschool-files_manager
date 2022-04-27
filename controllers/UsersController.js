import dbClient from '../utils/db';
import crypto from 'crypto';

const usersController = class UsersController {
  async postNew(email, password) {
    if (!email) return {error: 'Missing email'};
    if (!password) return {error: 'Missing password'};

    const db = await dbClient.client.db(dbClient.database);
    const collection = await db.collection('users');
    const nUsers = await collection.find({email: email}).toArray();

    if (nUsers.length > 0) return {error: 'Already exist'};

    const shasum = crypto.createHash('sha1');
    shasum.update(password);
    const hashPass = shasum.digest('hex');
    const result = await collection.insertOne({email: email, password: hashPass});

    return { id: result.insertedId, email: email };
  }

}

export default new usersController();
