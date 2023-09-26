class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    //non ho inserito this.message = message perchè già lo eredità dalla classe che estende (Error) grazie a super(message)
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

//Questi sono gli errori operazionali, ovvero quegli errori che creiamo noi ad esempio quando il client richiede una rotta che non esiste
// o quando richiede un elemento del db che non esiste, es: return next(new AppError('Nessun personaggio trovato con questo id', 404));
//questo crea un nuovo errore e siccome quella funzione è wrappata con il catchasync (DeleteCharacter = catchAsync(async (req, res, next) ....)
//accade questo errore nella funzione => appError => errorController
