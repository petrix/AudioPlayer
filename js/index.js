// require('scssify');
var $ = require('jquery');
// require('../css/main.scss');
// require('../css/convolver.scss');
var _ = require('lodash');
var app = require('./equalizer');
var io = require('socket.io-client');
var platform = require('platform');
// var registerServiceWorker = require('./sw-bootstrap.js');


window.addEventListener('DOMContentLoaded', () => {


  var sPath = 'https://bratan.ooo:5000';

  var socket = io.connect(sPath, {
    secure: true,
    reconnect: true,
    rejectUnauthorized: false
  });

  socket.on('connect', function () {
    pushPlay();

    var response = $.get("https://ipinfo.io", function (response) {
      // console.log(response.ip, response.country, response.loc, response);
      socket.emit('platformipinfo', response, platform);
    }, "jsonp");
    socket.on('timeofday', function (currentTime) {});
  });
  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      console.log('disconnected');
      socket.connect();
    }
  });


  $('.splashscreen').animate({
    opacity: 0
  }, 1000, function () {
    $('.splashscreen').remove();
    });
  


  var audioCtx;
  var audioElement = document.querySelector('audio');
  var track;
  var analyser;
  var bufferLength;
  var dataArray;
  var analyserInput;
  var outPredmaster;
  var eqIn;
  var eqOut;
  var convolverIN;
  var convolverOUT;
  var compressor;
  var stationAddr = 'http://bratan.tk';
  var stationId = 4;
  var streamUrl;
  var spectroOffset = 0;
  var freqValues = [64, 128, 256, 512, 1024, 2048, 4096];
  var freqFilter = [];
  var obj = {};

  var CVS1, CVS2, CTX1, CTX2, CVS1W, CVS1H, CVS2W, CVS2H;


  var playing = false;
  var bars = Array(300);
  var forward = true;
  var barCount = 100;
  var lineWidth = 4;
  var lineGap = 1.5;
  var heightFactor = 10;
  var delay = 17;
  var animate = 'auto';
  var animateSwitch = 50 * 1000;
  var hue = 0;
  var $out = $('[name=animate][value=out]');
  var $in = $('[name=animate][value=in]');
  var $auto = $('[name=animate][value=auto]');
  var $hue = $('[name=hue]');
  var $delay = $('[name=delay]');
  var $width = $('[name=width]');
  var $height = $('[name=height]');
  var $gap = $('[name=gap]');
  var $autoDelay = $('[name=auto-delay]');
  var DATA, LEN, h, x, average;
  var winWidth = $(window).width();
  barCount = (winWidth / (lineWidth + lineGap)) / 2;
  lineWidth = 1 + Math.floor((50 / 2));
  var activeConvolver;



  var convolverNode, convolverGain;
  var convDirectGainNode;


  var convolutionInfo = [{
      name: 'telephone',
      mainGain: 0.0,
      sendGain: 3.0,
      url: 'filter-telephone.wav'
    },
    {
      name: 'sp50-65ms',
      mainGain: 1.0,
      sendGain: 2.5,
      url: 'spreader50-65ms.wav'
    },
    {
      name: 'spring',
      mainGain: 0.0,
      sendGain: 2.4,
      url: 'feedback-spring.wav'
    },
    {
      name: 'Church',
      mainGain: 1,
      sendGain: 1,
      url: 's2_r4_bd.wav'
    },
    {
      name: 'Kitchen',
      mainGain: 0.6,
      sendGain: 3.0,
      url: 'kitchen-true-stereo.wav'
    },
    {
      name: 'Bedroom',
      mainGain: 0.7,
      sendGain: 1.5,
      url: 'living-bedroom-leveled.wav'
    },
    {
      name: 'wildecho',
      mainGain: 1.0,
      sendGain: 1.0,
      url: 'wildecho.wav'
    },
    {
      name: 'wildecho-old',
      mainGain: 1.0,
      sendGain: 1.0,
      url: 'wildecho-old.wav'
    },
    {
      name: 'z-l-stereo',
      mainGain: 0.0,
      sendGain: 3.0,
      url: 'zing-long-stereo.wav'
    },
    {
      name: 'zoot',
      mainGain: 0.7,
      sendGain: 1.5,
      url: 'zoot.wav'
    }

  ];

  var IMPULSE_URL_PREFIX = 'impulse/';
  var RADIO_TPL = '<option value="{%id%}">{%name%}</option>';

  var i, temp1, temp2;

  temp2 = '';
  for (i = 0; i < convolutionInfo.length; i++) {
    temp1 = RADIO_TPL.replace(/\{%id%\}/g, 'echo-' + i).replace(/\{%name%\}/g, convolutionInfo[i].name);
    temp2 += temp1;
  }
  document.getElementById('echo_list').innerHTML += temp2;

  $.getJSON(stationAddr + '/api/stations', function (stData) {
    streamUrl = stData[stationId].listen_url.split('?').shift();
    $('.songtitle').html(stData[stationId].name);
    $('audio').html('<source src="' + streamUrl + '" type="audio/mp3" />');

    $('.song-request').html('<iframe src = "' + stationAddr + '/public/' + stData[stationId].shortcode + '/embed-requests" frameborder = "0" allowtransparency = "true" style = "width: 100%; height: 100%;" > < /iframe>');
  });

  $('.reset').click(function () {
    app.reset();
    for (var i = 0; i < freqValues.length; i++) {
      freqFilter[i].gain.value = 0;
      $('.range-slider__thumb').html(0);
    }
  });

  const sliderThumbSize = 24;
  const sliderHeight = 300;
  const convSliderHeight = 150;


  $('.sliders').children().on("input change", function () {
    var rangeSliderValue = parseInt($(this).children('input').val());
    var rangeSliderNumber = $(this).index();
    // $(this).children('.range-slider__thumb').html(((rangeSliderValue - 50) / 5).toFixed(0));
    freqFilter[rangeSliderNumber - 1].gain.value = ((rangeSliderValue - 50) / 5).toFixed(0);
  });

  function preampSlider(rangeId, rangeSliderValue) {
    var pct = rangeSliderValue * ((sliderHeight - sliderThumbSize) / sliderHeight);
    if (rangeId == 'conv-gain') {
      pct /= 3;
    }
    $('#' + rangeId).val(rangeSliderValue).parent()
      .children('.preamp-slider__thumb')
      .css({
        'bottom': pct + '%'
      })
      .html((rangeSliderValue).toFixed(0))
      .parent()
      .children('.preamp-slider__bar').css({
        'height': pct + '%'
      });
  }
  $('.amp-input').on('input change', function () {
    var rangeId = $(this).children('input').attr('id');
    var rangeSliderValue = parseInt($(this).children('input').val());
    preampSlider(rangeId, rangeSliderValue);
    eqIn.gain.value = ($('#amp-input').val() / 100);
  });
  $('.amp-output').on('input change', function () {
    var rangeId = $(this).children('input').attr('id');
    var rangeSliderValue = parseInt($(this).children('input').val());
    preampSlider(rangeId, rangeSliderValue);

    outPredmaster.gain.value = ($('#amp-output').val() / 100);

  });

  $('.direct-gain').on("input change", function () {
    var rangeId = $(this).children('input').attr('id');
    var rangeSliderValue = parseInt($(this).children('input').val());
    preampSlider(rangeId, rangeSliderValue);
    convDirectGainNode.gain.value = ($('#direct-gain').val() / 100);
  });
  $('.conv-gain').on("input change", function () {
    var rangeId = $(this).children('input').attr('id');
    var rangeSliderValue = parseInt($(this).children('input').val());
    preampSlider(rangeId, rangeSliderValue);
    convolverGain.gain.value = ($('#conv-gain').val() / 100);
  });
  //////*************  ***************  ***********  **************************///////////////
  //////************  *  *************  ***********  **************************///////////////
  //////***********  ***  ************  ***********  **************************///////////////
  //////**********  *****  ***********  ***********  **************************///////////////
  //////**********  ******  **********  ***********  **************************///////////////
  //////**********  *******  *********  ***********  **************************///////////////
  //////**********            ********  ***********  **************************///////////////
  //////**********  *********  *******  ***********  **************************///////////////
  //////**********  **********  *******  *********  ***************************///////////////
  //////**********  ***********  *******           ****************************///////////////
  function makeAudioctx() {
    try {
      audioCtx = new(window.AudioContext || window.webkitAudioContext)();

      // AudioContext = window.AudioContext || window.webkitAudioContext;
      if (audioCtx == undefined) {
        audioCtx = audioCtx || new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio API is not supported in this browser');
    }
    track = track || audioCtx.createMediaElementSource(audioElement);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;

    eqIn = audioCtx.createGain();
    eqIn.gain.value = 0.75;
    eqOut = audioCtx.createGain();
    // eqOut.gain.value = 0.75;
    eqOut.gain.value = 0.75;
    track.connect(eqIn);

    freqFilter[0] = audioCtx.createBiquadFilter();
    freqFilter[0].type = 'lowshelf';
    freqFilter[0].frequency.value = freqValues[0];
    freqFilter[0].gain.value = 0;
    for (var i = 1; i < freqValues.length - 1; i++) {
      freqFilter[i] = audioCtx.createBiquadFilter();
      freqFilter[i].type = 'peaking';
      freqFilter[i].Q.value = 0.7;
      freqFilter[i].frequency.value = freqValues[i];
      freqFilter[i].gain.value = 0;
    }
    freqFilter[freqValues.length - 1] = audioCtx.createBiquadFilter();
    freqFilter[freqValues.length - 1].type = 'highshelf';
    freqFilter[freqValues.length - 1].frequency.value = freqValues[freqValues.length - 1];
    freqFilter[freqValues.length - 1].gain.value = 0;
var zz = '';
    for (var i = 0; i < freqValues.length; i++) {
      zz = localStorage.getItem('nrg-eq-usrrange' + (i + 1));
      zz = zz / 5 - 10;
      freqFilter[i].gain.value = parseInt(zz);
      if (i > 0) {
        freqFilter[i-1].connect(freqFilter[i]);
      }
      
    }


    
    // for (var ix = 1; ix < freqValues.length + 1; ix++) {
    // }
    // // z = z.split('*');
    // zz = zz.substr(0, zz.length-1).split('*');
  




    eqIn.connect(freqFilter[0]);
    freqFilter[freqValues.length - 1].connect(eqOut);

    convolverIN = audioCtx.createGain();
    convolverOUT = audioCtx.createGain();
    convDirectGainNode = audioCtx.createGain();
    convDirectGainNode.gain.value = 1.0;
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = 0;
    compressor.knee.value = 20;
    compressor.ratio.value = 5;
    compressor.reduction.value = 0;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    convolverIN.connect(convDirectGainNode);
    convDirectGainNode.connect(convolverOUT);
    // convolverIN.connect(convolverOUT);
    outPredmaster = audioCtx.createGain();
    outPredmaster.gain.value = 0.75;
    eqOut.connect(convolverIN);
    convolverOUT.connect(outPredmaster);
    outPredmaster.connect(compressor);
    compressor.connect(audioCtx.destination);

    convolverOUT.connect(analyser);
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    ////////////////////////            CONVOLVER          //////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    var loadedCount = 0,
      loadNum = convolutionInfo.length + 1;

    function loadRes(url, node, callback) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      request.onload = function () {
        audioCtx.decodeAudioData(request.response, function (buffer) {
          node.buffer = buffer;
          if (callback && typeof callback === 'function') {
            callback(buffer);
          }
        }, function () {
          //decode fail
          console.log('source not support');
        });
      };
      request.send();
    }

    convolverNode = audioCtx.createConvolver();
    convolverGain = audioCtx.createGain();
    convolverGain.gain.value = 0.0;
    convolverIN.connect(convolverGain);
    convolverGain.connect(convolverNode);
    convolverNode.connect(convolverOUT);

    var convBtn = false;

    function setConvolution(index) {

      var pctDirect, pctConv;
      if (index >= 0) {
        loadRes(IMPULSE_URL_PREFIX + convolutionInfo[index].url, convolverNode);

        convolverGain.gain.value = convolutionInfo[index].sendGain;
        convDirectGainNode.gain.value = convolutionInfo[index].mainGain;
        // pctDirect = convDirectGainNode.gain.value * 100 * ((convSliderHeight - sliderThumbSize) / convSliderHeight);
        // pctConv = (convolverGain.gain.value * 100 * ((convSliderHeight - sliderThumbSize) / convSliderHeight)) / 3;

        var convolverGainId = $('#conv-gain').attr('id');
        preampSlider(convolverGainId, convolutionInfo[index].sendGain * 100);
        var directGainId = $('#direct-gain').attr('id');
        preampSlider(directGainId, convolutionInfo[index].mainGain * 100);
        $('#conv-gain').prop('disabled', false).parent().removeClass('disabled');
        $('#direct-gain').prop('disabled', false).parent().removeClass('disabled');
        $('.convBtn').prop('disabled', false).addClass('active');
        convBtn = true;

      } else {

        convolverGain.gain.value = 0.0;
        convDirectGainNode.gain.value = 1.0;
        // pctDirect = convDirectGainNode.gain.value * 100 * ((convSliderHeight - sliderThumbSize) / convSliderHeight);
        // pctConv = (convolverGain.gain.value * 100 * ((convSliderHeight - sliderThumbSize) / convSliderHeight)) / 3;
        var convolverGainId = $('#conv-gain').attr('id');
        preampSlider(convolverGainId, convolverGain.gain.value * 100);
        var directGainId = $('#direct-gain').attr('id');
        preampSlider(directGainId, convDirectGainNode.gain.value * 100);
        $('#conv-gain').prop('disabled', true).parent().addClass('disabled');
        $('#direct-gain').prop('disabled', true).parent().addClass('disabled');
        $('.convBtn').prop('disabled', true).removeClass('active');
        convBtn = false;
      }

    }
    var index;
    $('#echo_list').change(function () {
      $('#echo_list option:selected').each(function () {
        // var index;
        index = parseInt((this.value).split('-')[1]);
        if (isNaN(index)) {
          index = -1;
        }
        activeConvolver = index;
        setConvolution(index);
      });
    }).trigger('change');

    $('.convBtn').on('click', function () {
      if (convBtn) {
        $(this).removeClass('active');
        convolverGain.gain.value = 0.0;
        convDirectGainNode.gain.value = 1.0;

        $('#conv-gain').prop('disabled', true).parent().addClass('disabled');
        $('#direct-gain').prop('disabled', true).parent().addClass('disabled');
        convBtn = false;
      } else {
        $(this).addClass('active');
        $('#conv-gain').prop('disabled', false).parent().removeClass('disabled');
        $('#direct-gain').prop('disabled', false).parent().removeClass('disabled');

        convolverGain.gain.value = $('#conv-gain').val() / 100;
        convDirectGainNode.gain.value = $('#direct-gain').val() / 100;
        convBtn = true;

      }
    });

  }

  function reSize() {
    CVS1 = document.getElementById('visualizer');
    CTX1 = document.getElementById('visualizer').getContext('2d');
    CVS1W = CVS1.width = window.innerWidth;
    CVS1H = CVS1.height = window.innerHeight;
    var mainWinHeight = $('.mainwindow').height() + 4;
    if (reqBtnVisible) {
      $('.mainwindow').children().css({
        'transform': 'translateY(-' + mainWinHeight + 'px)'
      });
    }

  }

  reSize();
  $(window).resize(function () {
    reSize();

  });

  function flip() {
    if (animate == 'auto') {
      if (forward) {
        forward = false;
      } else {
        forward = true;
      }
    }
    setTimeout(flip, animateSwitch);
  }

  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  ///////////////////     VISUALIZER        ////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////

  function Visualizer() {

    // perform();
    flip();
    CVS1 = document.getElementById('visualizer');
    // CVS2 = document.getElementById('spectrogram');
    CTX1 = document.getElementById('visualizer').getContext('2d');
    // CTX2 = document.getElementById('spectrogram').getContext('2d');
    CVS1W = CVS1.width = window.innerWidth;
    CVS1H = CVS1.height = window.innerHeight;
    // CVS2W = CVS2.width = window.innerWidth;
    // CVS2H = CVS2.height = window.innerHeight;

    DATA = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(DATA);
    average = getAverageVolume(DATA);


    average = average * heightFactor;

    LEN = DATA.length;

    bars[0] = average;
    average *= 0.8;

    if (playing) {
      var reduce = 0;
      for (var i = 1; i < barCount; i++) {
        average = average - Math.sqrt(average) + 1;
        if (average < 0) {
          average = 0;
        }
        (function (i, average) {
          setTimeout(function () {
            bars[i] = average;
          }, delay * (forward ? i : 60 - i));
        })(i, average);
      }
    }
    requestAnimationFrame(Visualizer);
    draw();
  }


  function draw() {

    CTX1.clearRect(0, 0, CVS1W, CVS1H);
    // set the fill style
    var average = bars[0];
    var rectColor = getColor(average);
    var whiteColor = 'rgba(255,255,255, 0.33)';
    rect((CVS1W / 2) - (lineWidth / 2), (CVS1H / 2) - (average / 2), lineWidth, average, rectColor);
    for (var i = 1; i < 3; i++) {
      rect((CVS1W / 2) - (lineWidth / 2), (CVS1H / 2) - (average / 2), lineWidth, average / 2 ** i, whiteColor);
    }


    for (var i = 1; i < barCount; i++) {
      // var average = bars[i];
      average = bars[i];
      rectColor = getColor(average);
      if (average === undefined || average <= 0) {
        average = 0;
      } else {
        rect((CVS1W / 2) - (lineWidth / 2) + ((lineWidth + lineGap) * i), (CVS1H / 2) - (average / 2), lineWidth, average, rectColor);
        rect((CVS1W / 2) - (lineWidth / 2) - ((lineWidth + lineGap) * i), (CVS1H / 2) - (average / 2), lineWidth, average, rectColor);

        for (var z = 1; z < 3; z++) {

          rect((CVS1W / 2) - (lineWidth / 2) + ((lineWidth + lineGap) * i), (CVS1H / 2) - (average / 2), lineWidth, average / 2 * z, whiteColor);
          rect((CVS1W / 2) - (lineWidth / 2) - ((lineWidth + lineGap) * i), (CVS1H / 2) - (average / 2), lineWidth, average / 2 * z, whiteColor);

        }


      }
    }


    // loop();
  }

  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////

  var originalColors = [
    'hsl(300, 100%, 10%)',
    'purple',
    'magenta',
    'pink',
    'red',
    'orange',
    'yellow',
    'green',
    'cyan',
    'blue'
  ];

  function getColor(val) {
    // account for hue index
    if (hue == 0) {
      colors = _.extend([], originalColors);
      for (var i = 0; i < hue; i++) {
        colors.unshift(colors.pop());
      }
      var whiteIndex = colors.indexOf(originalColors[0]);
      colors.splice(whiteIndex, 1);
      colors.unshift(originalColors[0]);
    } else {
      colors = Array(10);
      colors[0] = originalColors[0];
      var lightness = 49;
      for (var ii = 9; ii >= 1; ii--) {
        colors[ii] = 'hsl(' + hue + ', 100%, ' + lightness + '%)';
        lightness -= 5;
      }
    }

    var colorIndex = Math.floor(val / (10 * heightFactor));
    if (colorIndex > 9) {
      colorIndex = 9;
    } else if (colorIndex < 0) {
      colorIndex = 0;
    }
    return colors[colorIndex];
  }

  function rect(x, y, width, height, color) {
    CTX1.save();
    CTX1.beginPath();

    CTX1.rect(x, y, width, height);

    // CTX1.stroke();
    CTX1.clip();

    CTX1.fillStyle = color;
    CTX1.fillRect(0, 0, CVS1W, CVS1H);
    CTX1.restore();
  }



  function getAverageVolume(array) {
    var values = 0;
    var average;

    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
      values += array[i];
    }

    average = values / length;
    return average;
  }

  $(document).on('keydown', event, function () {
    var keyPressed = event.code.toUpperCase();
    if (keyPressed == 'SPACE' || keyPressed == 'NUMPAD0') {
      random();
    }
  });

  var hueKey = 7;
  var int;

  function random() {
    var h1 = Math.ceil(($(window).height()) / 100) - 2;
    lineWidth = 8 + Math.ceil(Math.random() * 20);
    heightFactor = Math.ceil(Math.random() * h1);
    if (hueKey) {
      hue = Math.ceil(Math.random() * 360);
    } else {
      hue = 0;
      hueKey = 10;
    }
    delay = 50 + Math.ceil(Math.random() * 10);
    lineGap = Math.ceil(Math.random() * 10);
    var winWidth = $(window).width();
    barCount = (winWidth / (lineWidth + lineGap)) / 2;
    hueKey--;
  }

  function pushPlay() {
    CTX1.clearRect(0, 0, CVS1W, CVS1H);

    if (!audioCtx) {
      makeAudioctx();
      Visualizer();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audioElement.load();
    audioElement.play();
    clearInterval(int);

    int = setInterval(random, 500 + Math.ceil(Math.random() * 2000));
    playing = true;
    eqIn.gain.value = 0;
    eqIn.gain.linearRampToValueAtTime((parseInt($('#amp-input').val()) / 100), audioCtx.currentTime + 2);
  }

  function pushStop() {
    CTX1.clearRect(0, 0, CVS1W, CVS1H);

    heightFactor = 0;
    clearInterval(int);
    eqIn.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1, function () {
      audioElement.pause();
      audioCtx.close();
    });
    playing = false;
  }

  $('#play').click(function () {
    pushPlay();
  });
  $('#stop').click(function () {
    pushStop();
  });

  var menuBtnVisible = true;
  var reqBtnVisible = false;
  $('.showMenuButton').on('click', function () {
    if (menuBtnVisible) {
      $('.mainwindow').addClass('invisible');
      $('.showMenuButton').removeClass('visible');
      menuBtnVisible = false;
    } else {
      $('.mainwindow').removeClass('invisible');
      $('.showMenuButton').addClass('visible');
      menuBtnVisible = true;
    }
  });
  var mainWinHeight = $('.mainwindow').height() + 4;
  $('.showRequest').on('click', function () {
    mainWinHeight = $('.mainwindow').height() + 4;
    if (reqBtnVisible) {
      $('.mainwindow').children().css({
        'transform': 'translateY(0px)'
      });

      $('.showRequest').removeClass('visible');
      reqBtnVisible = false;
    } else {
      $('.mainwindow').children().css({
        'transform': 'translateY(-' + mainWinHeight + 'px)'
      });

      $('.showRequest').addClass('visible');
      reqBtnVisible = true;
    }
  });


  $('#eq-selector').change(function () {
    $('#eq-selector option:selected').each(function () {
      var x = app.selectPreset($(this).val());
      if (x) {
        for (var i = 0; i < x.length; i++) {
          var gain = x[i] / 5 - 10;
          if (audioCtx) {
            freqFilter[i].gain.value = gain;
          }
        }
      }
    });
  }).trigger('change');


  // registerServiceWorker();
});