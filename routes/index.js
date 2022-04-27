import express from 'express';
import appController from '../controllers/AppController'
import usersController from '../controllers/UsersController';
import authController  from '../controllers/AuthController';

const app = express();
app.use(express.json());

app.get('/status',(req, res) => {
  res.json(appController.getStatus());
});

app.get('/stats',(req, res) => {
  res.json(appController.getStats());
});

app.post('/users',(req, res) => {
  (async () => {
    const response = await usersController.postNew(req.body.email, req.body.password);

    if (response['error']) res.status(400);
    else res.status(201);

    res.json(response);
  })();
});

app.get('/connect',(req, res) => {
  (async () => {
    if (req.headers.authorization) {
      const response = await authController.getConnect(req.headers.authorization);
      if (response['error']) res.status(401);
      else res.status(200).set('X-Token', response.token);
      res.json(response);
    } else {
      res.status(401).json({ error : 'Unauthorized' });
    }
  })();
});

app.get('/disconnect',(req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      //console.log(req.headers['x-token']);
      const response = await authController.getDisconnect(req.headers['x-token']);
      if (response['error']) res.status(401).json(response);
      else res.status(204).send('');
    } else {
      res.status(401).json({ error : 'Unauthorized' });
    }
  })();

});

app.get('/users/me',(req, res) => {
  (async () => {
    if (req.headers['x-token']) {
      const response = await usersController.getMe(req.headers['x-token']);

      if (response['error']) res.status(401).json(response);
      else res.status(200).json(response);
    } else {
      res.status(401).json({ error : 'Unauthorized' });
    }
  })()
});

export default app;
