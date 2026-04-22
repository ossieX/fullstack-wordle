const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    timeMs: {
      type: Number,
      required: true,
      min: 0,
    },
    guesses: {
      type: [String],
      required: true,
      default: [],
    },
    settings: {
      wordLength: {
        type: Number,
        required: true,
      },
      allowRepeatedLetters: {
        type: Boolean,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Score', scoreSchema);
