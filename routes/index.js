import express from 'express';
import appController from '../controllers/AppController';
import usersController from '../controllers/UsersController';
import authController from '../controllers/AuthController';
import filesController from '../controllers/FilesController';

const app = express();
app.use(express.json());

const errors = {
  'Missing data': 400,
  'Missing name': 400,
  'Missing type': 400,
  'Parent not found': 400,
  'Parent is not a folder': 400,
  Unauthorized: 401,
};

app.get('/status', (req, res) => {
  res.json(appController.getStatus());
});

app.get('/stats', (req, res) => {
  res.json(appController.getStats());
});

app.post('/users', (req, res) => {
  (async () => {
    const response = await usersController.postNew(req.body.email, req.body.password);

    if (response.error) res.status(400);
    else res.status(201);

    res.json(response);
  })();
});

app.get('/connect', (req, res) => {
  (async () => {
    if (req.headers.authorization) {
      const response = await authController.getConnect(req.headers.authorization);

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
      const response = await authController.getDisconnect(req.headers['x-token']);

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
      const response = await usersController.getMe(req.headers['x-token']);

      if (response.error) res.status(401).json(response);
      else res.status(200).json(response);
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  })();
});

app.post('/files', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const file = await filesController.postUpload(req.headers['x-token'], req.body);

      if (file.error) res.status(errors[file.error]).json(file);
      else if (file.type === 'folder') res.status(201).send('');
      else {
        res.status(201).json(file);
      }
    } else res.status(401).json({ error: 'Unauthorized' });
  })();
});

export default app;
