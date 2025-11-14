const path = require('path');
const express = require('express');

const app = express();
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Importing the AppError Class
const AppError = require('./utils/appError');

// Importing the errorController or Global Error Handler
const globalErrorHandler = require('./controllers/errorController');

// importing the routers from the files
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

//  1) GLOBAL MIDDLEWARES

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
app.use(helmet());

// using Environment variables
// Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body to req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQl query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// to prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Test middleware
app.use((req, res, next) => {
  console.log('Hello from the middleware 🙋');
  next();
});

// using middleware to get the date and time at which req is being made
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  // console.log(req.headers);

  next();
});

//  2) ROUTE HANDLERS
// Tours' route handlers -> tourController.js

// Users' route handlers -> userController.js

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Handling unhandled routes
// If req was able to reach here, it means that above two handlers didn't handled the req
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // Calling global error handler
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
