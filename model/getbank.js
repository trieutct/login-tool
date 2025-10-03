const mongoose = require('mongoose');

const getbankSchema = new mongoose.Schema(
    {
        code_bank: {
            type: String,
        },
        account_name: {
            type: String,
        },
        account_no: {
            type: String,
        },
        branch_name: {
            type: String,
        },
        type: {
            type: String,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('getbank', getbankSchema);
