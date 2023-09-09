const express = require('express')
const router = express.Router()
const urlController = require("../controller/controller.js")
router.post("/url/shorten", urlController.createShortUrl)
router.get("/:urlCode", urlController.getShortUrl)
module.exports = router