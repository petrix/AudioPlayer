require('scssify');
require('./jquery-ui.css');
var $ = require('jquery');
// $.mobile = require('./jquery-ui.js');
// window.$ = window.jQuery = require('jquery');
// require('jquery-mobile');
require('./main.scss');
var _ = require('lodash');
// var setConvolution = require('./convolver.js');
// var loadMark = require('./convolver.js');
// var loadRes = require('./convolver.js');

var app = require('./equalizer.js');
// require('./vizualizr');
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
// obj.canvas = document.getElementById('visualizer');
// obj.ctx = obj.canvas.getContext('2d');
// obj.width = obj.canvas.innerWidth;
// obj.height = obj.canvas.innerHeight;
var CVS1, CVS2, CTX1, CTX2, CVS1W, CVS1H, CVS2W, CVS2H;
// var CVS1 = CVS2 = document.getElementById('visualizer');
// // var CVS2  = document.getElementById('spectrogram');
// var CTX1 = CVS1.getContext('2d');
// var CTX2 = CVS2.getContext('2d');
// var CVS1W = CVS1.width = window.innerWidth;
// var CVS1H = CVS1.height = window.innerHeight;
// var CVS2W = CVS2.width = window.innerWidth;
// var CVS2H = CVS2.height = window.innerHeight;

// var canvas = $('canvas')[0];
// var ctx = canvas.getContext('2d');
var playing = false;
var bars = Array(300);
var forward = true;
var barCount = 100;
var lineWidth = 5;
var lineGap = 2;
var heightFactor = 10;
var delay = 17;
var animate = 'auto';
var animateSwitch = 30 * 1000;
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

var gainNodes = [],
  convolutionNodes = [];
// directNodes = [];

var convDirectGainNode;

// var convolutionInfo = require('./convolutionInfo.js');



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


var loadedCount = 0,
loadNum = convolutionInfo.length + 1;
var i, temp1, temp2;
var IMPULSE_URL_PREFIX = 'impulse/';
var RADIO_TPL = '<div><label for="{%id%}"><input type="radio" name="echo" id="{%id%}" />{%name%}</div>';


// $(document).ready(function () {
// var hash = globalHash = getHash();

