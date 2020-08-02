import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';
import { Map, View } from 'ol';
import { Vector as VectorLayer, Tile as TileLayer } from 'ol/layer';
import { Vector as VectorSource, Stamen } from 'ol/source';
import Feature from 'ol/Feature';
import OSMSource from 'ol/source/OSM';
import Point from 'ol/geom/Point';
import Renderer from 'ol/renderer/webgl/PointsLayer';
import { clamp } from 'ol/math';

const source = new VectorSource();

const client = new XMLHttpRequest();
client.open('GET', 'data/meteorites.csv');
client.onload = function () {
  const csv = client.responseText;
  const features = [];

  let prevIndex = csv.indexOf('\n') + 1; // scan past the header line

  let curIndex;
  while ((curIndex = csv.indexOf('\n', prevIndex)) != -1) {
    const line = csv.substr(prevIndex, curIndex - prevIndex).split(',');
    prevIndex = curIndex + 1;

    const coords = fromLonLat([parseFloat(line[4]), parseFloat(line[3])]);
    if (isNaN(coords[0]) || isNaN(coords[1])) {
      // guard against bad data
      continue;
    }

    features.push(new Feature({
      mass: parseFloat(line[1]) || 0,
      year: parseInt(line[2]) || 0,
      geometry: new Point(coords)
    }));
  }
  source.addFeatures(features);
};
client.send();


