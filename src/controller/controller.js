const urlModel = require('../models/urlModel.js')
const validUrl = require('valid-url')
const shortid = require('shortid')
const redis = require('redis')
const { promisify } = require("util")
const redisClient = redis.createClient(12885,
    "redis-12885.c277.us-east-1-3.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth('ktRURuK9C2uCz8V6AcHLsEaWiHfLb1TV', function (err) {
    if (err) {
        console.error('Redis authentication error:', err);
        throw err;
    }
    console.log('Authenticated with Redis.');
});
redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const createShortUrl = async function (req, res) {
    try {
        //==defining baseUrl==//
        const baseUrl = 'http://localhost:3000'

        //==validating request body==//
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Invalid request, please provide details" })

        //==validating long url==//
        let longUrl = req.body.longUrl.trim()
        if (!validUrl.isUri(longUrl)) return res.status(400).send({ status: false, message: "Invalid long URL" })

        //==checking cache==//
        let fetchLongUrl = await GET_ASYNC(`${longUrl}`)
        const newData = JSON.parse(fetchLongUrl)
        if (newData) return res.status(200).send({ status: true, data: newData })

        //==ckecking and sending shorturl==//
        let url = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 })
        await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(url))
        if (url) return res.status(200).send({ status: true, data: url })

        //==creating shorturl and url document==//
        let urlCode = shortid.generate(longUrl)
        let shortUrl = baseUrl + '/' + urlCode
        let Url = await urlModel.create({ longUrl, shortUrl, urlCode })

        //==destructuring to get only required keys==/
        let data = { longUrl, shortUrl, urlCode }

        //==setting  data in cache and sending response==//
        await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(data))
        return res.status(201).send({ status: true, data: data })
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}
const getShortUrl = async function (req, res) {
    try {
        //==checking for url code in cache==//
        const cachedUrlData = await GET_ASYNC(`${req.params.urlCode}`)
        const parsingData = JSON.parse(cachedUrlData);
        if (cachedUrlData) return res.status(307).redirect(parsingData)

        //==checking for url code in url collection==//
        const urlData = await urlModel.findOne({ urlCode: req.params.urlCode.trim() })
        if (!urlData)   // doc not found in url collection
            return res.status(404).send({ status: false, message: "No URL Found " });

        //==url code found and now setting in cache and redirecting to original url==// 
        await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(urlData.longUrl));
        return res.status(307).redirect(urlData.longUrl)
    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message });
    }
}

module.exports = { createShortUrl, getShortUrl }
