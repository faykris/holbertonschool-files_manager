import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const errors = {
  'Already exist': 400,
  'Missing data': 400,
  'Missing email': 400,
  'Missing name': 400,
  'Missing password': 400,
  'Missing type': 400,
  'Invalid base64 decode': 400,
  'Parent not found': 400,
  'Parent is not a folder': 400,
  Unauthorized: 401,
  'Not found': 404,
};

const success = {
  ok: 200,
  created: 201,
  no_content: 204,
};

const app = express();
app.use(express.json());

app.get('/status', (req, res) => {
  res.status(success.ok).json(AppController.getStatus());
});

app.get('/stats', (req, res) => {
  (async () => {
    res.status(success.ok).json(await AppController.getStats());
  })();
});

app.post('/users', (req, res) => {
  (async () => {
    const response = await UsersController.postNew(req.body.email, req.body.password);

    if (response.error) res.status(errors[response.error]);
    else res.status(success.created);
    res.json(response);
  })();
});

app.get('/connect', (req, res) => {
  (async () => {
    if (req.headers.authorization) {
      const response = await AuthController.getConnect(req.headers.authorization);

      if (response.error) res.status(errors[response.error]);
      else res.status(200).set('X-Token', response.token);
      res.json(response);
    } else res.status(errors.Unauthorized).json({ error: 'Unauthorized' });
  })();
});

app.get('/disconnect', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const response = await AuthController.getDisconnect(req.headers['x-token']);

      if (response.error) res.status(errors[response.error]).json(response);
      else res.status(success.no_content).send('');
    } else res.status(errors.Unauthorized).json({ error: 'Unauthorized' });
  })();
});

app.get('/users/me', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const response = await UsersController.getMe(req.headers['x-token']);

      if (response.error) res.status(errors[response.error]).json(response);
      else res.status(success.ok).json(response);
    } else res.status(errors.Unauthorized).json({ error: 'Unauthorized' });
  })();
});

app.post('/files', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const file = await FilesController.postUpload(req.headers['x-token'], req.body);

      if (file.error) res.status(errors[file.error]).json(file);
      else res.status(success.created).json(file);
    } else res.status(errors.Unauthorized).json({ error: 'Unauthorized' });
  })();
});

app.get('/files/:id', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const file = await FilesController.getShow(req.headers['x-token'], req.params.id);

      if (file.error) res.status(errors[file.error]).json(file);
      else res.status(success.ok).json(file);
    } else res.status(errors.Unauthorized).json({ error: 'Unauthorized' });
  })();
});

app.get('/files', (req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const file = await FilesController.getIndex(req.headers['x-token'], req.query);

      if (file.error) res.status(errors[file.error]).json(file);
      else res.status(success.ok).json(file);
    } else res.status(errors.Unauthorized).json({ error: 'Unauthorized' });
  })();
});

export default app;
