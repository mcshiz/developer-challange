var express = require('express');
var exphbs = require('express-handlebars');
var request = require('request');
var bodyParser = require('body-parser');
var mail = require('mailgun-send');
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/add-new', function(req, res) {
    var body = req.body;
    var id = body.fid;
    var bodyText = '';
    mail.config({
        key: 'key-d35aef2807c489c8abe81fe0132afccd',
        sender: 'postmaster@sandboxdcfe4b509ac243f3b2972d17213a01c4.mailgun.org'
    });

    for (var key in body.attrs){
        if (body.attrs.hasOwnProperty(key)) {
            bodyText += key + ": "+ body.attrs[key]+ "<br>";
        }
    }

    mail.send({
        subject: 'New Feature Added',
        recipient: 'mccabj0210@gmail.com',
        body: bodyText +
        'http://localhost:9000/'+id
    });
    res.send("email sent");
});

app.get("/", function(req, res){
    res.render('index');
});

app.listen(9000, function () {
    console.log('listening on port 9000');
});
