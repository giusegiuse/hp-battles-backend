const mongoose = require('mongoose');
const slugify = require('slugify');

const charactersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'la carta deve avere un nome'],
    unique: true,
    minLength: [
      5,
      'I nomi dei personaggi devono avere una lunghezza di almeno 5 caratteri',
    ],
    // validate: [
    //   validator.isAlpha,
    //   'il nome del personaggio può contenere solo lettere',
    // ],
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  strength: {
    type: Number,
    required: true,
    min: [1, 'Il campo deve avere un valore minimo di 1.0'],
    max: [100, 'Il campo deve avere un valore massimo di 10.0'],
  },
  life: {
    type: Number,
    required: true,
    min: [1, 'Il campo deve avere un valore minimo di 1.0'],
    max: [100, 'Il campo deve avere un valore massimo di 10.0'],
  },
  secretCharacter: {
    type: Boolean,
    default: false,
  },
  specialAbilities: {
    name: {
      type: String,
    },
    type: {
      type: String,
    },
    duration: {
      type: Number,
    },
  },
  image: String,
  cost: {
    type: Number,
    required: true,
    min: [1, 'Il campo deve avere un valore minimo di 1.0'],
    max: [100, 'Il campo deve avere un valore massimo di 100.0'],
  },
  faction: {
    type: String,
    required: true,
    enum: {
      values: ['good', 'bad'],
      message: 'Le fazioni sono good and bad',
    },
  },
  friends: [],
  birthDate: {
    type: Date,
    validate: {
      validator: function (val) {
        // this only points to current doc on NEW document creation
        return val < Date.now();
      },
      message:
        'La data di nascita ({VALUE}) deve essere inferiore alla data attuale',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    //per non selezionarlo nelle query
    select: false,
  },
});

charactersSchema.set('toJSON', { virtuals: true });
charactersSchema.set('toObject', { getters: true });

//Indice per migliorare le prestazioni delle ricerche che utilizzano il cost come parametro (diminuisce il numero di documenti analizzati)
charactersSchema.index({ cost: 1 });

charactersSchema.virtual('costType').get(function () {
  if (this.cost < 80) return 'low';
  else if (this.cost >= 80 && this.cost <= 95) return 'medium';
  else return 'high';
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
charactersSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// charactersSchema.pre('save', function (next) {
//   console.log('Salvataggio in corso...');
//   next();
// });
//
// charactersSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE  potevo inserire 'find' ma avrebbe funzionato solo per il find con l'espressione regolare /^find/ funziona con tutte le find es findById
charactersSchema.pre(/^find/, function (next) {
  this.find({ secretCharacter: { $ne: true } });
  this.start = Date.now();
  next();
});

// charactersSchema.post(/^find/, function (next) {
//   console.log(`Query eseguita in ${Date.now() - this.start} millisecondi!`);
//   next();
// });

//AGGREGATION MIDDLEWARE
charactersSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretCharacter: { $ne: true } } });
  next();
});

const Character = mongoose.model('Character', charactersSchema, 'characters');

module.exports = Character;
