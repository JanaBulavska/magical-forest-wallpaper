// ==========================================================
// GLOBAL VARIABLES
// ==========================================================
//Each mushroom is stored as an object inside an array. 
// Then the drawing functions use this information to draw each mushroom. 
// This makes the project flexible, because each mushroom can have its own unique shape and position.
//one tile is drawn first, and then it is repeated across the whole canvas. 
//To make the edges connect better, objects are also drawn near the edges and copied to the opposite sides.
// Main canvas where we see the final wallpaper
let mainCanvas;
// Small hidden drawing layer for one repeating tile
let tileLayer; 
// Size of one seamless pattern tile
let tileSize = 420;
// Random seed for regenerate button
let currentSeed = 1;
// Object that stores all sliders and buttons from HTML
let controls = {};
// Size of the preview canvas
let wallpaperWidth = 900;
let wallpaperHeight = 1200;
// List of all mushrooms==
let mushrooms = [];
// List of all moving spores
let spores = [];
//  color palette
let palette = [
"#f1a8c2", // soft pink
"#d39df0", // lilac
"#b7d8c0", // pale green
"#f4c1b2", // peach
"#bfb2f5", // lavender
"#f58fb1", // warm pink
"#d7c4f5"  // soft violet
];
// ==========================================================
// SETUP
// This runs once when the sketch starts
// ==========================================================
function setup() {
// Create the main canvas
mainCanvas = createCanvas(wallpaperWidth, wallpaperHeight);
// Put the canvas into the HTML container
mainCanvas.parent("canvas-container");
// Create one extra graphics layer for the seamless tile
tileLayer = createGraphics(tileSize, tileSize); 
// Lower pixel density helps the animation stay stable
pixelDensity(1);
// Connect sliders and buttons
setupControls();
// First random seed
currentSeed = floor(random(100000));
// Build the first scene
buildScene();
// Apply the view mode selected in the dropdown (single tile or 3x3 repeat preview)
// Wrapped safely so it never blocks the rest of the sketch from running
applyViewMode();
}
// ==========================================================
// DRAW
// This runs again and again
// We need this because spores move and mushrooms react to mouse
// ==========================================================
function draw() {
renderScene(true);
}
// ==========================================================
// CONNECT HTML CONTROLS
// ==========================================================
function setupControls() {
// Get sliders from HTML
controls.randomness = document.getElementById("randomness"); // Slider for mushroom randomness
controls.height = document.getElementById("height"); // Slider for mushroom height
controls.capShape = document.getElementById("capShape"); // Slider for mushroom cap shape
controls.glow = document.getElementById("glow"); // Slider for mushroom glow
controls.spores = document.getElementById("spores"); // Slider for spore density
controls.bgColor = document.getElementById("bgColor"); // Slider for background color
// Get the view mode selector (single tile vs 3x3 repeat preview)
controls.viewMode = document.getElementById("viewMode");
// Get text labels that show slider numbers
controls.randomnessValue = document.getElementById("randomnessValue"); // Label for mushroom randomness
controls.heightValue = document.getElementById("heightValue"); //getElementById("heightValue") This allows the code to update the displayed value of the height slider in real-time as the user interacts with it.
controls.capShapeValue = document.getElementById("capShapeValue");
controls.glowValue = document.getElementById("glowValue");
controls.sporesValue = document.getElementById("sporesValue");
// Get buttons
controls.regenerateBtn = document.getElementById("regenerateBtn");
controls.saveBtn = document.getElementById("saveBtn");
// This is necessary so that the numbers next to the sliders update on the screen.
function updateLabels() {
controls.randomnessValue.textContent = controls.randomness.value; // Update the label for mushroom randomness
controls.heightValue.textContent = controls.height.value;
controls.capShapeValue.textContent = controls.capShape.value;
controls.glowValue.textContent = controls.glow.value;
controls.sporesValue.textContent = controls.spores.value;
  }
updateLabels();
// All these inputs should rebuild the scene when changed
let inputsToWatch = [ 
controls.randomness,
controls.height,
controls.capShape,
controls.glow,
controls.spores,
controls.bgColor
  ];
inputsToWatch.forEach((input) => { // For each input, add an event listener
input.addEventListener("input", () => {
updateLabels();
buildScene();
    });
  });
// Make a new random wallpaper
controls.regenerateBtn.addEventListener("click", () => {
currentSeed = floor(random(100000));
buildScene();
  });
// Save wallpaper as PNG
controls.saveBtn.addEventListener("click", () => {
// Draw calm version without mouse movement
renderScene(false);
saveCanvas(mainCanvas, "magical_forest_wallpaper", "png");
  });
// Switch between single tile view and 3x3 repeat preview view
// Only attach this listener if the element actually exists on the page
if (controls.viewMode) {
controls.viewMode.addEventListener("change", () => {
applyViewMode(); // This function resizes the canvas based on the selected view mode
    });
  }
}
// ==========================================================
// VIEW MODE
// Switches the canvas size between:
// - "single": the normal full wallpaper canvas
// - "repeat": a 3x3 grid showing the tile repeated nine times,
//   so the user can see how the pattern looks when tiled
// The existing tiling loop inside renderScene() already fills
// whatever the current width/height is, so resizing the canvas
// is enough to produce a clean 3x3 grid with no extra drawing code.
// ==========================================================
function applyViewMode() {
// If the dropdown is missing from the HTML for any reason,
// just keep the default wallpaper size and do nothing else
if (!controls.viewMode) { 
return;
  }
let mode = controls.viewMode.value;
if (mode === "repeat") {
resizeCanvas(tileSize * 3, tileSize * 3);
  } else {
resizeCanvas(wallpaperWidth, wallpaperHeight);
  }
}
// ==========================================================
// BUILD SCENE
// This creates the mushroom data and spore data
// It does not draw yet — it only prepares data
// ==========================================================
function buildScene() { 
randomSeed(currentSeed); // This makes the randomness repeatable
noiseSeed(currentSeed);
mushrooms = []; // Clear the mushrooms array
spores = [];
let mushroomRandomness = Number(controls.randomness.value); // Slider for mushroom randomness
let mushroomHeight = Number(controls.height.value); 
let sporeIntensity = Number(controls.spores.value);
// More randomness = more mushrooms
let mushroomCount = floor(map(mushroomRandomness, 0, 100, 5, 16));
for (let i = 0; i < mushroomCount; i++) {
mushrooms.push({
// Base position inside one tile
x: random(tileSize), // Random x position within the tile
y: random(tileSize),
// 0 = natural umbrella mushroom
// 1 = bell / magical mushroom
type: random() < 0.5 ? 0 : 1,
// Base mushroom height
h: map(mushroomHeight, 20, 100, 80, 220) * random(0.8, 1.15),
// Width multiplier
widthFactor: random(0.72, 1.18),
// Small rotation so mushrooms do not all look the same
tilt: random(-0.16, 0.16),
// Stem bend
stemCurve: random(-18, 18),
// Mushroom line color
lineColor: random(palette),
// Small horizontal asymmetry
capSkew: random(-0.08, 0.08),
// Wave amount for cap edges
edgeWave: random(0.02, 0.08),
// Random phase for waves
wavePhase: random(TWO_PI),
// Slight base bulb size
bulbSize: random(0.9, 1.25),
// Position of ring on the stem
ringY: random(0.42, 0.62),
// Number of gill lines
gillCount: floor(random(18, 38)),
// Small spores around this mushroom
localSpores: createLocalSporeData(),
// Mouse reaction offsets
offsetX: 0,
offsetY: 0
    });
  }// More spore intensity = more moving spores
  let sporeCount = floor(map(sporeIntensity, 0, 100, 90, 380)); // Number of moving spores
for (let i = 0; i < sporeCount; i++) {
spores.push({ 
x: random(tileSize), 
y: random(tileSize),
size: random(0.8, 3.2),
col: random(palette),
alpha: random(14, 65),
speedX: random(-0.18, 0.18),
speedY: random(-0.12, 0.12),
noiseSeedValue: random(1000),
pushX: 0,
pushY: 0
    });
  }
}
// ==========================================================
// CREATE SMALL LOCAL SPORES AROUND ONE MUSHROOM
// ==========================================================
function createLocalSporeData() { // This function generates a small number of spores that will appear around each mushroom. These spores are stored in the localSpores property of each mushroom object, allowing for a more magical and whimsical effect as they drift around the mushroom caps.
let arr = []; // Create an empty array to hold the local spore data
for (let i = 0; i < 22; i++) { // Generate 22 local spores for each mushroom. This number can be adjusted to create more or fewer spores around each mushroom, depending on the desired visual effect. A higher number of spores will create a denser, more magical appearance, while a lower number will result in a more subtle effect.
arr.push({ // Each spore is represented as an object with properties that define its appearance and behavior. These properties are randomized to create a natural, organic look for the spores.
angle: random(TWO_PI), //
radiusFactor: random(0.18, 0.95),
size: random(1.0, 3.0),
alpha: random(18, 60)
    });
  }
return arr;
}
// ==========================================================
// RENDER FULL SCENE
// interactive = true  -> mouse interaction is active
// interactive = false -> calm static version for saving
// ==========================================================
function renderScene(interactive) {
let mushroomRandomness = Number(controls.randomness.value);
let capShape = Number(controls.capShape.value);
let glowIntensity = Number(controls.glow.value);
let sporeIntensity = Number(controls.spores.value);
let bgColor = controls.bgColor.value;
// Draw page background
background(bgColor);
// Add very light texture
addPaperTexture();
// Clear tile layer for new frame
tileLayer.clear();
tileLayer.noFill();
tileLayer.strokeWeight(1);
// Draw moving spores first
drawMovingSpores(tileLayer, interactive);
// Draw mushrooms
for (let m of mushrooms) {
updateMushroomMouseReaction(m, interactive);
// m.x is the normal position
// m.offsetX is extra position from mouse interaction
// so m.x + m.offsetX means "draw it at normal place plus small shift"
drawWrapped(tileLayer, m.x + m.offsetX, m.y + m.offsetY, (gx, gy) => { 
drawMagicalMushroom(
tileLayer, 
gx,
gy,
m,
mushroomRandomness,
capShape,
glowIntensity,
sporeIntensity
      );
    });
  }
// Repeat the tile across the full canvas
for (let y = -tileSize; y < height + tileSize; y += tileSize) {
for (let x = -tileSize; x < width + tileSize; x += tileSize) {
image(tileLayer, x, y);
    }
  }
// Add extra soft spores over the whole wallpaper
drawGlobalSoftSpores(interactive);
}
// ==========================================================
// MOUSE REACTION FOR MUSHROOMS
// Mushrooms move away a little from the mouse
// Then they smoothly return
// ==========================================================
function updateMushroomMouseReaction(m, interactive) {
if (!interactive) { // If we are rendering a calm version for saving, we don't want any mouse interaction
m.offsetX = 0; 
m.offsetY = 0;
return;
  }
if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) { // If the mouse is outside the canvas, smoothly return to normal position
m.offsetX = lerp(m.offsetX, 0, 0.08);
m.offsetY = lerp(m.offsetY, 0, 0.08);
return;
  }
