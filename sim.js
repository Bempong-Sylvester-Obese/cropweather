// Simplified daily crop weather model for teaching (ideas from CERES-Maize, AquaCrop, APSIM, WOFOST and FAO-56)
(function (root) {
  var CROPS = {
    maize: { name: 'Maize', tb: 10, topt: 34, tcut: 44, stages: [['Sowing',0],['Emergence',70],['End of juvenile stage',270],['Flowering (tasselling and silking)',980],['Grain filling',1120],['Physiological maturity',1790]], flowerWin: [890, 1160], laiMax: 4.0, k: 0.65, rue: 2.5, hi: 0.48, kc: [0.3, 1.2, 0.6], rootMax: 1.0, maxDays: 180, harvestDays: null, product: 'grain', fresh: 1 / 0.88 },
    rice: { name: 'Rice (upland)', tb: 10, topt: 33, tcut: 42, stages: [['Sowing',0],['Emergence',90],['Tillering',450],['Flowering (heading)',1350],['Grain filling',1500],['Physiological maturity',2050]], flowerWin: [1250, 1550], laiMax: 4.5, k: 0.5, rue: 2.2, hi: 0.40, kc: [1.05, 1.2, 0.75], rootMax: 0.6, maxDays: 200, harvestDays: null, product: 'grain', fresh: 1 / 0.86 },
    cassava: { name: 'Cassava', tb: 13, topt: 32, tcut: 45, stages: [['Planting',0],['Sprouting',150],['Canopy building',700],['Storage root bulking',1400],['Harvest stage',3000]], flowerWin: null, laiMax: 3.5, k: 0.7, rue: 1.6, hi: 0.60, kc: [0.3, 0.9, 0.6], rootMax: 1.0, maxDays: 330, harvestDays: 300, product: 'storage roots', fresh: 1 / 0.35 }
  };
  var LATE_DAYS = 60;
  var SCENARIOS = {
    normal: 'Real 2021 NASA POWER weather, unchanged: regular rains through the season.',
    drought: 'Drizzle under 3 mm removed and other rain halved, plus a 30 day rain-free spell from day 45 that covers flowering.',
    heat: 'Daily highs of at least 37 \u00B0C (6 \u00B0C or more above normal) for 22 days from day 50, with little rain.',
    elnino: 'An El Ni\u00F1o style year: fewer rainy days, 30 percent less rain, a 2 week dry spell from day 30, about 1 \u00B0C warmer.',
    late: 'Same real weather, but sown 60 days late, so grain filling runs into the end of the rains.',
    lanina: 'Wetter (20 percent more rain) and slightly cooler.'
  };
  function thermal(tmax, tmin, c) {
    var tm = (tmax + tmin) / 2;
    if (tm <= c.tb) return 0;
    if (tm <= c.topt) return tm - c.tb;
    if (tm >= c.tcut) return 0;
    return (c.topt - c.tb) * (c.tcut - tm) / (c.tcut - c.topt);
  }
  // Extraterrestrial radiation Ra (MJ per m2 per day), FAO-56 equation 21
  function ra(latDeg, doy) {
    var phi = latDeg * Math.PI / 180, dr = 1 + 0.033 * Math.cos(2 * Math.PI * doy / 365),
      d = 0.409 * Math.sin(2 * Math.PI * doy / 365 - 1.39),
      ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(d))));
    return 24 * 60 / Math.PI * 0.082 * dr * (ws * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(ws));
  }
  // Hargreaves reference evapotranspiration (mm per day), FAO-56 equation 52
  function et0Hargreaves(tmax, tmin, raMJ) {
    var tm = (tmax + tmin) / 2;
    return Math.max(0, 0.0023 * (tm + 17.8) * Math.sqrt(Math.max(0, tmax - tmin)) * 0.408 * raMJ);
  }
  // Water stress coefficient Ks, FAO-56 equation 84
  function ks(depletion, taw, raw) {
    if (depletion <= raw) return 1;
    return Math.max(0, (taw - depletion) / (taw - raw));
  }
  function kcAt(tt, c) {
    var s = c.stages, endJuv = s[2][1], flo = s[3][1], gf = s[4][1], mat = s[s.length - 1][1];
    if (tt <= endJuv) return c.kc[0];
    if (tt <= flo) return c.kc[0] + (c.kc[1] - c.kc[0]) * (tt - endJuv) / (flo - endJuv);
    if (tt <= gf) return c.kc[1];
    return Math.max(c.kc[2], c.kc[1] + (c.kc[2] - c.kc[1]) * (tt - gf) / (mat - gf));
  }
  function stageIndex(tt, c) { var i = 0; c.stages.forEach(function (s, j) { if (tt >= s[1]) i = j; }); return i; }
  function buildWeather(years, startYear, doy, n, scenario) {
    var out = [], y = String(startYear), i = doy - 1, keys = Object.keys(years).sort();
    while (out.length < n) {
      var Y = years[y]; if (!Y) { y = keys[0]; Y = years[y]; }
      if (i >= Y.tx.length) { i = 0; var k = keys.indexOf(y) + 1; y = keys[k < keys.length ? k : 0]; continue; }
      out.push({ tx: Y.tx[i], tn: Y.tn[i], p: Y.p[i], s: Y.s[i], doy: i + 1, year: +y }); i++;
    }
    return out.map(function (w, d) {
      var x = { tx: w.tx, tn: w.tn, p: w.p, s: w.s, doy: w.doy, year: w.year };
      // Scenario edits (see SCENARIOS for the reasoning). NASA POWER gridded rain has light drizzle on most days,
      // so dry scenarios also remove drizzle below 3 mm to create real dry days.
      if (scenario === 'drought') { x.p = x.p < 3 ? 0 : x.p * 0.5; if (d >= 45 && d < 75) { x.p = 0; x.s *= 1.08; x.tx += 1.5; } }
      if (scenario === 'heat') { if (d >= 50 && d < 72) { x.tx = Math.max(x.tx + 6, 37 + (d % 3)); x.tn += 2; x.p *= 0.3; x.s *= 1.1; } }
      if (scenario === 'elnino') { x.p = x.p < 3 ? 0 : x.p * 0.7; if (d >= 30 && d < 44) x.p = 0; x.tx += 1.0; x.tn += 0.6; x.s *= 1.04; }
      if (scenario === 'lanina') { x.p *= 1.2; x.tx -= 0.3; x.s *= 0.97; }
      return x;
    });
  }
  function simulate(opt) {
    var c = CROPS[opt.crop], lat = opt.lat, taw0 = opt.awc || 120;
    var late = opt.scenario === 'late', w = buildWeather(opt.years, opt.year, opt.doy + (late ? LATE_DAYS : 0), c.maxDays, late ? 'normal' : opt.scenario);
    var tt = 0, lai = 0, bio = 0, rootZ = 0.3, dr = taw0 * rootZ * 0.4, hiF = 1, days = [], done = false, mat = c.stages[c.stages.length - 1][1];
    for (var d = 0; d < w.length && !done; d++) {
      var x = w[d], dtt = thermal(x.tx, x.tn, c);
      tt += dtt;
      var st = stageIndex(tt, c), emerged = tt >= c.stages[1][1];
      if (emerged) rootZ = Math.min(c.rootMax, rootZ + 0.012);
      var taw = taw0 * rootZ, raw = 0.55 * taw;
      var e0 = et0Hargreaves(x.tx, x.tn, ra(lat, x.doy)), kc = kcAt(tt, c), k = ks(dr, taw, raw);
      var etc = kc * e0 * k, eff = x.p > 5 ? x.p * 0.85 : x.p * 0.5;
      dr = dr - eff + etc; var drain = 0; if (dr < 0) { drain = -dr; dr = 0; } if (dr > taw) dr = taw;
      k = ks(dr, taw, raw);
      var heat = x.tx <= 35 ? 1 : Math.max(0, 1 - (x.tx - 35) / 10);
      var flo = c.stages[3][1];
      if (emerged && tt < flo) lai += c.laiMax * 5 * (dtt / flo) * (lai / c.laiMax + 0.05) * (1 - lai / c.laiMax) * Math.min(k, heat);
      else if (tt >= c.stages[4][1]) lai = Math.max(0, lai - c.laiMax * 0.6 * dtt / (mat - c.stages[4][1]));
      if (k < 0.5 && emerged) lai *= 0.995;
      var par = 0.5 * x.s, ipar = par * (1 - Math.exp(-c.k * lai)), growth = emerged ? c.rue * ipar * Math.min(k, heat) : 0;
      bio += growth;
      if (c.flowerWin && tt >= c.flowerWin[0] && tt <= c.flowerWin[1]) {
        hiF -= (1 - k) * 0.03;
        if (x.tx > 35) hiF -= (x.tx - 35) * 0.012;
        hiF = Math.max(0.1, hiF);
      }
      days.push({ day: d + 1, year: x.year, doy: x.doy, tmax: x.tx, tmin: x.tn, rain: x.p, srad: x.s, dtt: dtt, tt: tt, stage: st, lai: lai, par: par, ipar: ipar, growth: growth, biomass: bio, et0: e0, kc: kc, etc: etc, ks: k, heat: heat, stress: 1 - Math.min(k, heat), soilPct: 100 * (1 - dr / taw), drain: drain, hiF: hiF });
      if (c.harvestDays ? d + 1 >= c.harvestDays : tt >= mat) done = true;
    }
    var yieldDry = bio * c.hi * hiF;
    return { crop: c, days: days, matured: done, biomass: bio, hiFactor: hiF, hi: c.hi * hiF, yieldDryT: yieldDry / 100, yieldFreshT: yieldDry / 100 * c.fresh,
      rain: days.reduce(function (a, b) { return a + b.rain; }, 0), etc: days.reduce(function (a, b) { return a + b.etc; }, 0) };
  }
  var api = { CROPS: CROPS, SCENARIOS: SCENARIOS, LATE_DAYS: LATE_DAYS, thermal: thermal, ra: ra, et0Hargreaves: et0Hargreaves, ks: ks, kcAt: kcAt, stageIndex: stageIndex, buildWeather: buildWeather, simulate: simulate };
  if (typeof module !== 'undefined') module.exports = api; else root.SIM = api;
})(this);
