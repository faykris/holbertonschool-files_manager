import express from "express";
import appController from '../controllers/AppController'
import usersController from '../controllers/UsersController';

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
    console.log(response);
    if (response['error']) res.status(400);
    else res.status(201);

    res.json(response);
  })();
});

export default app;
