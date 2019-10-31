module.exports = function (secureServer) {
    var io = require('socket.io')(secureServer);

    // io.attach(http);
    io.attach(secureServer);
    // var clientManager = require('./lib/client-manager');

    // clientManager.initialise(io);
    // clientManager.start();

    // var atem = require('./lib/atem');
    // atem.initialise(io);
    // atem.start();
    
    var clock = require('./lib/time')(io);
    // console.log(clock);
    var auth = require('./lib/stat')(io);
    // var customCountdown = require('./lib/custom-countdown')(io);
    // var messagingModule = require('./lib/messaging_module')(io);
    // var txtimeModule = require('./lib/txtime_module')(io);
    // var brightnessModule = require('./lib/brightness')(io);
    // var refresh_module = require('./lib/refresh')(io);
    // var intercom_control_module = require('./lib/intercom_control_module')(io);

    // var casparCountdown = require('./lib/caspar-countdown');
    // casparCountdown.initialise(io);
    // casparCountdown.start();

};