const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const route = require('./routes/route.js')
const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect("mongodb+srv://saaariik-sarul:Rahul1991*@cluster0.adxgdju.mongodb.net/bookManagement", {//connecting mongoose to database using string
    useNewUrlParser: true // 
})
    .then(() => {//promise comes into picture  if connection to database is ok then it executed  
        console.log("mongodb is connected")
    })
    .catch((err) => {// if failed then error is catch here
        console.log(err)
    })
app.use('/', route)
app.listen(3000, () => {
    console.log("server run at port 3000")
})
