const express = require('express');
const mongoose = require('mongoose').default;
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
require('dotenv').config();
const characterRouter = require('./routes/characterRoutes');
const userRoutes = require('./routes/userRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const app = express();

// 1) GLOBAL MIDDLEWARES
//Set security HTTP headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 300,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
  // 100 richieste da uno stesso ip nel corso di un'ora
});
//attiviamo il limiter solo alle rotte delle api
app.use('/api', limiter);

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

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['life', 'strength', 'cost', 'faction', 'birthDate'],
  }),
);

app.use(express.static(`${__dirname}/public`));

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers)
  //console.log(req.cookies)
  //attivarli se si vuole debuggare e poi ricommentarli
  next();
});

app.use('/api/users', userRoutes);
app.use('/api/challenge', challengeRoutes);
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
