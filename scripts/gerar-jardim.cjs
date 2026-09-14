/* Esculturas originais em baixo-relevo. Gera mapas de altura de 16 bits em RG, sem dependências. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const root = path.resolve(__dirname, '..');

function png(width, height, rgb) {
  const crc = data => {
    let c = 0xffffffff;
    for (const value of data) { c ^= value; for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const name = Buffer.from(type), length = Buffer.alloc(4), sum = Buffer.alloc(4);
    length.writeUInt32BE(data.length); sum.writeUInt32BE(crc(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, sum]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) rgb.copy(rows, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function build(mobile) {
  const W = mobile ? 768 : 1600, H = 1100, aspect = W / H;
  const field = new Float32Array(W * H);
  const addTriangle = (a, b, c) => {
    const area = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(area) < .000001) return;
    const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), maxX = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), maxY = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / area;
      const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / area;
      if (u >= -.002 && v >= -.002 && u + v <= 1.002) {
        const index = y * W + x, z = u * a[2] + v * b[2] + (1 - u - v) * c[2];
        if (z > field[index]) field[index] = z;
      }
    }
  };
  const patch = (fn, U = 70, V = 36) => {
    const vertices = [];
    for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) {
      const [x, y, z] = fn(i / U, j / V * 2 - 1);
      vertices.push([x * H, y * H, z]);
    }
    for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j, b = a + V + 1;
      addTriangle(vertices[a], vertices[b], vertices[a + 1]);
      addTriangle(vertices[b], vertices[b + 1], vertices[a + 1]);
    }
  };
  const petal = (x, y, length, width, angle, lift, kind = 0, phase = 0) => {
    const co = Math.cos(angle), si = Math.sin(angle);
    patch((u, v) => {
      const outline = Math.pow(Math.max(0, Math.sin(Math.PI * u)), kind === 1 ? .7 : .48);
      const rib = Math.sin(u * Math.PI * (kind === 1 ? 13 : 4) - Math.abs(v) * 6 + phase);
      const scallop = kind === 1 ? 1 + .028 * Math.cos(u * 24 * Math.PI) : 1 + .035 * Math.sin(u * 18 + phase);
      const across = v * width * outline * scallop;
      const along = length * u + width * .18 * v * v * Math.sin(Math.PI * u);
      const bend = Math.sin(u * Math.PI * .8) * width * .38 * Math.sin(phase);
      let z = .002 + lift * Math.sin(Math.PI * u * .88) * (.38 + .62 * (1 - v * v));
      if (kind === 0) z += lift * .45 * v * v * Math.pow(u, 2) + lift * .2 * Math.sin(v * 6 + u * 3 + phase) * outline;
      else z += lift * .035 * rib * outline + lift * .07 * Math.exp(-v * v * 220) * Math.sin(Math.PI * u);
      // Arredondar o lábio e a ponta evita a parede vertical de um recorte extrudado.
      z *= Math.min(1, u * 24 + .1) * Math.min(1, (1 - u) * 30);
      z *= Math.pow(Math.max(0, 1 - Math.pow(Math.abs(v), 12)), .32);
      return [x + co * (across + bend) + si * along, y + si * (across + bend) - co * along, Math.max(.0001, z)];
    });
  };
  const stem = (x, y, dx, dy, width, lift) => {
    patch((u, v) => {
      const bend = Math.sin(Math.PI * u) * dx * .4;
      return [x + dx * u + bend + v * width, y + dy * u,
        lift * Math.sqrt(Math.max(0, 1 - v * v)) * Math.pow(Math.sin(Math.PI * u), .35)];
    }, 100, 12);
  };
  const flower = (x, y, size, angle) => {
    // Pétalas torcidas de uma flor aberta, em vez de círculos ou contornos de terreno.
    for (let i = 0; i < 7; i++) {
      const a = angle + i * Math.PI * 2 / 7;
      petal(x, y, size * (1 + .12 * Math.sin(i * 7)), size * .48, a, size * .36, 0, i * 1.7 + .4);
    }
    for (let i = 0; i < 4; i++) petal(x, y, size * .5, size * .21, i * 1.6 + angle + .7, size * .49, 0, i + 3);
  };
  const fern = (x, y, size, angle) => {
    const co = Math.cos(angle), si = Math.sin(angle);
    stem(x, y, si * size, -co * size, .0018, .007);
    for (let i = 0; i < 12; i++) {
      const t = i / 12, bx = x + si * size * t, by = y - co * size * t;
      const length = size * (.27 * Math.sin(Math.PI * (t * .78 + .13)) + .035);
      petal(bx, by, length, length * .22, angle - 1 + t * .25, .017, 1, i * .8);
      petal(bx, by, length * .91, length * .21, angle + 1 - t * .3, .014, 1, i * .8 + 2);
    }
  };

  // Ramos curvos com seção elíptica: cada folha nasce da curva, não de uma grade.
  const branch = (a, b, c, width, lift) => {
    const point = t => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
      (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]];
    patch((u, v) => {
      const [x, y] = point(u), dx = 2 * ((1 - u) * (b[0] - a[0]) + u * (c[0] - b[0]));
      const dy = 2 * ((1 - u) * (b[1] - a[1]) + u * (c[1] - b[1])), norm = Math.hypot(dx, dy) || 1;
      const taper = .3 + .7 * Math.pow(1 - u, .7);
      return [x - dy / norm * v * width * taper, y + dx / norm * v * width * taper,
        lift * taper * Math.sqrt(Math.max(0, 1 - v * v)) * Math.min(1, u * 20 + .2) * Math.min(1, (1 - u) * 25)];
    }, 100, 14);
    return point;
  };
  const blossom = (x, y, size, angle, phase = 0) => {
    // Flor de cinco lóbulos, pequena e aberta, com uma garganta mais alta.
    for (let i = 0; i < 5; i++) {
      const a = angle + i * Math.PI * 2 / 5;
      petal(x, y, size * (1 + .09 * Math.sin(i * 4 + phase)), size * .46, a, size * .28, 0, phase + i * .7);
    }
    patch((u, v) => {
      const a = u * Math.PI * 2, r = (v + 1) * .5, radius = size * .21;
      return [x + Math.cos(a) * r * radius, y + Math.sin(a) * r * radius,
        size * .33 * Math.sqrt(Math.max(0, 1 - r * r)) + size * .055];
    }, 38, 12);
  };
  const ipe = (x, y, size, direction = 1) => {
    // Galho de ipê com bifurcações e pequenas florações em escalas diferentes.
    const trunk = branch([x, y], [x - direction * size * .12, y - size * .48], [x + direction * size * .18, y - size], .003, .009);
    for (let i = 0; i < 6; i++) {
      const t = .29 + i * .112, p = trunk(t), side = i % 2 ? -1 : 1;
      const end = [p[0] + size * side * (.19 + .055 * Math.sin(i * 2)), p[1] - size * (.15 + .035 * Math.cos(i))];
      const twig = branch(p, [p[0] + size * side * .15, p[1] - size * .025], end, .0018, .0055);
      for (let j = 0; j < 3; j++) {
        const leaf = twig(.23 + j * .22);
        petal(leaf[0], leaf[1], size * (.105 + j * .009), size * .035, side * (.9 + j * .35), .01 + j * .001, 1, i + j);
      }
      for (let j = 0; j < 3; j++) {
        const a = j * 2.25 + i * .7;
        blossom(end[0] + Math.sin(a) * size * .045, end[1] + Math.cos(a) * size * .025,
          size * (.044 + .006 * Math.sin(i + j)), a, i);
      }
    }
    const tip = trunk(.98);
    blossom(tip[0], tip[1], size * .054, .4);
  };
  const palm = (x, y, size, angle = 0) => {
    // Palmeira vista como relevo: pecíolos arqueados, folíolos que caem suavemente.
    const crown = [x + Math.sin(angle) * size * .12, y - size * .51];
    branch([x, y], [x - size * .025, y - size * .22], crown, size * .012, .009);
    for (let i = 0; i < 7; i++) {
      const a = -1.75 + i * .57 + angle, l = size * (.49 + .05 * Math.sin(i * 2.6));
      const end = [crown[0] + Math.sin(a) * l, crown[1] - Math.cos(a) * l + size * .16];
      const control = [crown[0] + Math.sin(a) * l * .6, crown[1] - Math.cos(a) * l * .9 - size * .055];
      const frond = branch(crown, control, end, size * .003, .006);
      for (let j = 1; j < 14; j++) {
        const t = j / 14, p = frond(t), ahead = frond(Math.min(1, t + .025));
        const direction = Math.atan2(ahead[0] - p[0], -(ahead[1] - p[1]));
        const length = size * .125 * Math.pow(Math.sin(Math.PI * t), .8);
        petal(p[0], p[1], length, length * .12, direction - 1.03 + t * .15, .009, 1, j * .4);
        petal(p[0], p[1], length * .95, length * .11, direction + 1.03 - t * .15, .0075, 1, j * .4 + 1);
      }
    }
  };
  const bromelia = (x, y, size, angle = 0) => {
    // Roseta de folhas longas, torcidas em duas camadas, inspirada em bromélias.
    for (let i = 0; i < 9; i++) {
      const a = angle + i * Math.PI * 2 / 9;
      petal(x, y, size * (1 + .15 * Math.cos(i * 2.8)), size * .12, a, size * .22, 0, i * .8);
    }
    for (let i = 0; i < 5; i++) petal(x, y, size * .48, size * .105, angle + i * 1.25 + .4, size * .33, 0, i + 2);
  };

  if (!mobile) {
    ipe(aspect * .045, .42, .37, 1);
    // Um pequeno ramo chega do topo e enquadra o espaço negativo do título.
    const top = branch([aspect * .69, -.055], [aspect * .75, .04], [aspect * .82, .115], .0024, .006);
    for (let i = 0; i < 6; i++) {
      const p = top(.16 + i * .13);
      petal(p[0], p[1], .059 + i * .003, .017, i % 2 ? 1.8 : -.4, .013, 1, i);
    }
    stem(aspect * .12, .86, aspect * .015, -.43, .0028, .009);
    flower(aspect * .14, .45, .092, -.6);
    petal(aspect * .13, .79, .21, .066, -.7, .055, 1, 2.1);
    petal(aspect * .14, .69, .19, .06, 1.14, .045, 0, 3.4);
    petal(aspect * .12, .57, .16, .075, -1.3, .05, 0, 1.2);
    stem(aspect * .22, .89, -aspect * .035, -.28, .002, .006);
    petal(aspect * .22, .85, .18, .046, .4, .036, 1, .8);
    flower(aspect * .845, .285, .123, .1);
    fern(aspect * .895, .66, .36, -.45);
    petal(aspect * .8, .54, .22, .087, .8, .052, 0, 2);
    petal(aspect * .94, .47, .17, .057, -.5, .04, 1, 3);
    palm(aspect * .955, 1.035, .385, -.2);
    bromelia(aspect * .265, .965, .118, .35);
    fern(aspect * -.015, .98, .26, .2);
    blossom(aspect * .97, .60, .032, -.6, 3);
    blossom(aspect * .93, .655, .025, .8, 1);
  } else {
    ipe(aspect * -.025, .36, .23, 1);
    flower(aspect * .91, .24, .095, .1);
    fern(aspect * 1.02, .52, .24, -.45);
    petal(aspect * .89, .46, .13, .054, .4, .047, 0, 2);
    stem(aspect * .07, .85, -.015, -.21, .002, .007);
    flower(aspect * .025, .64, .068, -.8);
    petal(aspect * .06, .82, .15, .04, -.6, .035, 1, 2);
    petal(aspect * .015, .72, .13, .05, 1.2, .045, 0, 4);
    palm(aspect * 1.055, .98, .23, -.2);
    bromelia(aspect * .12, .98, .076, .4);
    blossom(aspect * .975, .555, .029, .7, 2);
  }
  // Uma média leve suaviza a rasterização sem apagar as nervuras.
  const smooth = new Float32Array(field.length);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    smooth[i] = field[i] * .6 + (field[i - 1] + field[i + 1] + field[i - W] + field[i + W]) * .1;
  }
  const rgb = Buffer.alloc(W * H * 3);
  for (let i = 0; i < smooth.length; i++) {
    const value = Math.min(65535, Math.round(smooth[i] / .1 * 65535));
    rgb[i * 3] = value >> 8; rgb[i * 3 + 1] = value & 255;
    rgb[i * 3 + 2] = Math.min(255, Math.round(smooth[i] * 80000));
  }
  const file = path.join(root, 'IMG', `jardim-altura-${mobile ? 'mobile' : 'desktop'}.png`);
  fs.writeFileSync(file, png(W, H, rgb));
  console.log(path.basename(file), W, H, fs.statSync(file).size);
}
build(false); build(true);
