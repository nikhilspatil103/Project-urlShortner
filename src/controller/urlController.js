const urlModel = require('../models/urlModel')
const validUrl = require('valid-url');
const shortid = require('shortid')

var shortUrl = require('node-url-shortener');
const nodeUrlShortener = require('node-url-shortener');


//!-------------------functions------------------------//
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false

    return true;
}

const baseUrl = 'http://localhost:3000'
const urlShortner = async function (req, res) {
    try {
        const { longUrl } = req.body

        if (!isValid(longUrl)) {
            res.status(400).send({ status: false, message: "longUrl is required " })
            return
        }
        if(!/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(:[0-9]+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/.test(longUrl)){
           res.status(400).send({ status: false, message: "longUrl is not valid " })
        }
        // if (!validUrl.isUri(longUrl.trim())) {
        //     res.status(400).send({ status: false, message: "Invalid longUrl " })
        //     return
        // }



        const urlCode = shortid.generate()
        console.log(urlCode)
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
        const newUrl= await urlModel.find({urlCode}).select({_id:0, createdAt:0,updatedAt:0,__v : 0})
        ///.select


        res.status(201).send({ status: true, data: newUrl })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const urlCode = async function (req, res) {

        const {urlCode}=req.params
        const url= await urlModel.findOne({urlCode:req.params.urlCode})
        console.log(url)

        if(!url){
            return res.status(400).send({status:false, message: "No Url Found"})
        }else {
        res.status(200).send({status:true, data : url.longUrl})
        }
}

module.exports= { urlShortner ,urlCode}