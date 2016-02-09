var express = require('express');
var exphbs = require('express-handlebars');
var app = express();
app.engine('.hbs', exphbs({defaultLayout: 'main.hbs', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use('/app/', express.static(__dirname + '/app'));

app.get(/\/[0-9]*/, function(req, res){
    res.render('index', {brian : req.originalUrl});
});

//app.get(/[0-9]+$/, function (req, res) {
//    res.sendFile(__dirname + '/app/map.html');
//});
//app.get(/.*/, function (req, res) {
//    res.sendFile(__dirname + '/app/map.html');
//});

app.listen(9000, function () {
    console.log('Example app listening on port 9000!');
});