const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
        },
        proxy: {
            type: String,
        },
        web: {
            type: String,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('token', tokenSchema);
