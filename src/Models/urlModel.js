
const mongoose = require('mongoose')

const url = require('mongoose-type-url');
const validUrl = require('valid-url')

const urlSchema = new mongoose.Schema({
    longUrl: {
        type: url,
        require: true,
        trim: true,
        unique: true
    },

    shortUrl: {
        type: String,
        unique: true,
        trim: true
    },
    
    urlCode: {
        type: String,
        require: true,
        unique: true,
        lowercase:true,
        trim: true
    },

   

   


}, { timestamps: true })

module.exports = mongoose.model('urldb', urlSchema)