let mx = mouseX % tileSize;
let my = mouseY % tileSize;
let dx = m.x - mx;
let dy = m.y - my;
// This makes the reaction work correctly on seamless edges
if (dx > tileSize / 2) dx -= tileSize; //
if (dx < -tileSize / 2) dx += tileSize;
if (dy > tileSize / 2) dy -= tileSize;
if (dy < -tileSize / 2) dy += tileSize;
let d = sqrt(dx * dx + dy * dy); // Distance from mushroom to mouse
let reactionRadius = 150; // How far the mouse can influence mushrooms
let targetX = 0;
let targetY = 0;
if (d < reactionRadius && d > 0.01) {
let force = map(d, 0, reactionRadius, 10, 0);
// dx / d gives the direction
// then we multiply by force
targetX = (dx / d) * force; 
targetY = (dy / d) * force;
  }
m.offsetX = lerp(m.offsetX, targetX, 0.08);
m.offsetY = lerp(m.offsetY, targetY, 0.08);
}// ==========================================================
// DRAW WRAPPED COPIES
// This helps make the pattern seamless
// ==========================================================
function drawWrapped(g, x, y, drawFn) {
for (let offsetX of [-tileSize, 0, tileSize]) { // Draw the main copy and two extra copies on the left and right
for (let offsetY of [-tileSize, 0, tileSize]) {
drawFn(x + offsetX, y + offsetY);
    }
  }
}
// ==========================================================
// DRAW MOVING SPORES
// ==========================================================
function drawMovingSpores(g, interactive) { 
for (let s of spores) { // Loop through each spore in the spores array
if (interactive) {
let nX = noise(s.noiseSeedValue + frameCount * 0.006); // This uses Perlin noise to create smooth, natural-looking movement for the spores.
//  The noise function generates a value between 0 and 1 based on the input, which changes over time with frameCount. By adding a unique noiseSeedValue for each spore, we ensure that each spore moves differently, creating a more organic effect. The result is that spores drift around in a way that feels random but is actually smoothly varying over time.
let nY = noise(s.noiseSeedValue + 500 + frameCount * 0.006);
s.x += s.speedX + map(nX, 0, 1, -0.12, 0.12); // The map function takes the noise value (nX) and maps it from the range [0, 1] to a new range [-0.12, 0.12]. This means that when nX is 0, the mapped value will be -0.12, and when nX is 1, the mapped value will be 0.12. This mapped value is then added to the spore's speedX, causing the spore to drift left or right in a smooth, natural way. The same logic applies for the y-coordinate with nY.
s.y += s.speedY + map(nY, 0, 1, -0.10, 0.10);
s.x = (s.x + tileSize) % tileSize; // This line ensures that spores wrap around the edges of the tile. If a spore moves beyond the right edge (x > tileSize), it will reappear on the left edge (x = 0). Similarly, if it moves beyond the left edge (x < 0), it will reappear on the right edge (x = tileSize). The same logic applies for the y-coordinate. This wrapping behavior is crucial for maintaining the seamless pattern effect, as it prevents spores from disappearing off-screen and ensures they continue to contribute to the overall visual texture of the wallpaper.
s.y = (s.y + tileSize) % tileSize;
updateSporeMouseReaction(s);
    } else {
s.pushX = 0;
s.pushY = 0;
    }
let drawX = s.x + s.pushX; // The final position where the spore will be drawn, including any offset from mouse interaction. This allows spores to react to the mouse by moving away from it, creating a dynamic and interactive effect. The pushX and pushY values are calculated based on the distance and direction from the mouse to the spore, and they are smoothly interpolated to create a natural movement.
let drawY = s.y + s.pushY;
drawWrapped(g, drawX, drawY, (gx, gy) => {
let c = color(s.col); // Convert the spore's color string to a p5.js color object, which allows us to easily manipulate its red, green, blue, and alpha components for drawing.
g.noStroke();
g.fill(red(c), green(c), blue(c), s.alpha);
g.ellipse(gx, gy, s.size, s.size);
if (s.size > 1.8) {
g.fill(red(c), green(c), blue(c), s.alpha * 0.22); // This creates a soft glow effect around larger spores. The fill color is the same as the spore's color, but with reduced alpha (transparency) to make it appear more ethereal and less solid. The ellipse drawn here is larger than the main spore ellipse, which gives the impression of a faint halo or aura surrounding the spore, enhancing the magical and whimsical feel of the wallpaper.
g.ellipse(gx, gy, s.size * 3.4, s.size * 3.4);
      }
g.stroke(red(c), green(c), blue(c), s.alpha * 0.45);
g.strokeWeight(0.35);
g.line(gx, gy, gx - s.speedX * 18, gy - s.speedY * 18);
    });
  }
}
// ==========================================================
// MOUSE REACTION FOR SPORES
// ==========================================================
function updateSporeMouseReaction(s) {
if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) { // If the mouse is outside the canvas, smoothly return to normal position
s.pushX = lerp(s.pushX, 0, 0.05); // The lerp function is used to smoothly interpolate the spore's pushX and pushY values back to 0 when the mouse is outside the canvas. This creates a natural easing effect, making the spores gradually return to their original positions instead of snapping back abruptly. The third parameter (0.05) controls the speed of this interpolation, with smaller values resulting in slower movement and larger values resulting in faster movement.
s.pushY = lerp(s.pushY, 0, 0.05);
return;
  }
