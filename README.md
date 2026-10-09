# Event Horizon: a Schwarzschild mass–area explorer

[Open the live explorer](https://t24085.github.io/schwarzschild-penrose-explorer/)

An interactive static-site illustration of a Schwarzschild black hole’s exterior spatial geometry, spherical horizon area, and equality in the Penrose mass–area relation.

**Scientific claim:** the analytic substitution below establishes equality for a classic Schwarzschild example. The visualization and floating-point checks do not verify the broader proposed Penrose theorem.

## Run as a static site

Serve `index.html`, `styles.css`, `physics.js`, and `app.js` together in one directory. There is no backend, database, account, API key, package installation, or build step. The original implementation uses document-relative assets:

```html
<link rel="stylesheet" href="./styles.css">
<script src="./physics.js" defer></script>
<script src="./app.js" defer></script>
```

These paths support both a domain root and a repository subpath. The two scripts execute in document order after parsing; physics.js supplies the calculations used by app.js. Direct file opening is also supported by the authored implementation, which uses classic scripts and does not fetch assets programmatically.

For a local preview, run `python3 -m http.server 8000` in the site directory and open `http://localhost:8000`. Any ordinary static HTTP server works.

## Explore

- Drag to orbit, scroll or pinch to zoom. Camera buttons and keyboard arrows/plus/minus provide alternatives.
- Change physical mass with numeric input, presets, or a logarithmic slider from 1 to 100 solar masses.
- Switch between the equatorial spatial slice and a separate spherical horizon-area representation.
- Fixed physical scale keeps the camera framing constant as mass changes. Use Fit when a larger geometry extends beyond the viewport.
- Normalized scale divides every length by geometric mass. Readouts retain physical units.
- Reset restores the default mass, camera, scale mode, and slice view.

The renderer projects a finite mesh into a 2D canvas. Mesh sampling, camera perspective, and screen shading aid visualization; they are not a gravitational evolution solver. No idle render loop is required.

## Notation and units

| Symbol | Meaning | Units |
| --- | --- | --- |
| M | Physical black-hole mass | kg or solar masses |
| m = GM/c² | Geometric mass | metres |
| r | Areal radial coordinate | metres |
| r_s = 2m | Schwarzschild horizon’s areal radius | metres |
| A | Spherical horizon area | square metres |
| A_min | Appropriate least enclosing area in the relevant Penrose statement | square metres |
| u, z | Embedding parameters | metres |
| φ | Equatorial angle | radians |

The implementation adopts G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻² and c = 299792458 m/s. The speed of light is exact in SI; G is measured. See the [NIST gravitational constant](https://physics.nist.gov/cgi-bin/cuu/Value?bg%7Csearch_for=universal_in%21) and [NIST speed of light](https://physics.nist.gov/cgi-bin/cuu/Value?c%7Csearch_for=universal_in%21).

The UI’s solar-mass conversion is an adopted approximation, 1 M☉ ≈ 1.98847 × 10³⁰ kg. It is not an exact SI definition. Displayed digits illustrate calculation consistency and do not assert equivalent precision in the astrophysical mass scale or in G.

Dimensional check:

```text
[G M / c²] = (m³ kg⁻¹ s⁻²)(kg)/(m² s⁻²) = m
[A] = [16πm²] = m²
[(c²/G) √(A/16π)] = (kg/m)(m) = kg
```

Readout conversions divide lengths by 1000 for kilometres and areas by 10⁶ for square kilometres. Confusing those conversions would introduce a factor of 1000 in area.

## Derivation: horizon radius and area

For the nonrotating, uncharged Schwarzschild solution with positive geometric mass m, the exterior metric in Schwarzschild coordinates has radial factor `1 − 2m/r`. Its horizon is at areal radius `r_s = 2m`.

A sphere of areal radius r_s has area `4πr_s²`. Substitution gives:

```text
A = 4π(2m)² = 16πm²
  = 16πG²M²/c⁴.
```

Increasing M by a factor λ increases m and r_s by λ and A by λ². Thus doubling mass doubles horizon radius and quadruples horizon area.

The mesh’s circular rim is an equatorial section. A flat disk spanning it would have area `πr_s²`, a quarter of the spherical horizon’s area. That disk is not the horizon surface. The spherical view represents the intrinsic horizon geometry separately, rather than placing a sphere inside the embedding surface.

## Derivation: the exterior spatial embedding

Fix Schwarzschild coordinate time and the equatorial angle θ = π/2. On the exterior r > 2m, the induced two-dimensional spatial metric is:

```text
ds² = dr²/(1 − 2m/r) + r²dφ².
```

A surface of revolution z = z(r) in Euclidean 3D has induced metric:

```text
ds² = [1 + (dz/dr)²]dr² + r²dφ².
```

Matching radial coefficients:

```text
1 + (dz/dr)² = 1/(1 − 2m/r)
(dz/dr)² = 2m/(r − 2m).
```

Integrating on the exterior gives:

```text
z = ±√[8m(r − 2m)] + constant.
```

Choose the additive constant so that the limiting rim has z = 0. Either sign gives the same intrinsic geometry. The authored renderer uses one positive exterior sheet. It does not depict the interior r < 2m or claim that a second sheet is a traversable wormhole.

Near r = 2m, dz/dr diverges. A stable parameterization avoids directly evaluating that derivative:

```text
u ≥ 0
r = 2m + u²/(8m)
z = u
x = r cos φ
y = r sin φ.
```

For u > 0, dr/du = u/(4m). The Euclidean pullback agrees with the exterior metric:

```text
(dr/du)² + (dz/du)² = u²/(16m²) + 1
(dr/du)²/(1 − 2m/r) = r/(2m)
                         = 1 + u²/(16m²).
```

At u = 0 the displayed rim is the limiting boundary of the exterior. The singular Schwarzschild radial expression is not evaluated there. A translation used for camera framing changes neither the metric nor the horizon radius.

This is a **2D spatial slice embedded in Euclidean 3D**, not a literal funnel and not a picture of all four dimensions of spacetime. The extra embedding direction makes distance geometry visible. The embedding relation is discussed in [Embedding diagrams in stationary spacetimes](https://www.nature.com/articles/s41598-024-69871-w).

## Derivation: the Schwarzschild equality example

The relevant area-controlled Penrose form is:

```text
m ≥ √(A_min/(16π)).
```

Its physical-mass form is obtained by multiplying by c²/G:

```text
M ≥ (c²/G) √(A_min/(16π)).
```

For this Schwarzschild example, take the appropriate enclosing area to be its horizon area, `A_min = 16πm²`. Then:

```text
√(A_min/(16π))
= √[(16πm²)/(16π)]
= √(m²)
= |m|
= m, because m > 0.

(c²/G)√(A_min/(16π))
= (c²/G)m
= (c²/G)(GM/c²)
= M.
```

The lower bound equals the chosen mass, so Schwarzschild saturates this relation. This symbolic calculation establishes the equality example independently of the rounded numeric display. An example satisfying an inequality does not prove the inequality for every admissible initial-data set.

The explorer sets A_min from the selected Schwarzschild mass; it does not independently find least enclosing surfaces in arbitrary initial data.

## Worked example: 10 solar masses

Using the adopted constants:

```text
M ≈ 1.98847 × 10³¹ kg
m ≈ 14.76669691 km
r_s ≈ 29.53339382 km
A ≈ 10960.65674898 km²
physical lower bound ≈ 10 M☉.
```

Readouts round the results for readability. Tiny floating-point differences between M and the recomputed bound are expected; they are not physical departures from the analytic equality.

## Why normalized shapes coincide

Let R = r/m and U = u/m. The parameterization becomes:

```text
R = 2 + U²/8
Z = z/m = U.
```

There is no remaining mass parameter. Every positive-mass member therefore has the same normalized embedding shape and horizon radius R = 2. In fixed physical units it scales with mass. The two UI modes illustrate that difference, rather than changing the Einstein equations or introducing arbitrary distortion controls.

## Proposed theorem, assumptions, and formalization scope

The broader manuscript is linked at [Spacetime Penrose inequalities: enclosing area, charge, and rigidity](https://github.com/openai/math/blob/main/preprints/Spacetime-Penrose-inequalities-enclosing-area-charge-and-rigidity-October-5-2026/paper.pdf). Its proposed results involve hypotheses on the relevant initial data, energy condition, charges, asymptotics, and trapped boundaries. Consult the exact theorem being invoked for its full hypotheses; the explorer is not a hypothesis checker.

The [repository’s Lean scope note](https://github.com/openai/math/blob/main/lean/docs/260.md) describes CKS hyperboloidal end replacement preserving completeness, the dominant energy condition, and fixed compact interiors, with strictly future-timelike initial-data charge. It includes canonical Schwarzschild equality examples. It states that the general Bondi–Penrose inequality for possibly disconnected weakly trapped boundaries remains unformalized. A supporting connected marginal-boundary inequality is conditional on an exterior Penrose inequality.

Those statements describe the linked formalization’s coverage, not a claim that every manuscript hypothesis is represented in this interface. The established Schwarzschild formulas, proposed broader theorem, and limited formalization coverage should be read separately.

This explorer is an illustration and example check. It is not a new gravity theory, a theorem-verification system, or a numerical-relativity simulation.

## Verification evidence and limits

The original build passed 86 formula/geometry assertions and 38 simulated DOM/canvas UI assertions. These covered mass–radius–area relations, mass scaling, embedding coordinates and metric agreement, invalid mass, normalized shapes, live substitutions, view switching, camera controls, simulated pointer/pinch interaction, Reset, Fit, and resizing. Those original checks ran in a JavaScript isolate with adapters; they were not real browser tests.

A subsequent actual Node run passed 80 independent formula/geometry assertions against the final physics source, including the horizon relations, scaling, embedding coordinates, metric agreement, and invalid input handling. Both JavaScript files also pass `node --check`. The site uses only the four local runtime files listed above, with no external runtime assets.

The public GitHub Pages deployment was verified in a real desktop browser. Live checks covered numeric mass changes (including radius and area scaling), invalid mass feedback, sphere view, normalized scale, camera buttons, Fit, and repeated Reset. Narrow responsive-window checks covered controls and live readouts. These are desktop-browser checks, not actual phone or multitouch-device testing. All four runtime assets returned HTTP 200.

Simulated tests, browser QA, and the analytic equality example do not establish a proof of the broader theorem.

## Publication

This project is designed for the public repository `schwarzschild-penrose-explorer`. GitHub Pages can serve the default branch’s root directory without a build step. See [GitHub’s Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## License

No license has been selected for this repository. Public visibility alone does not grant an open-source license.

## Primary references

1. [Penrose manuscript](https://github.com/openai/math/blob/main/preprints/Spacetime-Penrose-inequalities-enclosing-area-charge-and-rigidity-October-5-2026/paper.pdf).
2. [Lean scope and comparator links](https://github.com/openai/math/blob/main/lean/docs/260.md).
3. [Embedding diagrams in stationary spacetimes, Scientific Reports (2024)](https://www.nature.com/articles/s41598-024-69871-w).
4. [NIST CODATA constants](https://physics.nist.gov/cuu/pdf/all.pdf).

The scope note and embedding relation were inspected through web tools. The manuscript repository page was inspected, but its PDF body was not independently audited through the available tool.

