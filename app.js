var express = require('express');
var exphbs = require('express-handlebars');
var request = require('request');
var app = express();
app.engine('.hbs', exphbs({defaultLayout: 'main.hbs', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use('/app/', express.static(__dirname + '/app'));







app.get(/[0-9]*$/, function(req, res){
    var fid = req.originalUrl.replace(/\//,"");
    request('http://services1.arcgis.com/CHRAD8xHGZXuIQsJ/arcgis/rest/services/dev_challenge_ia/FeatureServer/0/query?where=FID='+fid+'&f=json', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        } else {
            console.log("err")
        }
    });
    res.render('single', {fid : "brian"});
});
app.get("/", function(req, res){

    res.render('index');
});

app.listen(9000, function () {
    console.log('listening on port 9000');
});
