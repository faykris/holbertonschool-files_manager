import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises } from 'fs';
import mime from 'mime-types';
import usersController from './UsersController';
import dbClient from '../utils/db';

const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
const types = ['folder', 'file', 'image'];

const FilesController = class FilesController {
  static async postUpload(token, body) {
    const user = await usersController.getMe(token);
    const userId = user ? user.id : undefined;
    const { name } = body;
    const { type } = body;
    const isPublic = typeof body.isPublic === 'boolean' ? body.isPublic : false;
    const parentIdBody = body.parentId || '0';
    const data = body.data ? Buffer.from(body.data, 'base64').toString('utf-8') : undefined;
    const fileName = uuidv4();
    const localPath = `${folderPath}/${fileName}`;
    const db = await dbClient.client.db(dbClient.database);
    const collection = await db.collection('files');

    let parent;
    try {
      parent = parentIdBody !== '0' ? await collection.findOne({ _id: ObjectId(parentIdBody) }) : undefined;
    } catch (e) { parent = null; }
    const parentId = parent ? parent._id : '0';

    if (!user.error) {
      if (name) {
        if (type && types.includes(type)) {
          if (data && (type === types[1] || type === types[2])) {
            if (parentIdBody !== '0') {
              if (parent !== null) {
                if (parent.type === 'folder') {
                  try {
                    await promises.mkdir(folderPath, { recursive: true });
                    await promises.writeFile(localPath, data);
                  } catch (e) {
                    return { error: 'Invalid base64 decode' };
                  }
                  const file = await collection.insertOne({
                    userId, name, type, parentId, isPublic, localPath,
                  });
                  return {
                    id: file.insertedId, userId, name, type, isPublic, parentId: parentIdBody,
                  };
                } return { error: 'Parent is not a folder' };
              } return { error: 'Parent not found' };
            }
            try {
              await promises.mkdir(folderPath, { recursive: true });
              await promises.writeFile(localPath, data);
            } catch (e) {
              return { error: 'Invalid base64 decode' };
            }
            const file = await collection.insertOne({
              userId, name, type, parentId, isPublic, localPath,
            });
            return {
              id: file.insertedId, userId, name, type, isPublic, parentId: 0,
            };
          } if (type === types[0]) {
            if (parentIdBody !== '0' && parent === null) {
              return { error: 'Parent not found' };
            }
            if (parent && parent.type !== 'folder') {
              return { error: 'Parent is not a folder' };
            }
            const file = await collection.insertOne({
              userId, name, type, isPublic, parentId, // add again isPublic field for folder type
            });
            return {
              id: file.insertedId, userId, name, type, isPublic, parentId: parentId !== '0' ? parentId : 0,
            };
          } return { error: 'Missing data' };
        } return { error: 'Missing type' };
      } return { error: 'Missing name' };
    } return { error: 'Unauthorized' };
  }

  static async getShow(token, id) {
    const user = await usersController.getMe(token);
    const userId = user ? user.id : undefined;
    const db = await dbClient.client.db(dbClient.database);
    const collection = await db.collection('files');
    if (!user.error) {
      try {
        const file = await collection.findOne({
          _id: ObjectId(id), userId: ObjectId(userId),
        });
        const parentId = file.parentId !== '0' ? file.parentId : 0;
        return {
          id: file._id, userId, name: file.name, type: file.type, isPublic: file.isPublic, parentId,
        };
      } catch (e) {
        return { error: 'Not found' };
      }
    } return { error: 'Unauthorized' };
  }

  static async getIndex(token, query) {
    const user = await usersController.getMe(token);
    const userId = user ? user.id : undefined;
    const db = await dbClient.client.db(dbClient.database);
    const collection = await db.collection('files');
    const page = query.page && !Number.isNaN(Number(query.page)) ? Number(query.page) : 0;
    const pageSize = 20;

    if (!user.error) {
      let filesList;
      try {
        if (query.parentId) {
          filesList = await collection.aggregate([
            {
              $match: {
                parentId: ObjectId(query.parentId), userId: ObjectId(userId),
              },
            }, { $skip: page * pageSize }, { $limit: pageSize },
          ]);
        } else {
          filesList = await collection.aggregate([
            {
              $match: {
                userId: ObjectId(userId),
              },
            }, { $skip: page * pageSize }, { $limit: pageSize },
          ]);
        }
        if (filesList) {
          const newList = [];
          await filesList.forEach((file) => {
            newList.push({
              id: file._id,
              userId,
              name: file.name,
              type: file.type,
              isPublic: file.isPublic,
              parentId: file.parentId,
            });
          });
          return newList;
        } return [];
      } catch (e) {
        return [];
      }
    } return { error: 'Unauthorized' };
  }

  static async putPublish(token, id) {
    const user = await usersController.getMe(token);
    const userId = user ? user.id : undefined;
    const file = this.getShow(token, id);
    const db = await dbClient.client.db(dbClient.database);
    const collection = await db.collection('files');

    if (!user.error) {
      if (!file.error) {
        await collection.updateOne({
          _id: ObjectId(id), userId,
        }, {
          $set: { isPublic: true },
        });
        return this.getShow(token, id);
      } return { error: file.error };
    } return { error: user.error };
  }

  static async putUnpublish(token, id) {
    const user = await usersController.getMe(token);
    const userId = user ? user.id : undefined;
    const file = this.getShow(token, id);
    const db = await dbClient.client.db(dbClient.database);
    const collection = await db.collection('files');

    if (!user.error) {
      if (!file.error) {
        await collection.updateOne({
          _id: ObjectId(id), userId,
        }, {
          $set: { isPublic: false },
        });
        return this.getShow(token, id);
      } return { error: file.error };
    } return { error: user.error };
  }

  static async getFile(token, id, response) {
    const user = await usersController.getMe(token);
    const userId = user ? user.id : undefined;
    const db = await dbClient.client.db(dbClient.database);
    const collection = await db.collection('files');

    try {
      let file;
      if (!user.error) {
        file = await collection.findOne({
          _id: ObjectId(id), userId: ObjectId(userId),
        });
      } else {
        file = await collection.findOne({
          _id: ObjectId(id),
        });
      }
      if (file) {
        if (file.type !== types[0]) {
          if ((file.isPublic === false && file.userId.toString() === userId.toString())
          || file.isPublic === true) {
            let data;
            try {
              data = await promises.readFile(file.localPath);
              data = data.toString();
              const mimeType = mime.contentType(file.name);
              response.setHeader('Content-Type', mimeType);
              return data;
            } catch (err) {
              return { error: 'Not found' };
            }
          } return { error: 'Not found' };
        } return { error: 'A folder doesn\'t have content' };
      } return { error: 'Not found' };
    } catch (e) {
      return { error: 'Not found' };
    }
  }
};

export default FilesController;
