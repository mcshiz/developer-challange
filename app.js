var express = require('express');
var exphbs = require('express-handlebars');
var request = require('request');
var app = express();
app.engine('.hbs', exphbs({defaultLayout: 'main.hbs', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use('/app/', express.static(__dirname + '/app'));







app.get(/[0-9]+$/, function(req, res){
    var fid = req.originalUrl.replace(/\//,"");

    request('http://services1.arcgis.com/CHRAD8xHGZXuIQsJ/arcgis/rest/services/dev_challenge_ia/FeatureServer/0/query?where=FID='+fid+'&outFields=*&f=json', function (error, response, body) {
        var queryResults = JSON.parse(body);
        if (!error && response.statusCode == 200 && queryResults.features[0]) {

            res.render('single', {attrs : queryResults.features[0].attributes, geom: queryResults.features[0].geometry});
        } else {
            res.render('index');
        }
    });

});
app.get("/", function(req, res){

    res.render('index');
});

app.listen(9000, function () {
    console.log('listening on port 9000');
});
