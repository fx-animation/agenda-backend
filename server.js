// ...existing code...
// server.js
// Serveur Node.js pour envoyer des notifications push avec VAPID

const webpush = require('web-push');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Remplacez ces clés par vos propres clés VAPID
const publicVapidKey = 'BAniZeF2cJeEpgtQSQA5VVc_s2NPvGUN5IlpwHs89fUZAl7Q9BugDyhAV5FlcNJzZJUCz-W9_WOKQhzPOncwHnc';
const privateVapidKey = '6IJbZxzoq0NC_om7-HYeqP07X8_FntPW3o0XK8nCIcA';

webpush.setVapidDetails(
  'mailto:fxstudiocreation@gmail.com',
  publicVapidKey,
  privateVapidKey
);

let subscriptions = [];

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  // Vérifie si l'abonnement existe déjà (par endpoint)
  if (!subscriptions.some(sub => sub.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription);
  }
  res.status(201).json({});
});

app.post('/sendNotification', (req, res) => {
  const { title, message } = req.body;
  const payload = JSON.stringify({ title, message });
  subscriptions.forEach(sub => {
    webpush.sendNotification(sub, payload).catch(err => console.error(err));
  });
  res.status(200).json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
// ...existing code...
