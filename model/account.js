const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
    {
        username: {
            type: String,
        },
        token: {
            type: String,
        },
        web: {
            type: String,
        },
        proxy: {
            type: String,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('account', accountSchema);
