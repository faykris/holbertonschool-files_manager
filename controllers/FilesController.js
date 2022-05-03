import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises } from 'fs';
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
                    return { error: 'invalid base64 decode' };
                  }
                  const file = await collection.insertOne({
                    userId, name, type, isPublic, parentId, localPath,
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
              return { error: 'invalid base64 decode' };
            }
            const file = await collection.insertOne({
              userId, name, type, isPublic, parentId, localPath,
            });
            return {
              id: file.insertedId, userId, name, type, isPublic, parentId,
            };
          } if (type === types[0]) {
            if (parentIdBody !== '0' && parent === null) {
              return { error: 'Parent not found' };
            }
            const file = await collection.insertOne({
              userId, name, type, isPublic, parentId,
            });
            return {
              id: file.insertedId, userId, name, type, isPublic, parentId,
            };
          } return { error: 'Missing data' };
        } return { error: 'Missing type' };
      } return { error: 'Missing name' };
    } return { error: 'Unauthorized' };
  }
};

export default FilesController;