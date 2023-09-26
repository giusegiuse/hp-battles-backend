module.exports = (fn) => {
  return (req, res, next) => {
    //questo ci ha permesso di rimuovere il blocco try catch dalla funzione createCharacter di sotto
    fn(req, res, next).catch(next);
  };
};
