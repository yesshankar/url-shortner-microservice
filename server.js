'use strict';
require('dotenv').config();
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const dns = require('dns');
const { URL } = require('url');
var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.FCC_MONGO_URI, { useNewUrlParser: true });

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(express.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

var urlSchema = new mongoose.Schema({
  url: String,
  url_id: Number
});

var Url = mongoose.model('Url', urlSchema);

app.post('/api/shorturl/new', (req, res) => {

  let host = new URL(req.body.url).host;

  // check if url is valid
  dns.lookup(host, async (err, address, family) => {

    if(err){
      res.json({"error":"invalid URL"});
    }else{
      // check if this url has been shorted already
      try{
        let urlData = await Url.find({url: req.body.url});

        if(urlData.length == 0){  // its a new url
          let new_id = await Url.find().estimatedDocumentCount();

          new Url({ url: req.body.url, url_id: new_id +1}).save((err, data) => {
            if(err) res.json({ "error": err});

            res.json({ original_url: data.url, short_url: data.url_id });
          });

        }else{  // this url has already been shorted, so return the url_id of that
          res.json({ original_url: urlData[0].url, short_url: urlData[0].url_id });
        }
       

      }catch(e){
        console.log(`Error in finding urlObj: ${e}`);
        res.json({"errorCatch": e});
      }
    } 


  });
});

app.get('/api/shorturl/:url_id', async (req, res) => {
  try{
    
    let url_id = parseInt(req.params.url_id);

    let urlData = await Url.find({ url_id });

    if(urlData.length == 0){
      res.json({ "error": `short url id ${url_id} not found`});
    }else{
      res.redirect(urlData[0].url);
    }
  }catch(e){
    res.json({ "error": e });
  }


});


app.listen(port, function () {
  console.log('Node.js listening ... at prot: ' + port);
});