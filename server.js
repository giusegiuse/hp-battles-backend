const app = require('./app');
const port = 3000;
const server = app.listen(port, () => {
  console.log('app listen port 3000');
});

const io = require('socket.io')(server, {
  cors: {
    origins: ['*'],
  },
});

//app.options('/api/v1/character/:id', cors());

let onlineUsers = {};

io.on('connection', (socket) => {
  const socketId = socket.id;

  socket.on('setId', (id) => {
    console.log('setId', id);
    onlineUsers[socketId] = id;
    io.emit('updateOnlineUsers', Object.values(onlineUsers));
  });

  socket.on('disconnect', () => {
    console.log('Utente disconnesso:', socket.id);
    delete onlineUsers[socketId];
    io.emit('updateOnlineUsers', Object.values(onlineUsers));
    // Rimuovi l'utente dalla lista degli utenti online
    // E quindi emetti un evento per aggiornare l'elenco degli utenti online
  });
});

//TODO verificare perchè questi due handler non funzionano, forse non vanno inseriti qui
//per gestire tutte le eccezioni che non sono state gestite dal nostro codice
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLER REJECTION!');
  console.log(err.name, err.message);
  //server.close fa terminare tutte le richiete in corso o in sospeso prima di chiudere il server. dopodichè
  //verrà chiuso il process
  server.close(() => {
    process.exit(1);
  });
});

process.on('unCaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION!');
  console.log(err.name, err.message);
  process.exit(1);
  //in produzione si dovrebbe avere un tool per riavviare node dopo il crash e/o dopo l'arresto manuale. Molti hosting lo fanno in automatico
});

//questi handler devono stare in cima al codice altrimenti non possono essere chiamati in caso di errore
