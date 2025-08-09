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
  console.log('[sendNotification] Nombre d’abonnés :', subscriptions.length);
  if (subscriptions.length === 0) {
    console.warn('[sendNotification] Aucun abonnement push enregistré.');
    return res.status(200).json({ success: false, message: 'Aucun abonnement push.' });
  }
  subscriptions.forEach((sub, idx) => {
    webpush.sendNotification(sub, payload)
      .then(() => console.log(`[sendNotification] Notification envoyée à l’abonné #${idx}`))
      .catch(err => console.error(`[sendNotification] Erreur envoi à l’abonné #${idx} :`, err));
  });
  res.status(200).json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});