let mx = mouseX % tileSize; // The modulo operator (%) is used to wrap the mouse coordinates around the tile size, ensuring that the mouse position is always within the bounds of the seamless tile. This is important for calculating the distance between the mouse and each spore, as it allows spores to react to the mouse even when it is near the edges of the tile. By using mx and my, we can determine how close each spore is to the mouse and apply a repelling force accordingly.
let my = mouseY % tileSize;
let dx = s.x - mx;
let dy = s.y - my;
if (dx > tileSize / 2) dx -= tileSize; // This makes the reaction work correctly on seamless edges. If the spore is on the right side of the tile and the mouse is on the left side, we want to treat them as being close together, not far apart. By subtracting tileSize from dx when it's greater than half the tile size, we effectively "wrap" the distance calculation around the edges of the tile. This ensures that spores react to the mouse in a way that maintains the seamless pattern effect, allowing for a more natural and continuous interaction across tile boundaries.
if (dx < -tileSize / 2) dx += tileSize;
if (dy > tileSize / 2) dy -= tileSize;
if (dy < -tileSize / 2) dy += tileSize;
let d = sqrt(dx * dx + dy * dy);
let radius = 120;
let targetX = 0;
let targetY = 0;
if (d < radius && d > 0.01) {
let force = map(d, 0, radius, 22, 0); // The map function is used to calculate the repelling force based on the distance (d) between the spore and the mouse. When the spore is very close to the mouse (d = 0), the force is at its maximum value of 22, causing a strong repelling effect. As the distance increases towards the radius limit (d = radius), the force decreases linearly to 0, meaning that spores farther away from the mouse will experience little to no repelling effect. This creates a natural gradient of interaction, where spores closer to the mouse are pushed away more strongly than those farther away.
targetX = (dx / d) * force; // The direction of the repelling force is calculated by normalizing the distance vector (dx, dy) and multiplying it by the calculated force. This ensures that the spore moves directly away from the mouse, with the magnitude of the movement determined by how close it is to the mouse. The same logic applies for targetY, allowing spores to move in both x and y directions based on their relative position to the mouse.
targetY = (dy / d) * force;
  }
