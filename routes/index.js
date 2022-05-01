import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
/*
import FilesController from '../controllers/FilesController';

const errors = {
  'Missing data': 400,
  'Missing name': 400,
  'Missing type': 400,
  'Parent not found': 400,
  'Parent is not a folder': 400,
  Unauthorized: 401,
};
*/
const app = express();
app.use(express.json());

app.get('/status', (req, res) => {
  res.status(200).json(AppController.getStatus());
});

app.get('/stats', (req, res) => {
  (async () => {
    res.status(200).json(await AppController.getStats());
  })();
});

app.post('/users', (req, res) => {
  (async () => {
    const response = await UsersController.postNew(req.body.email, req.body.password);

    if (response.error) res.status(400);
    else res.status(201);

    res.json(response);
  })();
});

app.get('/connect', (req, res) => {
  (async () => {
    if (req.headers.authorization) {
      const response = await AuthController.getConnect(req.headers.authorization);

      if (response.error) res.status(401);
      else res.status(200).set('X-Token', response.token);
      res.json(response);
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  })();
});

app.get('/disconnect', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const response = await AuthController.getDisconnect(req.headers['x-token']);

      if (response.error) res.status(401).json(response);
      else res.status(204).send('');
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  })();
});

app.get('/users/me', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const response = await UsersController.getMe(req.headers['x-token']);

      if (response.error) res.status(401).json(response);
      else res.status(200).json(response);
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  })();
});
/*
app.post('/files', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const file = await FilesController.postUpload(req.headers['x-token'], req.body);

      if (file.error) res.status(errors[file.error]).json(file);
      else if (file.type === 'folder') res.status(201).send('');
      else {
        res.status(201).json(file);
      }
    } else res.status(401).json({ error: 'Unauthorized' });
  })();
});
*/
export default app;
