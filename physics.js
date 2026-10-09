/* Penrose explorer — pure SI calculations and embedding coordinates. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PenrosePhysics = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const G = 6.67430e-11;
  const C = 299792458;
  const SOLAR_MASS = 1.98847e30; // adopted approximate kilogram scale
  function positive(value, name) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(name + " must be finite and positive");
    return value;
  }
  function massFromArea(areaM2) {
    return (C * C / G) * Math.sqrt(positive(areaM2, "Area") / (16 * Math.PI));
  }
  function fromSolarMass(solarMass) {
    const massKg = positive(solarMass, "Solar mass") * SOLAR_MASS;
    const m = G * massKg / (C * C);
    const radiusM = 2 * m;
    const areaM2 = 16 * Math.PI * m * m;
    return Object.freeze({solarMass, massKg, m, radiusM, areaM2, boundKg: massFromArea(areaM2)});
  }
  function embeddingPoint(m, u, phi, sign = -1) {
    positive(m, "Geometric mass");
    if (!Number.isFinite(u) || u < 0 || !Number.isFinite(phi) || ![1, -1].includes(sign)) {
      throw new RangeError("Invalid embedding coordinates");
    }
    const r = 2 * m + u * u / (8 * m);
    return {x: r * Math.cos(phi), y: r * Math.sin(phi), z: sign * u, r};
  }
  return Object.freeze({G, C, SOLAR_MASS, massFromArea, fromSolarMass, embeddingPoint});
});

