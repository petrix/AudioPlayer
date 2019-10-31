require('scssify');
require('./jquery-ui.css');
// var $ = require('jquery');
// $.mobile = require('./jquery-ui.js');
// window.$ = window.jQuery = require('jquery');
// require('jquery-mobile');
require('./main.scss');
var app = require('./equalizer.js');
var _ = require('lodash');
var audioCtx;
// var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
var audioElement = document.querySelector('audio');
// var track = track || audioCtx.createMediaElementSource(audioElement);
var track;
var analyser;
var bufferLength;
var dataArray;
var analyserInput;
var outPredmaster;
var track;
var eqIn;
var eqOut;
var convolverIN;
var convolverOUT;
var compressor;
var stationAddr = 'http://bratan.tk';
var stationId = 2;
var streamUrl;
var spectroOffset = 0;
var freqValues = [64, 128, 256, 512, 1024, 2048, 4096];
var freqFilter = [];
// var freqFilter = freqValues.length;
var obj = {};
obj.canvas = document.getElementById('visualizer');
obj.ctx = obj.canvas.getContext('2d');
obj.width = obj.canvas.innerWidth;
obj.height = obj.canvas.innerHeight;
const CVS = document.body.querySelector('canvas');
const CTX = CVS.getContext('2d');
const W = CVS.width = window.innerWidth;
const H = CVS.height = window.innerHeight;

var gainNodes = [],
  convolutionNodes = [];
// directNodes = [];

var convDirectGainNode;


