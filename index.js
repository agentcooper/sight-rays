'use strict';

const node = document.querySelector('#canvas');
const context = canvas.getContext('2d');

const WIDTH = 800;
const HEIGHT = 400;

const ANGLE_OFFSET = 0.0001;

const flatten = arr =>
  arr.reduce(
    (res, item) => res.concat(item), []);

const vector = (x, y) => ({ x: x, y: y });

const add = (v, u) => vector(v.x + u.x, v.y + u.y);
const subtract = (v, u) => vector(v.x - u.x, v.y - u.y);

const multiply = (scalar, v) => vector(scalar * v.x, scalar * v.y);
const cross = (v, u) => v.x * u.y - v.y * u.x;

const buildLine = (x1, y1, x2, y2) => ({
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 }
});

const drawLine = (start, end) => {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
};

const drawPolygon = (points, color) => {
  context.fillStyle = color;
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      point && context.lineTo(point.x, point.y);
    }
  });
  context.closePath();
  context.fill();
};

const intersectSegments = (segment1, segment2) => {
  // segment1: p + t * r
  const p = segment1.start;
  const r = subtract(segment1.end, segment1.start);

  // segment2: q + u * s
  const q = segment2.start;
  const s = subtract(segment2.end, segment2.start);

  const tNumerator = cross(subtract(q, p), s);
  const uNumerator = cross(subtract(q, p), r);

  const denominator = cross(r, s);

  // parallel
  if (denominator === 0) {
    return null;
  }

  const t = tNumerator / denominator;
  const u = uNumerator / denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return Object.assign(
      add(p, multiply(t, r)),
      { param: t }
    );
  }

  return null;
};

const intersectRayWithLines = (start, angle, lines) => {
  const end = vector(
    start.x + Math.cos(angle) * 1000,
    start.y + Math.sin(angle) * 1000
  );

  let intersectFound = null;

  lines.forEach(line => {
    const intersect = intersectSegments(
      { start: start, end: end },
      { start: line.start, end: line.end }
    );

    if (!intersect) {
      return;
    }

    if (!intersectFound || intersect.param < intersectFound.param) {
      intersectFound = intersect;
    }
  });

  return intersectFound;
};

const getAngleBetween = (pointA, pointB) =>
  Math.atan2(
    pointA.y - pointB.y,
    pointA.x - pointB.x
  );

const valueWithOffsets = (value, offset = ANGLE_OFFSET) =>
  [
    value - offset,
    value,
    value + offset
  ];

const isInBounds = point =>
  (point.x >= 0 && point.x <= WIDTH) &&
  (point.y >= 0 && point.y <= HEIGHT);

const drawViewPolygon = (point, lines, color) => {
  if (!isInBounds(point)) {
    return;
  }

  const angles = flatten(
    lines.map(line => [
      ...valueWithOffsets(
        getAngleBetween(line.start, point)
      ),
      ...valueWithOffsets(
        getAngleBetween(line.end, point)
      )
    ])
  );

  const sortedAngles = Array.from(angles).sort((a, b) => a - b);

  const points = sortedAngles.map(
    angle => intersectRayWithLines(point, angle, lines)
  );

  drawPolygon(points, color);
};

const drawCircle = (point, color) => {
  context.fillStyle = color;
  context.beginPath();
  context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
  context.stroke();
  context.closePath();
  context.fill();
};

const drawRectangle = (...args) => {
  context.fillStyle = '#555555';
  context.rect(...args);
  context.fill();
};

const render = state => {
  const { mouse, player, enemies, lines, t } = state;

  player.x = mouse.x;
  player.y = mouse.y;

  context.clearRect(0, 0, WIDTH, HEIGHT);

  context.globalCompositeOperation = 'source-over';

  drawViewPolygon(player, lines, '#FFFFFF');

  context.globalCompositeOperation = 'source-atop';

  lines.forEach(line => {
    context.lineWidth = 4;
    drawLine(line.start, line.end);
  });

  enemies.forEach(enemy => {
    enemy.x = enemy.focusX + Math.sin(t * enemy.speed) * enemy.radius;
    enemy.y = enemy.focusY + Math.cos(t * enemy.speed) * enemy.radius;

    drawCircle(enemy, '#ff0000');
  });

  drawCircle(player, '#00ff00');

  context.globalCompositeOperation = 'destination-over';

  drawRectangle(0, 0, WIDTH, HEIGHT);
}

const state = {
  player: {
    x: 100,
    y: 100,
  },

  enemies: [
    {
      focusX: 100,
      focusY: 100,
      radius: 40,
      speed: 0.1
    },
    {
      focusX: 500,
      focusY: 300,
      radius: 50,
      speed: 0.05,
    },
  ],

  t: 0,

  mouse: {
    x: 0,
    y: 0,
  },

  lines: [
    // screen
    buildLine(0, 0, WIDTH, 0),
    buildLine(0, 0, 0, HEIGHT),
    buildLine(WIDTH, 0, WIDTH, HEIGHT),
    buildLine(0, HEIGHT, WIDTH, HEIGHT),

    // walls
    buildLine(200, 200, 100, 200),
    buildLine(400, 100, 300, 300),
    buildLine(500, 200, 700, 300),
    buildLine(550, 50, 700, 200)
  ]
};

(function go() {
  state.t += 1;
  render(state);
  window.requestAnimationFrame(go);
})();

node.addEventListener('mousemove', event => {
  const { mouse } = state;

  mouse.x = event.offsetX;
  mouse.y = event.offsetY;
});
