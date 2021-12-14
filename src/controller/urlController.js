const urlModel = require('../models/urlModel')
const mongoose = require('mongoose')
const shortid = require('shortid')

//----------------------caching-----------------------//
const redis = require("redis")
const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    13772,
    "redis-13772.c91.us-east-1-3.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("1i1XHaA9vUrCDB5p6Y7UGehix73nOZz1", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



//-------------------functions------------------------//
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false

    return true;
}

function validHttps(value) {
    if (/^https?:\/\//.test(value)) return true;
    return false
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

        let checkUrl = longUrl.trim()
        //const Url2 = Url1.split("").map(x => x.trim()).join("");
        if (!validHttps(checkUrl)) {
            checkUrl = "https://" + checkUrl

        }
        if (!validateUrl(checkUrl)) {
            return res.status(400).send({ status: false, message: "longUrl is not valid " })
        }
        //--------------------------------------------------------------Validation Ends--------------------------------------------//


        let shortUrl = await GET_ASYNC(`${checkUrl}`)
        if (shortUrl) {
           
            //let cacheData1 = {longUrl:cacheData.longUrl,shortUrl:cacheData.shortUrl,urlCode:cacheData.urlCode}
            return res.status(200).send({ satus: true, msg: "ShortUrl already generated in cache", data: shortUrl  })
        }

        let findUrlInDb = await urlModel.findOne({ longUrl: checkUrl })//.select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if (findUrlInDb) {
            return res.status(200).send({ status: true, message: "ShortUrl already generated in DB", data: findUrlInDb })
        }

        const urlCode = shortid.generate().toLowerCase()


        shortUrl = baseUrl + '/' + urlCode
        url = {
            urlCode: urlCode,
            longUrl: checkUrl,
            shortUrl: shortUrl
        }
        await urlModel.create(url)
        const newUrl = await urlModel.findOne({ urlCode })
        //const newUrl = await urlModel.findOne({ urlCode }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        await SET_ASYNC(`${checkUrl}`, JSON.stringify(newUrl)) 
        res.status(201).send({ status: true, data: newUrl })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//------------------------------------------------------------------------------------------------///

const urlCode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode
        //const urlCode1 = urlCode.split("").map(x => x.trim()).join("");

        if (urlCode.length === 0) {          //!check with mentor//
            res.status(400).send({ status: false, message: "No UrlCode found " })
            return
        }

        let findUrlInCache = await GET_ASYNC(`${urlCode}`)
        //let x= JSON.parse(findUrlInCache)
        //console.log(x)
        if (findUrlInCache) {
            let cacheData = JSON.parse(findUrlInCache)
            return res.status(302).redirect(cacheData.longUrl)
        } else {
            const url = await urlModel.findOne({ urlCode: urlCode })
            //console.log(url)
            if (!url) {
                return res.status(400).send({ status: false, message: "No Url Found" })
            } else {
                let oldUrl = url.longUrl

                await SET_ASYNC(`${url.urlCode}`, JSON.stringify(url))
                return res.status(302).redirect(oldUrl,) //!check with mentor - status code 302// and %22

            }
        }


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
// const urlCode = async function (req, res) {
//     try {
//         const urlCode = req.params;
//         let cahcedProfileData = await GET_ASYNC(`${req.params.urlCode}`)
//         let cahcedProfileData1 = JSON.parse(cahcedProfileData)
//         console.log(cahcedProfileData1)
//         if (cahcedProfileData) {
//             let cahcedProfileData1 = JSON.parse(cahcedProfileData)
//             //return res.status(302).redirect(cahcedProfileData1.longUrl)
//             return res.status(302).send({ data :cahcedProfileData1.longUrl})
//         }
//         else {
//             let url = await urlModel.findOne({ urlCode: req.params.urlCode });
//             if (!url) {
//                 return res.status(400).send({ status: false, message: "Url Not Found!!" })
//             }
//             else {
//                 await SET_ASYNC(`${url.longUrl}`, JSON.stringify(url))
//                 return res.status(302).redirect(url.longUrl)
//             }
//         }
//     }
//     catch (error) {
//         res.status(500).send({ status: false, message: error.message })
//     }
// }


module.exports = { urlShortner, urlCode }