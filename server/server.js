var express = require('express');
var fs = require('fs');
var path = require('path');
var https = require('https');
var app = module.exports = express();
var httpsPORT = process.env.PORT || 5000;
var httpsOptions = {
    key: fs.readFileSync('./certs/server-key.pem'),
    cert: fs.readFileSync('./certs/server-crt.pem')
};
var secureServer = https.createServer(httpsOptions, app).listen(httpsPORT, function () {
    console.log('HTTPS Server Listener Started:'.bold, httpsPORT);    
});
io = module.exports =  require('socket.io').listen(secureServer, {
    pingTimeout: 7000,
    pingInterval: 10000
});
io.set("transports", ["xhr-polling", "websocket", "polling", "htmlfile"]);
app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});
app.use('/socket', express.static(__dirname + '/node_modules/socket.io-client/dist'));
app.use(express.static(path.join(__dirname, 'public')));
var modulesHttps = require('./modules-https')(secureServer);
