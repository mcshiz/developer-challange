var express = require('express');
var app = express();

app.use("/", express.static(__dirname + '/app'));
app.get(/[0-9]+$/, function (req, res) {
    res.sendFile(__dirname + '/app/map.html');
});
app.get(/.*/, function (req, res) {
    res.sendFile(__dirname + '/app/map.html');
});

app.listen(9000, function () {
    console.log('Example app listening on port 9000!');
});