s.pushX = lerp(s.pushX, targetX, 0.09);
s.pushY = lerp(s.pushY, targetY, 0.09);
}// ==========================================================
// MAIN MUSHROOM DRAW FUNCTION
// Chooses which mushroom type to draw
// ==========================================================
function drawMagicalMushroom(g, x, y, data, randomness, capShape, glowIntensity, sporeIntensity) {
g.push();
g.translate(x, y);
g.rotate(data.tilt);
let lineCol = color(data.lineColor);
if (data.type === 0) {
drawNaturalUmbrellaMushroom(g, data, randomness, capShape, glowIntensity, sporeIntensity, lineCol);
  } else {
drawBellMagicalMushroom(g, data, randomness, capShape, glowIntensity, sporeIntensity, lineCol);
  }
g.pop();
}
// ==========================================================
// TYPE 1: NATURAL UMBRELLA MUSHROOM
// More like a forest mushroom
// ==========================================================
function drawNaturalUmbrellaMushroom(g, data, randomness, capShape, glowIntensity, sporeIntensity, lineCol) {
let h = data.h; // The height of the mushroom is determined by the data.h property, which is set when the mushroom is created. This height can vary based on user input from the height slider, allowing for a range of mushroom sizes in the scene. The height is used to calculate other dimensions of the mushroom, such as the cap width and height, ensuring that all parts of the mushroom scale proportionally to create a natural appearance.
let capW = h * data.widthFactor * 0.95; // The cap width is calculated based on the mushroom height and a width factor, which allows for variation in the shape of the mushroom caps. The width factor is a random value assigned to each mushroom, making some caps wider or narrower than others. The multiplier of 0.95 slightly reduces the cap width to ensure that it doesn't become too large relative to the stem, maintaining a natural and balanced appearance for the umbrella mushrooms.
let capH = map(capShape, 0, 100, h * 0.16, h * 0.30); // The cap height is determined by the capShape parameter, which is controlled by a slider in the user interface. The map function takes the capShape value (ranging from 0 to 100) and maps it to a range of heights based on the mushroom's overall height (h). This allows users to adjust the shape of the mushroom caps, making them flatter or more domed, while still keeping the proportions consistent with the rest of the mushroom.
let underDepth = map(capShape, 0, 100, h * 0.08, h * 0.14); // The underDepth variable controls how deep the gills of the mushroom are drawn beneath the cap. It is also mapped from the capShape value, allowing for a consistent relationship between the cap's shape and the depth of the gills. A flatter cap will have shallower gills, while a more domed cap will have deeper gills, enhancing the realism of the mushroom's structure.
let stemTopW = h * 0.05; // The stemTopW variable defines the width of the mushroom stem at its top, where it connects to the cap. It is calculated as a percentage of the mushroom's height (h), ensuring that the stem's proportions remain consistent with the overall size of the mushroom. A smaller value results in a thinner stem, while a larger value creates a more robust appearance.
let stemBottomW = h * 0.10; 
drawGlowAura(g, 0, -h, capW * 0.9, glowIntensity, lineCol); // The drawGlowAura function creates a soft, glowing effect around the mushroom cap, enhancing its magical appearance. The glow is drawn at the top of the stem (0, -h) and is sized based on the cap width (capW * 0.9). The glowIntensity parameter controls how strong the glow appears, allowing for user customization. The lineCol variable determines the color of the glow, which matches the color of the mushroom's outline, creating a cohesive visual effect.
drawNaturalStem(g, h, stemBottomW, stemTopW, data.stemCurve, lineCol, randomness, data);
// Gills go under the cap
drawUmbrellaGills(g, h, capW, underDepth, lineCol, data); // The drawUmbrellaGills function is responsible for rendering the gills of the umbrella mushroom. It is called after the stem is drawn but before the cap, ensuring that the gills appear beneath the cap in the final rendering. The function takes several parameters: g (the graphics context), h (the height of the mushroom), capW (the width of the cap), underDepth (the depth of the gills), lineCol (the color of the lines used to draw the gills), and data (the mushroom's data object containing properties like gillCount). This function creates a realistic representation of the gills, contributing to the overall natural appearance of the mushroom.
// Cap outline goes above the gills
drawUmbrellaCap(g, h, capW, capH, underDepth, lineCol, data, randomness);
// Add a few thin contour lines on the cap
drawUmbrellaCapContours(g, h, capW, capH, lineCol);
drawLocalSpores(g, 0, -h, capW, sporeIntensity, lineCol, data);
}
// ==========================================================
// TYPE 2: BELL / MAGICAL MUSHROOM
// More fantasy, but still clearly a mushroom
// ==========================================================
function drawBellMagicalMushroom(g, data, randomness, capShape, glowIntensity, sporeIntensity, lineCol) {
let h = data.h * 0.92;
let capW = data.h * data.widthFactor * 0.78; // Bell caps are a bit narrower
let capH = map(capShape, 0, 100, h * 0.20, h * 0.38); // Bell caps can be taller, so we increase the max cap height range
let stemTopW = h * 0.04;
let stemBottomW = h * 0.075;
drawGlowAura(g, 0, -h * 0.95, capW * 1.0, glowIntensity, lineCol);
drawBellStem(g, h, stemBottomW, stemTopW, data.stemCurve, lineCol, randomness, data);
drawBellGills(g, h, capW, capH, lineCol, data);
drawBellCap(g, h, capW, capH, lineCol, data, randomness);
drawBellCapContours(g, h, capW, capH, lineCol, data);
drawLocalSpores(g, 0, -h, capW, sporeIntensity, lineCol, data);
}// ==========================================================
// NATURAL STEM FOR UMBRELLA MUSHROOM
// ==========================================================
function drawNaturalStem(g, h, bottomW, topW, curveAmount, lineCol, randomness, data) {
let lineCount = floor(map(randomness, 0, 100, 14, 30));  // The lineCount variable determines how many individual lines will be drawn to create the stem of the mushroom. It is calculated by mapping the randomness parameter (which ranges from 0 to 100) to a range of 14 to 30 lines. A higher randomness value results in more lines, giving the stem a more textured and organic appearance. This approach allows for variability in the stem's visual complexity, making each mushroom look unique and natural.
for (let i = 0; i < lineCount; i++) { // Draw multiple lines to create a natural, slightly irregular stem. The number of lines is determined by the lineCount variable, which is mapped from the randomness parameter. A higher randomness value results in more lines, giving the stem a more textured and organic appearance. Each line is drawn using a Bezier curve, with control points that create a subtle bend in the stem, simulating the natural growth patterns of mushrooms. The loop iterates through each line, calculating its position and curvature based on its index (i) and the total number of lines (lineCount), ensuring that the lines are evenly distributed across the width of the stem.
let t = map(i, 0, lineCount - 1, -1, 1); // The variable t is used to determine the relative position of each line along the width of the stem. It is calculated by mapping the index of the current line (i) to a range of -1 to 1, where -1 represents the left edge of the stem, 0 represents the center, and 1 represents the right edge. This allows for a smooth distribution of lines across the stem's width, creating a more natural and organic appearance. The value of t is then used to calculate the starting and ending x-coordinates of each line, as well as the control points for the Bezier curves that define the shape of the stem.
let startX = t * bottomW * data.bulbSize; // The startX variable determines the starting x-coordinate of each line that makes up the stem. It is calculated by mapping the index of the current line (i) to a range of -1 to 1, and then multiplying it by the bottom width of the stem (bottomW) and a bulb size factor (data.bulbSize). This ensures that the lines are evenly distributed across the width of the stem, with some lines starting closer to the center and others starting further out towards the edges. The bulb size factor allows for slight variations in the width of the stem at its base, creating a more natural and organic appearance.
let endX = t * topW; // The endX variable determines the ending x-coordinate of each line that makes up the stem. It is calculated by mapping the index of the current line (i) to a range of -1 to 1, and then multiplying it by the top width of the stem (topW). This ensures that the lines are evenly distributed across the width of the stem, with some lines ending closer to the center and others ending further out towards the edges. The top width of the stem is typically narrower than the bottom width, creating a tapered effect that gives the stem a more natural and organic appearance.
let ctrlX1 = startX + curveAmount * 0.20;
let ctrlX2 = endX - curveAmount * 0.18; // The ctrlX1 and ctrlX2 variables determine the x-coordinates of the control points for the Bezier curves that define the shape of each line in the stem. These control points are used to create a subtle bend in the lines, simulating the natural growth patterns of mushrooms. The curveAmount parameter allows for customization of the curvature, with larger values resulting in more pronounced bends. By adjusting the control points based on the starting and ending x-coordinates (startX and endX), we can create a smooth transition from the base of the stem to the top, giving it a more organic and lifelike appearance.
let alpha = 115 + abs(t) * 55; // The alpha variable determines the transparency of each line that makes up the stem. It is calculated by adding a base value of 115 to the absolute value of t (which ranges from -1 to 1) multiplied by 55. This means that lines closer to the center of the stem (where t is near 0) will have a lower alpha value (more transparent), while lines closer to the edges (where t is near -1 or 1) will have a higher alpha value (less transparent). This creates a subtle gradient effect, making the stem appear more three-dimensional and natural.
g.stroke(red(lineCol), green(lineCol), blue(lineCol), alpha); 
g.strokeWeight(0.8);
g.noFill();
g.bezier(
startX, 0,
ctrlX1, -h * 0.28,
ctrlX2, -h * 0.72,
endX, -h
    );
  }
// Ring on the stem
let ringY = -h * data.ringY;
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 80);
g.strokeWeight(0.9);
g.ellipse(0, ringY, topW * 5.3, topW * 1.5);
// Slight bulb base
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 70);
g.ellipse(0, 6, bottomW * 3.0 * data.bulbSize, bottomW * 1.25 * data.bulbSize);
// Small lower contour
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 40);
g.arc(0, 10, bottomW * 4.0 * data.bulbSize, bottomW * 1.8 * data.bulbSize, PI, TWO_PI);
}
// ==========================================================
// STEM FOR BELL MUSHROOM
// Slightly thinner and more elegant
// ==========================================================
function drawBellStem(g, h, bottomW, topW, curveAmount, lineCol, randomness, data) {
let lineCount = floor(map(randomness, 0, 100, 12, 26));
for (let i = 0; i < lineCount; i++) {
let t = map(i, 0, lineCount - 1, -1, 1);
let startX = t * bottomW;
let endX = t * topW;
let ctrlX1 = startX + curveAmount * 0.18;
let ctrlX2 = endX - curveAmount * 0.24;
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 110 + abs(t) * 50);
g.strokeWeight(0.75);
g.noFill();
g.bezier(
startX, 0,
ctrlX1, -h * 0.32, // The control point for the Bezier curve is positioned at a height of -h * 0.32, which means it is located 32% of the way down from the top of the stem. This placement creates a gentle inward curve in the stem, giving it a more elegant and natural appearance. The control point's x-coordinate (ctrlX1) is adjusted based on the starting x-coordinate (startX) and the curveAmount parameter, allowing for customization of the curvature. By carefully positioning this control point, we can achieve a smooth transition from the base of the stem to the top, enhancing the overall aesthetic of the bell mushroom.
ctrlX2, -h * 0.76,
endX, -h
    );
  }
