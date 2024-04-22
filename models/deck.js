const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema({
  playerChallenger: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Challenge must required a player challenger'],
  },
  money: {
    type: Number,
    default: 500,
  },
  characters: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Character',
    },
  ],
  challenge: {
    type: mongoose.Schema.ObjectId,
    ref: 'Challenge',
  },
  creationDate: {
    type: Date,
    default: Date.now(),
  },
});

// deckSchema.pre('save', function (next) {
//   this.constructor.calculateMoneyRemaining(this.character);
//   next();
// });

// deckSchema.statics.calculateMoneyRemaining = async function (character) {
//   if (this.isModified('characters') && this.characters.length) {
//     const numberOfCharactersAdded = this.characters.length;
//     const totalCost = numberOfCharactersAdded * characterCost;
//
//     if (this.money >= totalCost) {
//       this.money -= totalCost; // Sottrae il costo totale dal denaro disponibile nel mazzo
//     } else {
//       throw new Error(
//         'Non hai abbastanza soldi per aggiungere questi personaggi',
//       );
//     }
//   }
// };

const Deck = mongoose.model('Deck', deckSchema, 'decks');

module.exports = Deck;
