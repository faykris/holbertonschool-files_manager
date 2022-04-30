import { MongoClient } from 'mongodb';

const DBClient = class DBClient {
  constructor() {
    this.isConnected = false;
    this.host = process.env.DB_HOST || '127.0.0.1';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.uri = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(this.uri, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.isConnected = true;
      })
      .catch((err) => {
        this.isConnected = false;
        console.error(err);
      });
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    const db = this.client.db(this.database);
    const collection = db.collection('users');

    return collection.estimatedDocumentCount();
  }

  async nbFiles() {
    const db = await this.client.db(this.database);
    const collection = await db.collection('files');

    return collection.estimatedDocumentCount();
  }
};

export default new DBClient();
