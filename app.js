const mongoose = require('mongoose').default;
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const characterRouter = require('./routes/characterRoutes');
const userRoutes = require('./routes/userRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const deckRoutes = require('./routes/deckRoutes');
const cors = require('cors');
const express = require('express');

const app = express();

app.enable('trust proxy');
app.set('trust proxy', 1);

require('dotenv').config();

// 1) GLOBAL MIDDLEWARES
// Implement CORS si può usare anche come middleware nelle rotte
// work only with simple request: get and post request
const corsOptions = {
  origin: 'http://localhost:4200',
  credentials: false,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
// Access-Control-Allow-Origin
// BE: api.sito.com, FE: sito.com

app.options('*', cors());
// per le richieste con preflight (patch, update, delete)

//Set security HTTP headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 900,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
  // 900 richieste da uno stesso ip nel corso di un'ora
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
  res.send('HP Battles');
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

app.use(compression());

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
app.use('/api/character', characterRouter);
app.use('/api/deck', deckRoutes);

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
