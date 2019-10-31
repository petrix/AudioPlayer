var fs = require('fs');
var net = require('net');
// var ioClient = require('socket.io-client');
// var ioSocket = ioClient.connect('https://127.0.0.1:4001', {
//     secure: true,
//     reconnect: true,
//     rejectUnauthorized: false
// });
// import io from 'socket.io-client';
var userCheck;
// ioSocket.on('connect', function (sock) {
//     socket.on('timeofday', function (zxczxc) {
//         console.log(zxczxc);
//     });
// });
var date;
module.exports = function (io) {
    io.sockets.on('connection', function (socket) {
        console.log('connected:', socket.client.id);

        function addZero(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        }
        var monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        var d, dDate, dTime, dHours, dMinutes, dSeconds, dMonth;

        function getCurrentTimeDate() {
            d = new Date();
            dHours = addZero(d.getHours());
            dMinutes = addZero(d.getMinutes());
            dSeconds = addZero(d.getSeconds());

            for (var i = 0; i < monthArray.length; i++) {
                if (i == d.getUTCMonth()) {
                    dMonth = monthArray[i];
                }
            }
            dDate = d.getDate() + '-' + dMonth + '-' + d.getFullYear();
            dTime = dHours + ':' + dMinutes + ':' + dSeconds;

        }
        socket.on('platformipinfo', function (ipinfo,platform) {
            getCurrentTimeDate();
            fs.open('./platform.txt', 'a', (err, fd) => {
                if (err) throw err;
                var platformVal = JSON.stringify(platform);
                var ipinfoVal = JSON.stringify(ipinfo);
                fs.appendFileSync(fd, dDate + '_' + dTime + '\n'+ipinfoVal+'\n'+platformVal + '\n', 'utf8', (err) => {
                    fs.close(fd, (err) => {
                        if (err) throw err;
                    });
                    if (err) throw err;
                });
            });
        });
        socket.on('ipinfo', function (ipinfo) {
            fs.open('./ipinfo.txt', 'a', (err, fd) => {
                if (err) throw err;
                var ipinfoVal = JSON.stringify(ipinfo);
                fs.appendFileSync(fd, ipinfoVal + '\n', 'utf8', (err) => {
                    fs.close(fd, (err) => {
                        if (err) throw err;
                    });
                    if (err) throw err;
                });
            });
        });
            
        
        socket.on('ip-get', function(){
                    getNetworkIP(function (error, ip) {
                        io.emit('ip', ip);
                        if (error) {
                            console.log('error:', error);
                        }
                    });
        });
        // var owner;
        socket.on('clientmessage', function (owner, data) {
            var dataDec = decodeURIComponent(data);
            console.log(dataDec);
            getCurrentTimeDate();
            var x;
            fs.open('./db/messages.txt', 'a', (err, fd) => {
                if (err) throw err;



                fs.appendFileSync(fd, dDate + '_' + dTime + '_' + owner + '_' + dataDec + '\n', 'utf8', (err) => {
                    fs.close(fd, (err) => {
                        if (err) throw err;
                    });
                    if (err) throw err;
                });
            });
            spellCheck(dataDec);
            io.emit('servermessage', dDate, dTime, owner, encodeURIComponent(dataSpell));
        });


        socket.on('read-servermessage', function () {
            var messagesFile = fs.readFileSync('./db/messages.txt', 'utf8', (err) => {
                if (err) throw err;
            });

            var messagesArray = messagesFile.split('\n');
            var messagesCount = messagesArray.length;
            for (var i = 0; i < messagesCount - 1; i++) {
                var logDate = messagesArray[i].split('_');
                var wCheck = logDate[3];
                spellCheck(wCheck);
                io.emit('servermessage-update', logDate[0], logDate[1], logDate[2], encodeURIComponent(dataSpell));
            }
            io.emit('servermessage-updated', true);
        });
        socket.on('clear-serverfile', function () {
            fs.writeFileSync('./db/messages.txt', '', function (err) {});
            io.emit('serverfile-empty', true);
        });


        socket.on('read-roles', function () {
            var rolesFile = fs.readFileSync('./db/roles.txt', 'utf8', (err) => {
                if (err) throw err;
            });
            var rolesArray = rolesFile.split('\n');
            for (var i = 0; i < rolesArray.length - 1; i++) {

                var roleName = rolesArray[i].split('_');

                if (roleName[2] !== 'true') {
                    // console.log(roleName[2]);
                    socket.emit('roles-feedback', roleName[0]);
                }
            }
        });
        socket.on('update-roles', function (user, passwd) {
            var rolesFile = fs.readFileSync('./db/roles.txt', 'utf8', (err) => {
                if (err) throw err;
            });
            var rolesArray = rolesFile.split('\n');
            for (var i = 0; i < rolesArray.length - 1; i++) {
                var roleName = rolesArray[i].split('_');
                if (user == roleName[0]) {
                    roleName[1] = passwd;
                }
                fs.appendFileSync('./db/roles3.txt', roleName[0] + '_' + roleName[1] + '_' + roleName[2] + '\n', 'utf8', (err) => {
                    if (err) throw err;
                });
            }
            copyDb();
        });
        socket.on('checkPasswd', function (user, passwd) {

            var rolesFile = fs.readFileSync('./db/roles.txt', 'utf8', (err) => {
                if (err) throw err;
            });
            var rolesArray = rolesFile.split('\n');
            for (var i = 0; i < rolesArray.length - 1; i++) {
                var roleName = rolesArray[i].split('_');
                if (user == roleName[0]) {
                    if (parseInt(passwd) == roleName[1]) {
                        // roleName[2] = true;
                        socket.emit('passwd-feedback', true);
                    } else {
                        socket.emit('passwd-feedback', false);
                    }
                }
                fs.appendFileSync('./db/roles3.txt', roleName[0] + '_' + roleName[1] + '_' + roleName[2] + '\n', 'utf8', (err) => {
                    if (err) throw err;
                });
            }
            copyDb();
        });

    });


function getNetworkIP(callback) {
    var socket = net.createConnection(80, 'www.google.com');
    socket.on('connect', function () {
        callback(undefined, socket.address().address);
        // console.log(socket);
        socket.end();
    });
    socket.on('error', function (e) {
        callback(e, 'error');
    });
}

    var dataSpell;

    function spellCheck(innerText) {
        // console.log(innerText);
        var spellFile = fs.readFileSync('./db/dict.txt', 'utf8', (err) => {
            if (err) throw err;
        });

        var spellArray = spellFile.split('\n');
        dataSpell = innerText.toLowerCase();
        for (var i = 0; i < spellArray.length - 1; i++) {
            var splittedWords = spellArray[i].split(':');
            if (dataSpell.indexOf(splittedWords[0]) !== -1) {
                dataSpell = dataSpell.replace(new RegExp(splittedWords[0], 'g'), splittedWords[1]);
            }
        }
    }

    function copyDb() {
        var rolesFile = fs.readFileSync('./db/roles3.txt', 'utf8', (err) => {
            if (err) throw err;
        });
        fs.writeFileSync('./db/roles.txt', rolesFile, (err) => {
            if (err) throw err;
        });
        fs.unlink('./db/roles3.txt', (err) => {
            if (err) throw err;
        });
    }

}