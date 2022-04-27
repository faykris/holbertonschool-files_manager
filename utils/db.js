import { MongoClient } from 'mongodb';

const dbClient = class DBClient {

  isConnected = false;

  constructor() {
    this.host = process.env['DB_HOST'] || '127.0.0.1';
    this.port = process.env['DB_PORT'] || '27017';
    this.database = process.env['DB_DATABASE'] || 'files_manager';
    this.uri = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(this.uri, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.isConnected = true;
      })
      .catch((err) => {
        console.error(err);
        this.isConnected = false;
      });
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    const db = this.client.db(this.database);
    const collection = db.collection('users');

    return await collection.estimatedDocumentCount();
  }

  async nbFiles() {
    const db = await this.client.db(this.database);
    const collection = await db.collection('files');

    return await collection.estimatedDocumentCount();
  }
}

export default new dbClient();
