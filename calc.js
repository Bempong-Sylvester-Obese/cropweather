// Pure maths, shared by the page and the tests
(function (root) {
  function dtt(tmax, tmin, tbase) {
    var v = (Number(tmax) + Number(tmin)) / 2 - Number(tbase);
    return v > 0 ? v : 0;
  }
  function accumulate(days, tbase) {
    var total = 0;
    return days.map(function (d, i) {
      var x = dtt(d.tmax, d.tmin, tbase);
      total += x;
      return { day: i + 1, dtt: x, total: total };
    });
  }
  function daysToTarget(tmax, tmin, tbase, target) {
    var x = dtt(tmax, tmin, tbase);
    if (x <= 0) return Infinity;
    return Math.ceil(target / x);
  }
  function yieldCalc(lgpDays, rateGperM2perDay, hi) {
    var biomass = lgpDays * rateGperM2perDay;
    var grain = biomass * hi;
    return { biomass: biomass, grain: grain, tPerHa: grain / 100 };
  }
  var api = { dtt: dtt, accumulate: accumulate, daysToTarget: daysToTarget, yieldCalc: yieldCalc };
  if (typeof module !== 'undefined') module.exports = api; else root.CW = api;
})(this);
