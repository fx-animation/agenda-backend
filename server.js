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

// Mémoire des abonnements et des programmations (volatil, suffisant pour usage simple)
let subscriptions = [];
const scheduledPushes = new Map(); // eventId -> timeoutId

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

// Programmer une notification push pour un événement à une date précise (ms epoch)
app.post('/scheduleEventPush', (req, res) => {
  const { eventId, title, message, triggerAt } = req.body || {};
  if (!eventId || !triggerAt) {
    return res.status(400).json({ success: false, message: 'eventId et triggerAt requis' });
  }
  const now = Date.now();
  const delay = Number(triggerAt) - now;
  if (isNaN(delay)) {
    return res.status(400).json({ success: false, message: 'triggerAt invalide' });
  }
  if (delay <= 0) {
    return res.status(200).json({ success: false, message: 'Date déjà passée' });
  }
  // Annuler une éventuelle programmation précédente pour cet eventId
  const existing = scheduledPushes.get(eventId);
  if (existing) {
    clearTimeout(existing);
    scheduledPushes.delete(eventId);
  }
  const payload = JSON.stringify({ title: title || 'Rappel d\'événement', message: message || 'Votre événement commence.' });
  const timeoutId = setTimeout(() => {
    console.log(`[scheduleEventPush] Déclenchement eventId=${eventId} | subs=${subscriptions.length}`);
    if (subscriptions.length === 0) {
      console.warn('[scheduleEventPush] Aucun abonnement push enregistré au déclenchement.');
      scheduledPushes.delete(eventId);
      return;
    }
    subscriptions.forEach((sub, idx) => {
      webpush.sendNotification(sub, payload)
        .then(() => console.log(`[scheduleEventPush] Push envoyé à #${idx} pour eventId=${eventId}`))
        .catch(err => console.error(`[scheduleEventPush] Erreur envoi à #${idx} :`, err));
    });
    scheduledPushes.delete(eventId);
  }, delay);
  scheduledPushes.set(eventId, timeoutId);
  console.log(`[scheduleEventPush] Programmé eventId=${eventId} dans ${Math.round(delay/1000)}s`);
  res.status(200).json({ success: true, eventId, delayMs: delay });
});

// Annuler une notification push programmée pour un événement
app.post('/cancelScheduledEventPush', (req, res) => {
  const { eventId } = req.body || {};
  const timeoutId = scheduledPushes.get(eventId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledPushes.delete(eventId);
    console.log(`[cancelScheduledEventPush] Annulé eventId=${eventId}`);
    return res.status(200).json({ success: true });
  }
  return res.status(200).json({ success: false, message: 'Aucune programmation trouvée' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});










