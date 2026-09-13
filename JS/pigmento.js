/* Campos de pigmento determinísticos: a mesma borda acompanha o scroll nos dois sentidos. */
(() => {
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const hash = (x, y, seed) => {
    let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  function noise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const u = smooth(x - ix), v = smooth(y - iy);
    const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed);
    const c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }

  function create(kind, aspect = 1.6, withEdge = false) {
    if (!CSS.supports('mask-image', 'linear-gradient(#000, transparent)')) return null;
    const canvas = document.createElement('canvas');
    canvas.width = aspect < 1 ? 160 : 288;
    canvas.height = Math.max(96, Math.min(360, Math.round(canvas.width / aspect)));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const edgeCanvas = withEdge ? document.createElement('canvas') : null;
    if (edgeCanvas) { edgeCanvas.width = canvas.width; edgeCanvas.height = canvas.height; }
    const edgeCtx = edgeCanvas?.getContext('2d');
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    const edgePixels = edgeCtx?.createImageData(canvas.width, canvas.height);
    const field = new Float32Array(canvas.width * canvas.height);
    const seed = kind === 'bandeira' ? 17 : kind === 'foz' ? 31 : 53;
    let min = Infinity, max = -Infinity;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const u = x / (canvas.width - 1), v = y / (canvas.height - 1);
        const warp = noise(u * 3, v * 3, seed) - 0.5;
        const pigment = (noise(u * 9 + warp, v * 7, seed + 1) - 0.5) * 0.13
          + (noise(u * 31, v * 23, seed + 2) - 0.5) * 0.045;
        let value;
        if (kind === 'lencois') {
          // Lençóis: faixas de areia, com curvas longas em torno das lagoas.
          value = 0.72 * (1 - v) + 0.28 * (1 - u)
            + Math.sin(u * 8.5 + (1 - v) * 2 + warp) * 0.14 + warp * 0.17 + pigment;
        } else {
          // A corrente atravessa a tela na diagonal, com pequenos remansos nas bordas.
          value = 0.61 * u + 0.39 * (1 - v)
            + Math.sin(v * 5.5 + u * 2.3 + warp) * 0.17 + warp * 0.24 + pigment;
        }
        const i = y * canvas.width + x;
        field[i] = value;
        min = Math.min(min, value); max = Math.max(max, value);
        const rgba = i * 4;
        pixels.data[rgba] = pixels.data[rgba + 1] = pixels.data[rgba + 2] = 255;
        if (edgePixels) edgePixels.data[rgba] = edgePixels.data[rgba + 1] = edgePixels.data[rgba + 2] = 255;
      }
    }
    for (let i = 0; i < field.length; i++) field[i] = (field[i] - min) / (max - min);

    // Apenas a máscara é rasterizada em baixa resolução; as fotos mantêm a nitidez original.
    const feather = kind === 'bandeira' ? 0.13 : 0.105;
    const cache = new Map();
    return {
      render(progress) {
        const step = Math.round(clamp(progress) * 240);
        if (cache.has(step)) return cache.get(step);
        const threshold = (step / 240) * (1 + 2 * feather) - feather;
        for (let i = 0; i < field.length; i++) {
          const amount = smooth((threshold - field[i] + feather) / (2 * feather));
          pixels.data[i * 4 + 3] = Math.round(255 * (kind === 'bandeira' ? 1 - amount : amount));
          if (edgePixels) edgePixels.data[i * 4 + 3] = Math.round(255 * 4 * amount * (1 - amount));
        }
        ctx.putImageData(pixels, 0, 0);
        const result = { mask: `url("${canvas.toDataURL()}")`, edge: '' };
        if (edgeCtx) {
          edgeCtx.putImageData(edgePixels, 0, 0);
          result.edge = `url("${edgeCanvas.toDataURL()}")`;
        }
        cache.set(step, result);
        if (cache.size > 18) cache.delete(cache.keys().next().value);
        return result;
      },
    };
  }

  window.AfloraPigmento = { create };
})();