$.getJSON(stationAddr + '/api/stations', function (stData) {
  streamUrl = stData[stationId].listen_url.split('?').shift();
  $('.songtitle').html(stData[stationId].name);
  $('audio').html('<source src="' + streamUrl + '" type="audio/mp3" />');
  // $('.request').html('<iframe src = "' + stationAddr + '/public/' + stData[stationId].shortcode + '/embed-requests" frameborder = "0" allowtransparency = "true" style = "width: 100%; height: 100%;" > < /iframe>');
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

  outPredmaster.gain.value = ($('#preamp2').val() / 100);

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
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.75;

  eqIn = audioCtx.createGain();
  eqIn.gain.value = 1;
  eqOut = audioCtx.createGain();
  eqOut.gain.value = 1;
  track.connect(eqIn);
  // track.connect(eqOut);
  freqFilter[0] = audioCtx.createBiquadFilter();
  freqFilter[0].type = 'lowshelf';
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
  outPredmaster.gain.value = 1;
  eqOut.connect(convolverIN);
  convolverOUT.connect(outPredmaster);
  outPredmaster.connect(compressor);
  compressor.connect(audioCtx.destination);

  convolverOUT.connect(analyser);
  console.log(analyser);





  for (i = 0; i < convolutionInfo.length; i++) {
    convolutionNodes[i] = audioCtx.createConvolver();
    loadRes(IMPULSE_URL_PREFIX + convolutionInfo[i].url, convolutionNodes[i], loadMark);
    gainNodes[i] = audioCtx.createGain();
    gainNodes[i].gain.value = 0.0;

    convolverIN.connect(convolutionNodes[i]);
    convolutionNodes[i].connect(gainNodes[i]);
    gainNodes[i].connect(convolverOUT);
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
  // convolverIN.connect(convolverOUT);


}

function initCanvas() {
  // var CVS1 = document.getElementById('visualizer').getContext('2d');
  // var CVS2 = document.getElementById('spectrogram').getContext('2d');
  CVS1 = document.getElementById('visualizer');
  // CVS2 = document.getElementById('spectrogram');
  CTX1 = document.getElementById('visualizer').getContext('2d');
  // CTX2 = document.getElementById('spectrogram').getContext('2d');
  CVS1W = CVS1.width = window.innerWidth;
  CVS1H = CVS1.height = window.innerHeight;
  // CVS2W = CVS2.width = window.innerWidth;
  // CVS2H = CVS2.height = window.innerHeight;
  // barCount = (CVS1.width / (lineWidth * 2));
  // console.log(barCount);

}
initCanvas();
$(window).resize(function () {
  initCanvas();

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
///////////////////     CONVOLVER       ////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////



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

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
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
  // if(average>67.77){
  //   console.log(average);
  //   random();
  // }

  average = average * heightFactor;

  LEN = DATA.length;
  // h = CVS2H / LEN;
  // x = CVS2W - 2;
  // CTX2.fillStyle = 'hsl(280, 100%, 10%)';
  // CTX2.fillRect(0, 0, CVS2W, CVS2H);


  bars[0] = average;
  average *= 0.8;
  // console.log(barCount);

  if (playing) {
    var reduce = 0;
    // console.log(barCount);
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
  // loop();
  requestAnimationFrame(Visualizer);
  draw();
  // updateHash();
}


function draw() {

  CTX1.clearRect(0, 0, CVS1W, CVS1H);
  // set the fill style
  var average = bars[0];
  var color = getColor(average);
  rect((CVS1W / 2) - (lineWidth / 2), (CVS1H / 2) - (average / 2), lineWidth, average, color);
  for (var i = 1; i < barCount; i++) {
    var average = bars[i];
    color = getColor(average);
    if (average === undefined || average <= 0) {
      average = 0;
    } else {
      rect((CVS1W / 2) - (lineWidth / 2) + ((lineWidth + lineGap) * i), (CVS1H / 2) - (average / 2), lineWidth, average, color);
      rect((CVS1W / 2) - (lineWidth / 2) - ((lineWidth + lineGap) * i), (CVS1H / 2) - (average / 2), lineWidth, average, color);
    }
  }
  // loop();
}

function loop() {
  // requestAnimationFrame(loop)
  let imgData = CTX2.getImageData(1, 0, CVS2W - 1, CVS2H);
  CTX2.fillRect(0, 0, CVS2W, CVS2H);
  CTX2.putImageData(imgData, 0, 0);
  for (let i = 0; i < LEN; i++) {
    let rat = DATA[i] / 255;
    let hue = Math.round((rat * 180) + 280 % 360);
    // let hue = Math.round((rat * 360) % 360);
    let sat = '100%';
    let lit = 10 + (70 * rat) + '%';
    // let lit = 50 +'%';
    var color = `hsl(${hue}, ${sat}, ${lit})`;
    // rect2(x,(CVS2H - (i * h)),( CVS2H - (i * h + h)), CVS2H, color);
    // rect2((CVS2W / 2) - (lineWidth / 2) - ((lineWidth + lineGap) * i), (CVS2H / 2) - (average / 2), lineWidth, average, color);

    CTX2.beginPath();
    CTX2.moveTo(x, CVS2H - (i * h));
    CTX2.lineTo(x, CVS2H - (i * h + h));
    CTX2.strokeStyle = `hsl(${hue}, ${sat}, ${lit})`;
    CTX2.stroke();
  }
}
// console.log('lineWidth',lineWidth,'heightFactor',heightFactor,'hue', hue,'delay',delay, 'lineGap', lineGap);




var originalColors = [
  '#333',
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
    var whiteIndex = colors.indexOf('#333');
    colors.splice(whiteIndex, 1);
    colors.unshift('#333');
  } else {
    colors = Array(10);
    colors[0] = '#333';
    var lightness = 49;
    for (var i = 9; i >= 1; i--) {
      colors[i] = 'hsl(' + hue + ', 100%, ' + lightness + '%)'
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
  CTX1.stroke();
  CTX1.clip();

  CTX1.fillStyle = color;
  CTX1.fillRect(0, 0, CVS1W, CVS1H);
  CTX1.restore();
}

function rect2(x, y, width, height, color) {
  CTX2.save();
  CTX2.beginPath();
  CTX2.moveTo(x, y);
  CTX2.lineTo(x, width);
  CTX2.strokeStyle = color;
  CTX2.stroke();


  // CTX2.beginPath();
  // CTX2.rect(x, y, width, height);
  // CTX2.stroke();
  // CTX2.clip();

  // CTX2.fillStyle = color;
  // CTX2.fillRect(0, 0, CVS2W, CVS2H);
  CTX2.restore();
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


$('.field').on('input change', function () {
  var rangeSliderValue = parseInt($(this).children('input').val());

  var pct = rangeSliderValue * ((convSliderHeight - sliderThumbSize) / convSliderHeight);
  $(this)
    .children('.field__thumb')
    .css({
      'bottom': pct + '%'
    })
    .html((rangeSliderValue).toFixed(0))
    .parent()
    .children('.field__bar').css({
      'height': pct + '%'
    });

  // outPredmaster.gain.value = ($('#preamp2').val() / 100);

});

$out.on('click', function (evt) {
  if (evt.currentTarget.checked) {
    forward = true;
    animate = 'out';
  }
});

$in.on('click', function (evt) {
  if (evt.currentTarget.checked) {
    forward = false;
    animate = 'in';
  }
});

$auto.on('click', function (evt) {
  if (evt.currentTarget.checked) {
    animate = 'auto';
  }
})

$delay.on('input', function () {
  var val = $delay.val();
  // console.log( val * 1.2 );
  delay = Math.floor(val * 1.2);
});

$width.on('input', function () {
  var winWidth = $(window).width();
  barCount = (winWidth / (lineWidth + lineGap)) / 2;
  lineWidth = 1 + Math.floor(($width.val() / 2));
  console.log('lineWidth ', lineWidth);
});

$gap.on('input', function () {
  lineGap = Math.floor(($gap.val() / 2.5));
  console.log('lineGap', lineGap);
});

$height.on('input', function () {
  heightFactor = 1 + ($height.val() / 10);
  console.log('heightFactor', heightFactor);

});

$autoDelay.on('input', function () {
  animateSwitch = Math.floor($autoDelay.val() / 10) * 1000;

})

$hue.on('input', function () {
  // hue = Math.floor( $hue.val() / 10 );
  hue = Math.floor((361 * ($hue.val() / 100)));
});
$(document).on('keydown', event, function () {
  var keyPressed = event.code.toUpperCase();
  console.log(keyPressed);
  if (keyPressed == 'SPACE' || keyPressed == 'NUMPAD0') {
    // console.log((Math.random()*100).toFixed(0));
    random();
  }
});
// var vizualVars = ['lineWidth','lineGap','heightFactor','delay', 'hue']
// var vizualVarsValues = ['5 100','2 50','5 100','1 100', '0 360']
clearInterval(int);
var int = setInterval(random, 500 + Math.ceil(Math.random() * 2000));
var hueKey = 7;

function random() {

  lineWidth = 5 + Math.ceil(Math.random() * 30);
  heightFactor = Math.ceil(Math.random() * 20);
  if (hueKey) {
    hue = Math.ceil(Math.random() * 360);
  } else {
    hue = 0;
    hueKey = 10;
  }

  delay = 50 + Math.ceil(Math.random() * 10);
  lineGap = Math.ceil(Math.random() * 5);
  var winWidth = $(window).width();
  barCount = (winWidth / (lineWidth + lineGap)) / 2;
  // console.log('lineWidth',lineWidth,'heightFactor',heightFactor,'hue', hue,'delay',delay, 'lineGap', lineGap);
  hueKey--;
}

function pushPlay() {

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
  playing = true;


}

function pushStop() {
  audioElement.pause();
  playing = false;
}

$('.play').click(function () {
  pushPlay();
});
$('.stop').click(function () {
  pushStop();
});
var btnVisible = true;
$('.showMenuButton').on('click', function () {
  if (btnVisible) {
    $('.component').addClass('invisible');
    $('.showMenuButton').removeClass('visible');
    btnVisible = false;
  } else {
    $('.component').removeClass('invisible');
    $('.showMenuButton').addClass('visible');
    btnVisible = true;
  }

});

// });