var convolutionInfo = [{
    name: 'telephone',
    mainGain: 0.0,
    sendGain: 3.0,
    url: 'filter-telephone.wav'
  },
  {
    name: 'spreader50-65ms',
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
    url: 'bin_dfeq/s2_r4_bd.wav'
  },
  {
    name: 'Kitchen',
    mainGain: 0.6,
    sendGain: 3.0,
    url: 'house-impulses/kitchen-true-stereo.wav'
  },
  {
    name: 'Bedroom',
    mainGain: 0.7,
    sendGain: 1.5,
    url: 'house-impulses/living-bedroom-leveled.wav'
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
    name: 'zing-long-stereo',
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


$(document).ready(function () {
  $.getJSON(stationAddr + '/api/stations', function (stData) {
    streamUrl = stData[stationId].listen_url.split('?').shift();
    $('.songtitle').html(stData[stationId].name);
    $('audio').html('<source src="' + streamUrl + '" type="audio/mp3" />');
    // $('.request').html('<iframe src = "' + stationAddr + '/public/' + stData[stationId].shortcode + '/embed-requests" frameborder = "0" allowtransparency = "true" style = "width: 100%; height: 100%;" > < /iframe>');
  });

  $('.reset').click(function () {
    app.reset();
  });

  function initCanvas() {
    obj.canvas = document.getElementById('visualizer');
    obj.ctx = obj.canvas.getContext('2d');
    obj.width = window.innerWidth;
    obj.height = window.innerHeight;
  }
  $(window).resize(function () {
    initCanvas();

  });

  const sliderThumbSize = 24;
  const sliderHeight = 300;
  const convSliderHeight = 150;

  $("#slider-range").slider({
    range: true,
    min: -99,
    max: 0,
    step: 1,
    values: [-80, -20],
    slide: function (event, ui) {
      analyser.minDecibels = ui.values[0];
      analyser.maxDecibels = ui.values[1];

      $(this).children('span:first').html(ui.values[0] + 99).parent().children('span:last').html(ui.values[1] + 99);

    }
  });


  $('.sliders').children().on("input change", function () {
    var rangeSliderValue = parseInt($(this).children('input').val());
    var rangeSliderNumber = $(this).index();
    $(this).children('.range-slider__thumb').html(((rangeSliderValue - 50) / 5).toFixed(0));
    freqFilter[rangeSliderNumber - 1].gain.value = ((rangeSliderValue - 50) / 5).toFixed(0);
  });
  // $('.preamp-sliders').children().on("input change", function () {
  //   var rangeSliderValue = parseInt($(this).children('input').val());
  //   var pct = rangeSliderValue * ((sliderHeight - sliderThumbSize) / sliderHeight)
  //   $(this)
  //     .children('.preamp-slider__thumb')
  //     .css({
  //       'bottom': pct + '%'
  //     })
  //     .html((rangeSliderValue).toFixed(0))
  //     .parent()
  //     .children('.preamp-slider__bar').css({
  //       'height': pct + '%'
  //     });
    $('.preamp1').on('input change', function () {
      var rangeSliderValue = parseInt($(this).children('input').val());
    var pct = rangeSliderValue * ((sliderHeight - sliderThumbSize) / sliderHeight);
    $(this)
      .children('.preamp-slider__thumb')
      .css({
        'bottom': pct + '%'
      })
      .html((rangeSliderValue).toFixed(0))
      .parent()
      .children('.preamp-slider__bar').css({
        'height': pct + '%'
      });
    eqIn.gain.value = ($('#preamp1').val() / 100);

    });
    $('.preamp2').on('input change', function () {

      var rangeSliderValue = parseInt($(this).children('input').val());
      var pct = rangeSliderValue * ((sliderHeight - sliderThumbSize) / sliderHeight);
      $(this)
        .children('.preamp-slider__thumb')
        .css({
          'bottom': pct + '%'
        })
        .html((rangeSliderValue).toFixed(0))
        .parent()
        .children('.preamp-slider__bar').css({
          'height': pct + '%'
        });
  
      outPredmaster.gain.value =($('#preamp2').val() / 100);
      
    });

  // });
  $('.conv-gain').on("input change", function () {
    var rangeSliderValue = parseInt($(this).children('input').val());
    var pct = rangeSliderValue * ((convSliderHeight - sliderThumbSize) / convSliderHeight);
    $(this)
      .children('.conv-slider__thumb')
      .css({
        'bottom': pct / 3 + '%'
      })
      .html((rangeSliderValue).toFixed(0))
      .parent()
      .children('.conv-slider__bar').css({
        'height': pct / 3 + '%'
      });
    for (var i = 0; i < convolutionInfo.length; i++) {
      if ($('#echo' + i).is(':checked')) {
        gainNodes[i].gain.value = ($('#convolverGain').val() / 100);
      }
    }

  });
  $('.direct-gain').on("input change", function () {
    var rangeSliderValue = parseInt($(this).children('input').val());
    var pct = rangeSliderValue * ((convSliderHeight - sliderThumbSize) / convSliderHeight);
    $(this)
      .children('.conv-slider__thumb')
      .css({
        'bottom': pct + '%'
      })
      .html((rangeSliderValue).toFixed(0))
      .parent()
      .children('.conv-slider__bar').css({
        'height': pct + '%'
      });
    convDirectGainNode.gain.value = ($('#directGain').val() / 100);
  });






  $('#presets').change(function () {
    $('#presets option:selected').each(function () {
      app.selectPreset(this);
    });
  }).trigger('change');

  function makeAudioctx() {
    console.log('makeAudioCtx')
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
    // analyser.fftSize = 1024;
    analyser.fftSize = 64;
    analyser.minDecibels = -80;
    analyser.maxDecibels = -20;
    // analyser.smoothingTimeConstant = 0.5;
    // analyser.smoothingTimeConstant = 0.85;
    analyser.smoothingTimeConstant = 0.9;
    // bufferLength = analyser.frequencyBinCount;
    // dataArray = new Uint8Array(bufferLength);
    // analyser.getByteTimeDomainData(dataArray);

    eqIn = audioCtx.createGain();
    eqIn.gain.value = 1;
    eqOut = audioCtx.createGain();
    eqOut.gain.value = 1;
    track.connect(eqIn);
    // track.connect(eqOut);
    freqFilter[0] = audioCtx.createBiquadFilter();
    freqFilter[0].type = 'lowshelf';
    // freqFilter[0].Q.value = 0;
    freqFilter[0].frequency.value = freqValues[0];
    freqFilter[0].gain.value = 1;
    for (var i = 1; i < freqValues.length - 1; i++) {
      freqFilter[i] = audioCtx.createBiquadFilter();
      freqFilter[i].type = 'peaking';
      freqFilter[i].Q.value = .7;
      freqFilter[i].frequency.value = freqValues[i];
      freqFilter[i].gain.value = 1;
    }
    freqFilter[freqValues.length - 1] = audioCtx.createBiquadFilter();
    freqFilter[freqValues.length - 1].type = 'highshelf';
    // freqFilter[freqValues.length-1].Q.value = 0;
    freqFilter[freqValues.length - 1].frequency.value = freqValues[freqValues.length - 1];
    freqFilter[freqValues.length - 1].gain.value = 1;

    for (var i = 1; i < freqValues.length; i++) {
      freqFilter[i - 1].connect(freqFilter[i]);
    }

    eqIn.connect(freqFilter[0]);
    freqFilter[freqValues.length - 1].connect(eqOut);

    convolverIN = audioCtx.createGain();
    convolverOUT = audioCtx.createGain();
    convDirectGainNode = audioCtx.createGain();
    convDirectGainNode.gain.value = 0.0;
    convolverIN.connect(convDirectGainNode);
    convDirectGainNode.connect(convolverOUT);
    // convolverIN.connect(convolverOUT);
    outPredmaster = audioCtx.createGain();
    outPredmaster.gain.value = 1;
    eqOut.connect(convolverIN);


    var loadedCount = 0,
      loadNum = convolutionInfo.length + 1;
    var i, temp1, temp2;
    var IMPULSE_URL_PREFIX = 'impulse/';
    var RADIO_TPL = '<div><label for="{%id%}"><input type="radio" name="echo" id="{%id%}" /><label for="{%id%}">{%name%}</label></div>';

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
          alert('source not support');
        });
      };
      request.send();
    }

    function loadMark() {
      loadedCount++;
      document.getElementById('play').value = '加载中...(' + loadedCount + '/' + loadNum + ')';
      if (loadedCount >= loadNum) {
        document.getElementById('stop').removeAttribute('disabled');
        document.getElementById('stop').value = 'play';
      }
    }
    for (i = 0; i < convolutionInfo.length; i++) {
      convolutionNodes[i] = audioCtx.createConvolver();
      loadRes(IMPULSE_URL_PREFIX + convolutionInfo[i].url, convolutionNodes[i], loadMark);
      gainNodes[i] = audioCtx.createGain();
      gainNodes[i].gain.value = 0.0;

      convolverIN.connect(convolutionNodes[i]);
      convolutionNodes[i].connect(gainNodes[i]);
      gainNodes[i].connect(convolverOUT);
    }


    function setConvolution(index) {
      for (i = 0; i < gainNodes.length; i++) {
        gainNodes[i].gain.value = 0.0;
      }
      // var rangeSliderValue = parseInt($(this).children('input').val());
      var pctDirect, pctConv;
      if (index >= 0) {
        gainNodes[index].gain.value = convolutionInfo[index].sendGain;
        convDirectGainNode.gain.value = convolutionInfo[index].mainGain;
        pctDirect = convDirectGainNode.gain.value * 100 * ((convSliderHeight - sliderThumbSize) / convSliderHeight);
        pctConv = (gainNodes[index].gain.value * 100 * ((convSliderHeight - sliderThumbSize) / convSliderHeight)) / 3;
        $('#convolverGain').val(gainNodes[index].gain.value * 100).parent()
          .children('.conv-slider__thumb')
          .css({
            'bottom': pctConv + '%'
          })
          .html((gainNodes[index].gain.value * 100).toFixed())
          .parent().children('.conv-slider__bar').css({
            'height': pctConv + '%'
          });

        $('#directGain').val(convDirectGainNode.gain.value * 100).parent()
          .children('.conv-slider__thumb')
          .css({
            'bottom': pctDirect + '%'
          })
          .html((convDirectGainNode.gain.value * 100).toFixed())
          .parent().children('.conv-slider__bar').css({
            'height': pctDirect + '%'
          });

      } else {

        gainNodes[0].gain.value = 0.0;
        convDirectGainNode.gain.value = 1.0;
        pctDirect = convDirectGainNode.gain.value * 100 * ((convSliderHeight - sliderThumbSize) / convSliderHeight);
        pctConv = (gainNodes[0].gain.value * 100 * ((convSliderHeight - sliderThumbSize) / convSliderHeight)) / 3;

        $('#convolverGain').val(gainNodes[0].gain.value * 100).parent()
          .children('.conv-slider__thumb')
          .css({
            'bottom': pctConv + '%'
          })
          .html((gainNodes[0].gain.value * 100).toFixed())
          .parent().children('.conv-slider__bar').css({
            'height': pctConv + '%'
          });

        $('#directGain').val(convDirectGainNode.gain.value * 100).parent()
          .children('.conv-slider__thumb')
          .css({
            'bottom': pctDirect + '%'
          })
          .html((convDirectGainNode.gain.value * 100).toFixed())
          .parent().children('.conv-slider__bar').css({
            'height': pctDirect + '%'
          });
      }

    }


    temp2 = '';
    for (i = 0; i < convolutionInfo.length; i++) {
      temp1 = RADIO_TPL.replace(/\{%id%\}/g, 'echo' + i).replace(/\{%name%\}/g, convolutionInfo[i].name);
      temp2 += temp1;
    }
    document.getElementById('echo_list').innerHTML += temp2;

    for (i = 0; i < convolutionInfo.length; i++) {
      document.getElementById('echo' + i).onclick = (function (x) {
        return function () {
          setConvolution(x);
        }
      })(i);
    }
    document.getElementById('no_sound').onclick = function () {
      setConvolution(-1);
    };
    setConvolution(-1);
    convolverOUT.connect(outPredmaster);

    outPredmaster.connect(audioCtx.destination);

    outPredmaster.connect(analyser);
    console.log(analyser);

  }

  function Visualizer() {

    const DATA = new Uint8Array(analyser.frequencyBinCount);
    const LEN = DATA.length;
    const h = H / LEN;
    const x = W - 1;
    CTX.fillStyle = 'hsl(280, 100%, 10%)';
    CTX.fillRect(0, 0, W, H);

    draw();
    // loop();
    function  draw() {
      window.requestAnimationFrame(draw);
      CTX.clearRect(0,0,W,H);
      analyser.getByteFrequencyData(DATA);
      var FW =  (CVS.width / LEN* 1.2),
      FH = 1,
      x=0;
      for (var i = 0; i < LEN; i++) {
        FH = DATA[i] * (H * 0.0035);
  
        CTX.fillStyle = "rgba(0, 0, 0, .5)";
        CTX.fillRect(x, H - FH, FW, FH);
        x += FW + 1;
      }

    }
    function loop() {
      window.requestAnimationFrame(loop);
      let imgData = CTX.getImageData(1, 0, W - 1, H);
      CTX.fillRect(0, 0, W, H);
      CTX.putImageData(imgData, 0, 0);
      // analyser.getByteTimeDomainData(DATA);
      analyser.getByteFrequencyData(DATA);
      // analyser.getFloatTimeDomainData(DATA);
      for (let i = 0; i < LEN; i++) {
        let rat = DATA[i] / 255;
        let hue = Math.round((rat * 180) + 280 % 360);
        // let hue = Math.round((rat * 360) % 360);
        let sat = '100%';
        let lit = 10 + (70 * rat) + '%';
        // let lit = 50 +'%';
        CTX.beginPath();
        CTX.strokeStyle = `hsl(${hue}, ${sat}, ${lit})`;
        CTX.moveTo(x, H - (i * h));
        CTX.lineTo(x, H - (i * h + h));
        CTX.stroke();
      }
    }



  }



  function pushPlay() {

    // audioElement.append('<source src="' + streamUrl + '" type="audio/mp3" />');
    if (!audioCtx) {
      makeAudioctx();
      Visualizer();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // createEQ();
    audioElement.load();
    audioElement.play();

  }

  function pushStop() {
    audioElement.pause();
  }

  $('.play').click(function () {
    pushPlay();
  });
  $('.stop').click(function () {
    pushStop();
  });



});