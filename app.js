const express = require('express');
const mongoose = require('mongoose').default;
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
require('dotenv').config();
const app = express();
const characterRouter = require('./routes/characterRoutes');
const userRoutes = require('./routes/userRoutes');

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(db, {})
  .then((con) => {
    console.log('Connesso al database MongoDB');
  })
  .catch((err) => {
    console.error('Errore durante la connessione al database:', err);
  });

app.get('/', (req, res) => {
  res.send('ciao');
});

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api', characterRouter);

app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Non è stata trovata ${req.originalUrl} su questo server`,
      404,
    ),
  );
});

app.use(globalErrorHandler);

module.exports = app;
