(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var node = document.querySelector('#canvas');
var context = canvas.getContext('2d');

var WIDTH = 800;
var HEIGHT = 400;

var ANGLE_OFFSET = 0.0001;

var flatten = function flatten(arr) {
  return arr.reduce(function (res, item) {
    return res.concat(item);
  }, []);
};

var vector = function vector(x, y) {
  return { x: x, y: y };
};

var add = function add(v, u) {
  return vector(v.x + u.x, v.y + u.y);
};
var subtract = function subtract(v, u) {
  return vector(v.x - u.x, v.y - u.y);
};

var multiply = function multiply(scalar, v) {
  return vector(scalar * v.x, scalar * v.y);
};
var cross = function cross(v, u) {
  return v.x * u.y - v.y * u.x;
};

var buildLine = function buildLine(x1, y1, x2, y2) {
  return {
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 }
  };
};

var drawLine = function drawLine(start, end) {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
};

var drawPolygon = function drawPolygon(points, color) {
  context.fillStyle = color;
  context.beginPath();
  points.forEach(function (point, index) {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      point && context.lineTo(point.x, point.y);
    }
  });
  context.closePath();
  context.fill();
};

var intersectSegments = function intersectSegments(segment1, segment2) {
  // segment1: p + t * r
  var p = segment1.start;
  var r = subtract(segment1.end, segment1.start);

  // segment2: q + u * s
  var q = segment2.start;
  var s = subtract(segment2.end, segment2.start);

  var tNumerator = cross(subtract(q, p), s);
  var uNumerator = cross(subtract(q, p), r);

  var denominator = cross(r, s);

  // parallel
  if (denominator === 0) {
    return null;
  }

  var t = tNumerator / denominator;
  var u = uNumerator / denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return Object.assign(add(p, multiply(t, r)), { param: t });
  }

  return null;
};

var intersectRayWithLines = function intersectRayWithLines(start, angle, lines) {
  var end = vector(start.x + Math.cos(angle) * 1000, start.y + Math.sin(angle) * 1000);

  var intersectFound = null;

  lines.forEach(function (line) {
    var intersect = intersectSegments({ start: start, end: end }, { start: line.start, end: line.end });

    if (!intersect) {
      return;
    }

    if (!intersectFound || intersect.param < intersectFound.param) {
      intersectFound = intersect;
    }
  });

  return intersectFound;
};

var getAngleBetween = function getAngleBetween(pointA, pointB) {
  return Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
};

var valueWithOffsets = function valueWithOffsets(value) {
  var offset = arguments.length <= 1 || arguments[1] === undefined ? ANGLE_OFFSET : arguments[1];
  return [value - offset, value, value + offset];
};

var isInBounds = function isInBounds(point) {
  return point.x >= 0 && point.x <= WIDTH && point.y >= 0 && point.y <= HEIGHT;
};

var drawViewPolygon = function drawViewPolygon(point, lines, color) {
  if (!isInBounds(point)) {
    return;
  }

  var angles = flatten(lines.map(function (line) {
    return [].concat(_toConsumableArray(valueWithOffsets(getAngleBetween(line.start, point))), _toConsumableArray(valueWithOffsets(getAngleBetween(line.end, point))));
  }));

  var sortedAngles = Array.from(angles).sort(function (a, b) {
    return a - b;
  });

  var points = sortedAngles.map(function (angle) {
    return intersectRayWithLines(point, angle, lines);
  });

  drawPolygon(points, color);
};

var drawCircle = function drawCircle(point, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
  context.stroke();
  context.closePath();
  context.fill();
};

var drawRectangle = function drawRectangle() {
  context.fillStyle = '#555555';
  context.rect.apply(context, arguments);
  context.fill();
};

var render = function render(state) {
  var mouse = state.mouse;
  var player = state.player;
  var enemies = state.enemies;
  var lines = state.lines;
  var t = state.t;


  player.x = mouse.x;
  player.y = mouse.y;

  context.clearRect(0, 0, WIDTH, HEIGHT);

  context.globalCompositeOperation = 'source-over';

  drawViewPolygon(player, lines, '#FFFFFF');

  context.globalCompositeOperation = 'source-atop';

  lines.forEach(function (line) {
    context.lineWidth = 4;
    drawLine(line.start, line.end);
  });

  enemies.forEach(function (enemy) {
    enemy.x = enemy.focusX + Math.sin(t * enemy.speed) * enemy.radius;
    enemy.y = enemy.focusY + Math.cos(t * enemy.speed) * enemy.radius;

    drawCircle(enemy, '#ff0000');
  });

  drawCircle(player, '#00ff00');

  context.globalCompositeOperation = 'destination-over';

  drawRectangle(0, 0, WIDTH, HEIGHT);
};

var state = {
  player: {
    x: 100,
    y: 100
  },

  enemies: [{
    focusX: 100,
    focusY: 100,
    radius: 40,
    speed: 0.1
  }, {
    focusX: 500,
    focusY: 300,
    radius: 50,
    speed: 0.05
  }],

  t: 0,

  mouse: {
    x: 0,
    y: 0
  },

  lines: [
  // screen
  buildLine(0, 0, WIDTH, 0), buildLine(0, 0, 0, HEIGHT), buildLine(WIDTH, 0, WIDTH, HEIGHT), buildLine(0, HEIGHT, WIDTH, HEIGHT),

  // walls
  buildLine(200, 200, 100, 200), buildLine(400, 100, 300, 300), buildLine(500, 200, 700, 300), buildLine(550, 50, 700, 200)]
};

(function go() {
  state.t += 1;
  render(state);
  window.requestAnimationFrame(go);
})();

node.addEventListener('mousemove', function (event) {
  var mouse = state.mouse;


  mouse.x = event.offsetX;
  mouse.y = event.offsetY;
});

},{}]},{},[1]);
