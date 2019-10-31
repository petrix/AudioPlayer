 
 
 
 var convolutionInfo = require('./__convolutionInfo');
 
 var loadedCount = 0,
    loadNum = convolutionInfo.length + 1;
  var i, temp1, temp2;
  var IMPULSE_URL_PREFIX = 'impulse/';
  var RADIO_TPL = '<div><label for="{%id%}"><input type="radio" name="echo" id="{%id%}" />{%name%}</div>';







setConvolution = function (index) {
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
  // return module.exports;

};
loadRes = function (url, node, callback) {
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
  // return module.exports;
};
  
loadMark = function () {
  loadedCount++;
  document.getElementById('play').value = '加载中...(' + loadedCount + '/' + loadNum + ')';
  if (loadedCount >= loadNum) {
    document.getElementById('stop').removeAttribute('disabled');
    document.getElementById('stop').value = 'play';
  }
  // return module.exports;
};

  module.exports = loadMark;
  module.exports.loadRes = loadRes;
  module.exports.setConvolution = setConvolution;