const map = new Map({
  target: 'map-container',
  layers: [
    // new TileLayer({
    //   source: new Stamen({
    //     // layer: 'toner' // 'terrain', 'watercolor', 
    //     layer: 'terrain'
    //   })
    // }),

    new TileLayer({
      source: new OSMSource()
    }),

    // new VectorLayer({
    //   source: source
    // })
    new CustomLayer({
      source: source,
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});


//rendering poinsts
// const color = [1, 0, 0, 0.5];
const color = [0, 0, 0, 0.3];

class CustomLayer extends VectorLayer {
  createRenderer() {
    return new Renderer(this, {
      colorCallback: function (feature, vertex, component) {
        return color[component];
      },
      sizeCallback: function (feature) {
        return 18 * clamp(feature.get('mass') / 200000, 0, 1) + 8;
      },
      fragmentShader: `
        precision mediump float;

        uniform float u_currentYear;

        varying vec2 v_texCoord;
        varying vec4 v_color;
        varying float v_opacity;

        void main(void) {
          float impactYear = v_opacity;
          if (impactYear > u_currentYear) {
            discard;
          }

          vec2 texCoord = v_texCoord * 2.0 - vec2(1.0, 1.0);
          float sqRadius = texCoord.x * texCoord.x + texCoord.y * texCoord.y;

          float factor = pow(1.1, u_currentYear - impactYear);

          float value = 2.0 * (1.0 - sqRadius * factor);
          float alpha = smoothstep(0.0, 1.0, value);

          gl_FragColor = v_color;
          gl_FragColor.a *= alpha;
        }`
      ,
      opacityCallback: function (feature) {
        // here the opacity channel of the vertices is used to store the year of impact
        return feature.get('year');
      },
      uniforms: {
        u_currentYear: function () {
          return currentYear;
        }
      },
    });
  }
}


// Animating Points
const minYear = 1850;
const maxYear = 2015;
const span = maxYear - minYear;
const rate = 10; // years per second

const start = Date.now();
let currentYear = minYear;

const yearElement = document.getElementById('year');

function render() {
  const elapsed = rate * (Date.now() - start) / 1000;
  currentYear = minYear + (elapsed % span);
  yearElement.innerText = currentYear.toFixed(0);

  map.render();
  requestAnimationFrame(render);
}

render();

// alert('Hello Workshop');



// import 'ol/ol.css';
// import Map from 'ol/Map';
// import View from 'ol/View';
// import TileLayer from 'ol/layer/Tile';
// import Feature from 'ol/Feature';
// import Point from 'ol/geom/Point';
// import {Vector} from 'ol/source';
// import {fromLonLat} from 'ol/proj';
// import Stamen from 'ol/source/Stamen';
// import WebGLPointsLayer from 'ol/layer/WebGLPoints';

// var vectorSource = new Vector({
//   attributions: 'NASA'
// });

// var oldColor = 'rgba(242,56,22,0.61)';
// var newColor = '#ffe52c';
// var period = 12; // animation period in seconds
// var animRatio =
//   ['^',
//     ['/',
//       ['%',
//         ['+',
//           ['time'],
//           [
//             'interpolate',
//             ['linear'],
//             ['get', 'year'],
//             1850, 0,
//             2015, period
//           ]
//         ],
//         period
//       ],
//       period
//     ],
//     0.5
//   ];

// var style = {
//   variables: {
//     minYear: 1850,
//     maxYear: 2015
//   },
//   filter: ['between', ['get', 'year'], ['var', 'minYear'], ['var', 'maxYear']],
//   symbol: {
//     symbolType: 'circle',
//     size: ['*',
//       ['interpolate', ['linear'], ['get', 'mass'], 0, 8, 200000, 26],
//       ['-', 1.75, ['*', animRatio, 0.75]]
//     ],
//     color: ['interpolate',
//       ['linear'],
//       animRatio,
//       0, newColor,
//       1, oldColor
//     ],
//     opacity: ['-', 1.0, ['*', animRatio, 0.75]]
//   }
// };

// // handle input values & events
// var minYearInput = document.getElementById('min-year');
// var maxYearInput = document.getElementById('max-year');

// function updateMinYear() {
//   style.variables.minYear = parseInt(minYearInput.value);
//   updateStatusText();
// }
// function updateMaxYear() {
//   style.variables.maxYear = parseInt(maxYearInput.value);
//   updateStatusText();
// }
// function updateStatusText() {
//   var div = document.getElementById('status');
//   div.querySelector('span.min-year').textContent = minYearInput.value;
//   div.querySelector('span.max-year').textContent = maxYearInput.value;
// }

// minYearInput.addEventListener('input', updateMinYear);
// minYearInput.addEventListener('change', updateMinYear);
// maxYearInput.addEventListener('input', updateMaxYear);
// maxYearInput.addEventListener('change', updateMaxYear);
// updateStatusText();

// // load data
// var client = new XMLHttpRequest();
// client.open('GET', 'data/csv/meteorite_landings.csv');
// client.onload = function() {
//   var csv = client.responseText;
//   var features = [];

//   var prevIndex = csv.indexOf('\n') + 1; // scan past the header line

//   var curIndex;
//   while ((curIndex = csv.indexOf('\n', prevIndex)) != -1) {
//     var line = csv.substr(prevIndex, curIndex - prevIndex).split(',');
//     prevIndex = curIndex + 1;

//     var coords = fromLonLat([parseFloat(line[4]), parseFloat(line[3])]);
//     if (isNaN(coords[0]) || isNaN(coords[1])) {
//       // guard against bad data
//       continue;
//     }

//     features.push(new Feature({
//       mass: parseFloat(line[1]) || 0,
//       year: parseInt(line[2]) || 0,
//       geometry: new Point(coords)
//     }));
//   }

//   vectorSource.addFeatures(features);
// };
// client.send();

// var map = new Map({
//   layers: [
//     new TileLayer({
//       source: new Stamen({
//         layer: 'toner'
//       })
//     }),
//     new WebGLPointsLayer({
//       style: style,
//       source: vectorSource,
//       disableHitDetection: true
//     })
//   ],
//   target: document.getElementById('map'),
//   view: new View({
//     center: [0, 0],
//     zoom: 2
//   })
// });

// // animate the map
// function animate() {
//   map.render();
//   window.requestAnimationFrame(animate);
// }
// animate();
