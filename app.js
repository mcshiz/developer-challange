var express = require('express');
var exphbs = require('express-handlebars');
var app = express();
app.engine('.hbs', exphbs({defaultLayout: 'main.hbs', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use('/app/', express.static(__dirname + '/app'));

app.get(/^[0-9]*$/, function(req, res){
    res.render('single', {fid : req.originalUrl});
});
app.get("/", function(req, res){
    res.render('index', {fid : req.originalUrl});
});

app.listen(9000, function () {
    console.log('listening on port 9000');
});
