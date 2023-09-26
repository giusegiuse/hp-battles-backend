const app = require('./app');
const port = 3000;
const server = app.listen(port, () => {
  console.log('app listen port 3000');
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
