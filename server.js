const dotenv = require('dotenv');

// requiring mongoose
const mongoose = require('mongoose');

// Catching Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting Down...', err.message);
  console.log(err.name, err.message);
  process.exit(1);
});

// reading the config file
dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, { -> To connect local database
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    // console.log(con.connections);
    console.log('DB Connection successful');
  });
// Using catch to handle the unhandled promise rejection like the server connection error
// but since this is not the only unhandled rejection we need to create a function for that
// .catch((err) => console.log('Error'));

const port = process.env.PORT || 3000; // here, however the process.env.PORT is '3000' but it could be '8000' also, and project would work on it also

const server = app.listen(port, () => {
  console.log(`App running on ${port}....`);
});

// Handling unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection! 💥 Shutting Down...', err.message);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// creating uncaught exception error
// console.log(x)
