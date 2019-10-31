// var net = require('net');
// var onChange = require('./onChange');

// function getNetworkIP(callback) {
//     var socket = net.createConnection(80, 'www.google.com');
//     socket.on('connect', function () {
//         callback(undefined, socket.address().address);
//         // console.log(socket);
//         socket.end();
//     });
//     socket.on('error', function (e) {
//         callback(e, 'error');
//     });
// }
var date;
module.exports = function (io) {
    // io.on('connection', function (socket) {
        
    
        setInterval(function () {
            emitDate();
        }, 500);

        function emitDate() {
            date = +new Date().getTime();
            io.emit('timeofday', date);
            io.sockets.emit('timeofday', date);
            // getNetworkIP(function (error, ip) {
            //     io.emit('ip', ip);
            //     if (error) {
            //         console.log('error:', error);
            //     }
            // });
        }
    // });
};