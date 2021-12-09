const urlModel= require('../models/urlModel')
const validUrl = require('valid-url');
const shortid = require('shortid')

//!-------------------functions------------------------//
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    
    return true;
}

const baseUrl = 'http://localhost:3000'
const urlShortner = async function (req, res) {
    try {
    const {longUrl}=req.body

    if (!isValid(longUrl)) {
        res.status(400).send({ status: false, message: "longUrl is required " })
        return
    }
    if (!validUrl.isUri(longUrl.trim())) {
        res.status(400).send({ status: false, message: "Invalid longUrl " })
        return
    }

    

    const urlCode = shortid.generate()
    let url = await urlModel.findOne({longUrl})
    if (url) {
        res.status(400).send({status:false, messagae:" url already present"})
    } 
    const shortUrl = baseUrl + '/' + urlCode

    let url={
        urlCode:urlCode,
        longUrl:longUrl,
        shortUrl:shortUrl  
    }

    const newUrl = await urlModel.create(url)

    res.status(201).send({status:true, data:newUrl})

    }catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }  
}


module.exports.urlShortner=urlShortner