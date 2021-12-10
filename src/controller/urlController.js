const urlModel = require('../models/urlModel')
const mongoose = require('mongoose')
const shortid = require('shortid')


//var shortUrl = require('node-url-shortener');



//-------------------functions------------------------//
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false

    return true;
}

function validateUrl(value) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
      value
    );
  }
  



//-------------------------------------------------------//

const urlShortner = async function (req, res) {
    try {
        const baseUrl = 'http://localhost:3000'
        let { longUrl } = req.body


        if (!isValid(longUrl)) {
            res.status(400).send({ status: false, message: "longUrl is required " })
            return
        }
        // if (!/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(longUrl)) {
        //      return res.status(400).send({ status: false, message: "longUrl is not valid " })
        //  }
        let lUrl= longUrl.trim()
        if(!validateUrl(lUrl)){                  //!check with mentor//
            return res.status(400).send({ status: false, message: "longUrl is not valid " })
        }
      
        const urlCode = shortid.generate().toLowerCase()

        let url = await urlModel.findOne({ longUrl })
        if (url) {
            return res.status(400).send({ status: false, messagae: "url already present" })
        } else {
            shortUrl = baseUrl + '/' + urlCode
        }


        url = {
            urlCode: urlCode,
            longUrl: longUrl,
            shortUrl: shortUrl
        }

        await urlModel.create(url)
        const newUrl = await urlModel.findOne({ urlCode }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        res.status(201).send({ status: true, data: newUrl })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const urlCode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode

        if (urlCode.length === 0) {          //!check with mentor//
            res.status(400).send({ status: false, message: "No UrlCode found " })
            return
        }
        const url = await urlModel.findOne({ urlCode: req.params.urlCode })
        if (!url) {
            return res.status(400).send({ status: false, message: "No Url Found" })
        } else {
            let oldUrl = url.longUrl
            return res.status(302).redirect(oldUrl) //!check with mentor - statuys code 302//
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports = { urlShortner, urlCode }