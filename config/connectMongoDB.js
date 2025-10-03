const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    mongoose
        .connect(process.env.URL_DATABASE)
        .then(() => {
            console.log('Kết nối Thành công');
        })
        .catch((err) => {
            console.log(err);
            throw err;
        });
};
module.exports = connectDB;
