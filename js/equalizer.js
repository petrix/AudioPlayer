// String formatter
// var $ = require('jquery');
if (!String.prototype.format) {
  String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}


var eqPresets = {
  // custom: '50*50*50*50*50*50*50',
  hiphop: '60*55*45*45*55*60*80',
  club: '50*65*55*55*65*60*45',
  p3xx: '45*40*50*55*65*70*80'
};



let app = (() => {

  const $svgLine = document.querySelector('svg .line');
  const $svgLineShadow = document.querySelector('svg .line-shadow');
  const sliderThumbSize = 24;
  const sliderHeight = 300;
  const svgViewBoxHeight = 100;
  const svgViewBoxThumbLimit = (sliderThumbSize / 2) * (svgViewBoxHeight / sliderHeight);
  const svgViewBoxGraphMax = svgViewBoxHeight - svgViewBoxThumbLimit;
  const svgViewBoxGraphMin = svgViewBoxThumbLimit;

  let ranges = {
    range1: null,
    range2: null,
    range3: null,
    range4: null,
    range5: null,
    range6: null,
    range7: null
  };
  // Only the y values changes
  let points = {
    begin: {
      x: 10,
      y: 0
    },
    point1: {
      x: 10,
      y: 0
    },
    control1: {
      x: 20,
      y: 10
    },
    control2: {
      x: 20,
      y: 0
    },
    point2: {
      x: 30,
      y: 0
    },
    control3: {
      x: 40,
      y: 0
    },
    point3: {
      x: 50,
      y: 0
    },
    control4: {
      x: 60,
      y: 0
    },
    point4: {
      x: 70,
      y: 0
    },
    control5: {
      x: 80,
      y: 0
    },
    point5: {
      x: 90,
      y: 0
    },
    control6: {
      x: 100,
      y: 0
    },
    point6: {
      x: 110,
      y: 0
    },
    control7: {
      x: 120,
      y: 0
    },
    point7: {
      x: 130,
      y: 0
    },
  };

  function mapDataRange(value) {
    // stackoverflow.com/a/929107/5707008
    // return (((OldValue - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin)) + NewMin
    return (((value - 0) * (svgViewBoxGraphMax - svgViewBoxGraphMin)) / (svgViewBoxHeight - 0)) + svgViewBoxGraphMin;
  }

  function updateSlider($element) {
    if ($element) {

      let rangeIndex = $element.getAttribute('data-slider-index'),
        range = ranges[rangeIndex],
        value = $element.value;
      localStorage.setItem('nrg-eq-usr' + rangeIndex, value);
      if (range === value) {
        return; // No value change, no need to update then
      }
      // Update state
      ranges[rangeIndex] = value;

      let parent = $element.parentElement,
        $thumb = parent.querySelector('.range-slider__thumb'),
        $bar = parent.querySelector('.range-slider__bar'),
        pct = value * ((sliderHeight - sliderThumbSize) / sliderHeight);

      $thumb.style.bottom = `${pct}%`;
      $bar.style.height = `calc(${pct}% + ${sliderThumbSize/2}px)`;
      //$thumb.textContent = `${value}%`;
      $thumb.innerHTML = value / 5 - 10;
      renderSliderGraph();
    }
  }

  function updatePoints() {
    // Convert from percentage to coordinate values
    // Calculate and floor the values
    points.point1.y = svgViewBoxHeight - (svgViewBoxHeight * (ranges.range1) / 100) | 0;
    points.point2.y = svgViewBoxHeight - (svgViewBoxHeight * (ranges.range2) / 100) | 0;
    points.point3.y = svgViewBoxHeight - (svgViewBoxHeight * (ranges.range3) / 100) | 0;
    points.point4.y = svgViewBoxHeight - (svgViewBoxHeight * (ranges.range4) / 100) | 0;
    points.point5.y = svgViewBoxHeight - (svgViewBoxHeight * (ranges.range5) / 100) | 0;
    points.point6.y = svgViewBoxHeight - (svgViewBoxHeight * (ranges.range6) / 100) | 0;
    points.point7.y = svgViewBoxHeight - (svgViewBoxHeight * (ranges.range7) / 100) | 0;

    const max = svgViewBoxGraphMax;
    const min = svgViewBoxGraphMin;

    points.point1.y = mapDataRange(points.point1.y);
    points.point2.y = mapDataRange(points.point2.y);
    points.point3.y = mapDataRange(points.point3.y);
    points.point4.y = mapDataRange(points.point4.y);
    points.point5.y = mapDataRange(points.point5.y);
    points.point6.y = mapDataRange(points.point6.y);
    points.point7.y = mapDataRange(points.point7.y);

    // Update Y for the other points
    points.begin.y = points.point1.y;
    points.control1.y = points.point1.y;
    points.control2.y = points.point2.y;
    points.control3.y = points.point3.y;
    points.control4.y = points.point4.y;
    points.control5.y = points.point5.y;
    points.control6.y = points.point6.y;
    points.control7.y = points.point7.y;
  }

  function getInterpolatedLine(type) {

    let shadowOffset = 0;
    if (type === 'shadow') {
      shadowOffset = 5; // simple simulation, no fancy shadow algorithm
    }

    return 'M {0},{1} L {2},{3} C {4},{5} {6},{7} {8},{9} S {10} {11}, {12} {13} S {14} {15}, {16} {17} S {18} {19}, {20} {21} S {22} {23}, {24} {25} S {26} {27}, {28} {29}'.format(
      // M
      points.begin.x, points.begin.y,
      // L
      points.point1.x, points.point1.y,
      // C
      points.control1.x, points.control1.y,
      points.control2.x, points.control2.y + shadowOffset,
      points.point2.x, points.point2.y + shadowOffset,
      // S
      points.control3.x, points.control3.y,
      points.point3.x, points.point3.y,
      // S
      points.control4.x, points.control4.y + shadowOffset,
      points.point4.x, points.point4.y + shadowOffset,
      // S
      points.control5.x, points.control5.y,
      points.point5.x, points.point5.y,
      // S
      points.control6.x, points.control6.y + shadowOffset,
      points.point6.x, points.point6.y + shadowOffset,
      // S
      points.control7.x, points.control7.y,
      points.point7.x, points.point7.y
    );
  }

  function reset() {
    const inputs = app.inputs;
    inputs.forEach(input => input.value = 50);
    inputs.forEach(input => app.updateSlider(input));
  }

  function renderSliderGraph() {
    updatePoints();
    $svgLine.setAttribute('d', getInterpolatedLine());
    $svgLineShadow.setAttribute('d', getInterpolatedLine('shadow'));
  }
  // var eqPresetNames =['linear', 'hiphop', 'club'];

  // var eqPresetValues = ['50*50*50*50*50*50*50', '60*55*45*45*55*60*80', '50*60*70*50*65*60*45'];



  function selectPreset(type) {
    // Generate random graph
    const inputs = app.inputs;
    var eqGainValue;

    if (type) {
      eqGainValue = eqPresets[type].split('*');
      for (var j = 0; j < eqGainValue.length; j++) {
        inputs[j].value = eqGainValue[j];
      }
      inputs.forEach(input => app.updateSlider(input));

      return eqGainValue;
    } else {
      var z = '';
      for (var i = 1; i < inputs.length + 1; i++) {
        z += localStorage.getItem('nrg-eq-usrrange' + i) + '*';
      }
      // z = z.split('*');
      z = z.substr(0, z.length-1).split('*');
      return z;
    }

  }

  return {
    inputs: [].slice.call(document.querySelectorAll('.sliders input')),
    updateSlider,
    reset,
    selectPreset
  };

})();
// $('.reset').on('click','button',function() {
//   app.reset();
// })
module.exports = app;

(function initAndSetupTheSliders() {
  const inputs = app.inputs;
  let index = 1;
  let index2 = 1;
  inputs.forEach(input => input.setAttribute('data-slider-index', 'range' + index++));
  inputs.forEach(input => input.value = localStorage.getItem('nrg-eq-usrrange' + index2++));

  // inputs[i].value = parseInt(localStorage.getItem('nrg-eq-usrrange' + i));

  inputs.forEach(input => app.updateSlider(input));
  // Cross-browser support where value changes instantly as you drag the handle, therefore two event types.
  inputs.forEach(input => input.addEventListener('input', element => app.updateSlider(input)));
  inputs.forEach(input => input.addEventListener('change', element => app.updateSlider(input)));
  // inputs.forEach(input => input.addEventListener('input change', element => app.updateSlider(input)));


})();