// Small base
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 60);
g.ellipse(0, 5, bottomW * 2.5 * data.bulbSize, bottomW * 0.95 * data.bulbSize);
// Small lower frill / root-like lines
for (let i = 0; i < 7; i++) {
let t = map(i, 0, 6, -1, 1);
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 35);
g.line(t * bottomW * 0.9, 1, t * bottomW * 1.8, 10 + abs(t) * 4);
  }
}
// ==========================================================
// UMBRELLA CAP
// This is the main dome cap for type 1
// ==========================================================
function drawUmbrellaCap(g, h, capW, capH, underDepth, lineCol, data, randomness) {
g.noFill();
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 145); 
g.strokeWeight(1);
g.beginShape();
// Top outer line
for (let i = 0; i <= 80; i++) {
let t = map(i, 0, 80, -1, 1);
let px = t * capW * (1 + data.capSkew * t);
let py = -h - capH * (1 - pow(abs(t), 1.45));
g.vertex(px, py);
  }
// Bottom under line
for (let i = 80; i >= 0; i--) {
let t = map(i, 0, 80, -1, 1);
let px = t * capW * 0.87;
let py = -h + underDepth * (0.55 + 0.35 * abs(t));
g.vertex(px, py);
  }
g.endShape(CLOSE);
}// ==========================================================
// EXTRA CAP CONTOURS FOR TYPE 1
// Small contour lines make the cap richer
// ==========================================================
function drawUmbrellaCapContours(g, h, capW, capH, lineCol) {
for (let c = 1; c <= 3; c++) { // Draw 3 extra contour lines on the cap, each slightly smaller than the last. This creates a sense of depth and texture on the mushroom cap, making it appear more three-dimensional and visually interesting. The loop iterates three times, with each iteration drawing a contour line that is scaled down by a factor of 0.16 for each subsequent line. This scaling gives the impression of layers or ridges on the cap, enhancing the overall realism of the mushroom's appearance.
let shrink = 1 - c * 0.16;
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 45);
g.noFill();
g.beginShape();
for (let i = 0; i <= 70; i++) {
let t = map(i, 0, 70, -1, 1);
let px = t * capW * shrink;
let py = -h - capH * 0.75 * (1 - pow(abs(t), 1.35));
g.vertex(px, py);
    }
g.endShape();
  }
}
// ==========================================================
// GILLS FOR TYPE 1
// These make the mushroom look more natural
// ==========================================================
function drawUmbrellaGills(g, h, capW, underDepth, lineCol, data) {
let count = data.gillCount;
for (let i = 0; i < count; i++) {
let t = map(i, 0, count - 1, -1, 1);
let edgeX = t * capW * 0.82;
let edgeY = -h + underDepth * (0.52 + 0.30 * abs(t));
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 65);
g.strokeWeight(0.65);
// Gills start from the center under the cap
g.line(0, -h + underDepth * 0.10, edgeX, edgeY);
  }
}
// ==========================================================
// BELL CAP
// This is the cap for the second mushroom type
// ==========================================================
function drawBellCap(g, h, capW, capH, lineCol, data, randomness) {
g.noFill();
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 140);
g.strokeWeight(1);
g.beginShape();
// Outer bell shape
for (let i = 0; i <= 90; i++) {
let t = map(i, 0, 90, -1, 1);
let px = t * capW * (1 + data.capSkew * t * 0.6);
// This makes the sides hang down more,
// so the cap looks like a bell
let py = -h - capH * (1 - pow(abs(t), 1.8)) + abs(t) * capH * 0.52;
g.vertex(px, py);
  }
