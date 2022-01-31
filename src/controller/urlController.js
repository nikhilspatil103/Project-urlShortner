const urlModel = require('../models/urlModel')
const mongoose = require('mongoose')
const shortid = require('shortid')  //pakage to generate unique urlcode
const redisClient =require('../redis/redis')

//-------------------functions------------------------//
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false

    return true;
}


function validhttpsLower(value) {
    if (/^https?:\/\//.test(value)) return true;
    return false
}

function validhttpsUpper(value) {
    if (/^HTTPS?:\/\//.test(value)) return true
    return false
}



function validateUrl(value) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
        value
    );
}
// function validateUrl(value) {
//     return /(ftp|http|https|HTTPS|HTTP):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(
//         value
//     );
// }
//-------------------------------------------------------//

const urlShortner = async function (req, res) {
    try {
        const baseUrl = 'http://localhost:3000'
        let { longUrl } = req.body

        if (!isValid(longUrl)) {
            res.status(400).send({ status: false, message: "longUrl is required " })
            return
        }

        let checkUrl = longUrl.trim()
      

        if (validhttpsLower(checkUrl)) {
            const regex = /^https?:\/\// 
            checkUrl = checkUrl.replace(regex, "https://")          

        }

        if (validhttpsUpper(checkUrl)) {
            const regex = /^HTTPS?:\/\//
            checkUrl = checkUrl.replace(regex, "https://")

        }

        if (!validateUrl(checkUrl)) {
            return res.status(400).send({ status: false, message: "longUrl is not valid " })
        }
        //-------------------------------Validation Ends--------------------------------------------//



         //find shortURL in DB if its been alredy created
        let findUrlInDb = await urlModel.findOne({ longUrl: checkUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        
        if (findUrlInDb) {
            return res.status(200).send({ status: true, message: "ShortUrl already generated in DB", data: findUrlInDb })
        }

        const urlCode = shortid.generate().toLowerCase()   //generate unique code with shortid pakage

        shortUrl = baseUrl + '/' + urlCode                // concat base url with unique Id

        url = {urlCode: urlCode,longUrl: checkUrl,shortUrl: shortUrl}
        await urlModel.create(url)                        // create in DB

        
        const newUrl = await urlModel.findOne({ urlCode }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })

        
        await redisClient.SET_ASYNC(`${urlCode}`, checkUrl)     //set in redies cache key= urlCode, value=longUrl
      
        res.status(201).send({ status: true, data: newUrl })
        

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//------------------------------------------------------------------------------------------------///

const urlCode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode
        

        if (urlCode.length === 0) {          
            res.status(400).send({ status: false, message: "No UrlCode found " })
            return
        }

        let findUrlInCache = await redisClient.GET_ASYNC(`${urlCode}`)      // first find URL in redies cache
    
        if (findUrlInCache) {
            ///let cacheData = JSON.parse(findUrlInCache)               
            
            return res.status(302).redirect(findUrlInCache)
        } else {
            const url = await urlModel.findOne({ urlCode: urlCode })
            if (!url) {
                return res.status(400).send({ status: false, message: "No Url Found" })
            } else {
                let oldUrl = url.longUrl

                await redisClient.SET_ASYNC(`${url.urlCode}`, oldUrl)
                
                res.status(302).redirect(oldUrl)
            }
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports = { urlShortner, urlCode }
