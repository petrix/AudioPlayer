require('scssify');
// var $ = require('jquery');
require('../css/main.scss');
require('../css/convolver.scss');
// require('./jquery-ui.css');
// var $ = require('jquery');
// require('../css/main.scss');
// var _ = require('lodash');
// var app = require('./equalizer');
var io = require('socket.io-client');
// var platform = require('platform');



// import Wavepad from './wavepad';
// import registerServiceWorker from './sw-bootstrap';
var Player = require('./index.js');
var registerServiceWorker = require('./sw-bootstrap.js');
window.addEventListener('DOMContentLoaded', () => {

    // var app = new Player('NRG1');
    // app.init();

    registerServiceWorker();
});
