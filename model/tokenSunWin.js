const mongoose = require('mongoose');

const tokenSunWinSchema = new mongoose.Schema(
    {
        token: {
            type: String,
        },
        type: {
            type: String,
            enum: ['sun-win', 'gem-win'],
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('tokensunwins', tokenSunWinSchema);