// Inner underside line
for (let i = 90; i >= 0; i--) {
let t = map(i, 0, 90, -1, 1);
let wave = sin((t + 1) * PI * 2 + data.wavePhase) * capH * data.edgeWave * 3.5;
let px = t * capW * 0.78;
let py = -h + capH * 0.22 + abs(t) * capH * 0.12 + wave;
g.vertex(px, py);
  }
g.endShape(CLOSE);
}
// ==========================================================
// EXTRA CONTOURS FOR TYPE 2
// ==========================================================
function drawBellCapContours(g, h, capW, capH, lineCol, data) {
for (let c = 1; c <= 3; c++) {
let shrink = 1 - c * 0.16;
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 42);
g.noFill();
g.beginShape();
for (let i = 0; i <= 80; i++) {
let t = map(i, 0, 80, -1, 1);
let px = t * capW * shrink;
let py = -h - capH * 0.72 * (1 - pow(abs(t), 1.7)) + abs(t) * capH * 0.28;
g.vertex(px, py);
    }
g.endShape();
  }
}// ==========================================================
// GILLS FOR TYPE 2
// These follow the bell cap
// ==========================================================
function drawBellGills(g, h, capW, capH, lineCol, data) {
let count = floor(data.gillCount * 0.85);
for (let i = 0; i < count; i++) {
let t = map(i, 0, count - 1, -1, 1);
let edgeX = t * capW * 0.72;
let wave = sin((t + 1) * PI * 2 + data.wavePhase) * capH * data.edgeWave * 2.5;
let edgeY = -h + capH * 0.23 + abs(t) * capH * 0.10 + wave;
g.stroke(red(lineCol), green(lineCol), blue(lineCol), 58);
g.strokeWeight(0.6);
g.line(0, -h + capH * 0.05, edgeX, edgeY);
  }
}
// ==========================================================
// GLOW AURA
// Soft transparent glow behind mushrooms
// ==========================================================
function drawGlowAura(g, cx, cy, capW, glowIntensity, lineCol) { // Draws a soft glow effect behind each mushroom
let glowAlpha = map(glowIntensity, 0, 100, 0, 55); // The maximum alpha value for the glow effect is set to 55, which means that at full glow intensity, the glow will be semi-transparent. This allows the glow to be visible without completely obscuring the background or other elements in the scene. The alpha value is then divided by (i + 1) in the loop to create a gradient effect, where each successive ellipse has a lower alpha, resulting in a smooth transition from bright to faint glow.
for (let i = 0; i < 4; i++) {
let scale = 1 + i * 0.22; // Each successive ellipse is slightly larger, creating a layered glow effect
let glowCol = color(
red(lineCol),
green(lineCol),
blue(lineCol),
glowAlpha / (i + 1) // The alpha value decreases with each iteration, creating a gradient effect for the glow. The first ellipse will have the highest alpha (most opaque), and each subsequent ellipse will be more transparent, giving the appearance of a soft, fading glow around the mushroom.
    );
g.noStroke();
g.fill(glowCol);
g.ellipse(cx, cy, capW * 1.18 * scale, capW * 0.58 * scale);
  }
g.noFill();
}
// ==========================================================
// LOCAL SPORES AROUND EACH MUSHROOM
// ==========================================================
function drawLocalSpores(g, cx, cy, capW, sporeIntensity, lineCol, data) { 
let count = floor(map(sporeIntensity, 0, 100, 4, data.localSpores.length)); // The number of spores drawn around each mushroom is determined by the sporeIntensity slider. At low intensity, only a few spores are drawn, while at high intensity, more spores are drawn, up to the maximum number defined in data.localSpores. This allows the user to control how "spore-heavy" the scene appears, adding to the magical and whimsical feel of the wallpaper.
for (let i = 0; i < count; i++) {
let sp = data.localSpores[i];
let sx = cx + cos(sp.angle) * capW * sp.radiusFactor;
let sy = cy + sin(sp.angle) * capW * sp.radiusFactor * 0.75; // Slight vertical squish so spores are not too far from the cap
g.noStroke();
g.fill(red(lineCol), green(lineCol), blue(lineCol), sp.alpha);
g.ellipse(sx, sy, sp.size, sp.size);
  }
g.noFill();
}// ==========================================================
// EXTRA SOFT SPORES ACROSS THE WHOLE WALLPAPER
// ==========================================================
function drawGlobalSoftSpores(interactive) {
randomSeed(currentSeed + 999); // This ensures that the soft spores are always in the same place for a given seed, making the pattern repeatable. By adding a constant value (999) to the currentSeed, we create a separate random sequence for the global spores that is independent of the other random elements in the scene. This allows us to maintain consistency in the placement of these soft spores across different renders of the same wallpaper.
let count = 80;
for (let i = 0; i < count; i++) {
let x = random(width);
let y = random(height);
let size = random(0.8, 2.4);
let col = color(random(palette));
let alpha = random(8, 25);
if (interactive) {
x += sin(frameCount * 0.01 + i) * 3;
y += cos(frameCount * 0.008 + i * 1.7) * 3;
    }
noStroke();
fill(red(col), green(col), blue(col), alpha);
ellipse(x, y, size, size);
  }
noFill();
}
// ==========================================================
// PAPER TEXTURE
// Tiny dots so the background does not look too flat
// ==========================================================
function addPaperTexture() {
randomSeed(currentSeed + 12345);
for (let i = 0; i < 1300; i++) {
let x = random(width);
let y = random(height);
let alpha = random(5, 13);
stroke(255, 255, 255, alpha);
point(x, y);
if (random() < 0.32) {
stroke(120, 100, 90, alpha * 0.45);
point(x + random(-1, 1), y + random(-1, 1));
    }
  }
noStroke();
}