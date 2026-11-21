import { Container, Graphics, Text } from "pixi.js";

const INK = "#51463F";
const WIDTH = 1400;
const HEIGHT = 1280;

function shape(
  parent: Container,
  draw: (g: Graphics) => void,
  fill: string,
  stroke = INK,
  width = 3,
  alpha = 1,
) {
  const g = new Graphics();
  draw(g);
  g.fill({ color: fill, alpha });
  if (width > 0) g.stroke({ color: stroke, width, join: "round", cap: "round", alpha });
  parent.addChild(g);
  return g;
}

function product(parent: Container, x: number, y: number, w: number, h: number, color: string, kind: number) {
  const g = new Graphics();
  if (kind % 3 === 0) {
    g.roundRect(x, y + 8, w, h - 8, 7).fill(color).stroke({ color: "#6B5B4C", width: 2 });
    g.roundRect(x + w * .28, y, w * .44, 12, 3).fill("#E6D8C1").stroke({ color: "#6B5B4C", width: 1.5 });
  } else if (kind % 3 === 1) {
    g.roundRect(x, y, w, h, 4).fill(color).stroke({ color: "#6B5B4C", width: 2 });
    g.rect(x + 5, y + h * .34, w - 10, Math.max(8, h * .26)).fill("#F4EBDD");
  } else {
    g.moveTo(x + 3, y + 9).lineTo(x + w - 3, y + 9).lineTo(x + w - 7, y + h).lineTo(x + 7, y + h).closePath()
      .fill(color).stroke({ color: "#6B5B4C", width: 2 });
    g.rect(x + 7, y + h * .42, w - 14, Math.max(8, h * .22)).fill("#F3E8D8");
  }
  parent.addChild(g);
}

function shelf(parent: Container, x: number, y: number, width: number, height: number, density: number, seed: number) {
  shape(parent, g => g.rect(x, y, width, height), "#E5DED4", "#8E8071", 4);
  const rowHeight = height / 4;
  const colors = ["#D36F59", "#D7A94D", "#73966C", "#658D9C", "#B77F58", "#8D779D", "#E5C8A0"];
  for (let row = 0; row < 3; row += 1) {
    const top = y + 12 + row * rowHeight;
    const count = density;
    const cell = (width - 22) / count;
    for (let i = 0; i < count; i += 1) {
      const index = (seed + row * 5 + i * 3) % colors.length;
      const pW = Math.max(18, cell * (.52 + ((i + row) % 3) * .12));
      const pH = rowHeight * (.55 + ((i + seed) % 3) * .08);
      product(parent, x + 10 + i * cell + (cell - pW) / 2, top + rowHeight - pH - 10, pW, pH, colors[index], seed + row + i);
    }
    shape(parent, g => g.rect(x - 3, y + (row + 1) * rowHeight - 8, width + 6, 13), "#B9AA98", "#837566", 2);
    shape(parent, g => g.rect(x + 5, y + (row + 1) * rowHeight + 7, width - 10, 17), "#FFF8ED", "#C7BBAE", 1);
  }
  shape(parent, g => g.rect(x - 7, y + height - 6, width + 14, 16), "#9E8C78", "#6E6258", 2);
}

function drawCart(parent: Container, x: number, y: number) {
  const cart = new Container();
  cart.position.set(x, y);
  shape(cart, g => g.moveTo(0, 0).lineTo(28, 8).lineTo(18, 92).lineTo(116, 92).lineTo(133, 18).lineTo(31, 18), "rgba(255,255,255,0.01)", "#65736F", 4);
  for (let i = 0; i < 4; i += 1) {
    shape(cart, g => g.moveTo(29 + i * 24, 23).lineTo(23 + i * 23, 83), "#FFFFFF", "#91A09B", 1.5);
  }
  shape(cart, g => g.moveTo(26, 50).lineTo(124, 50).moveTo(23, 70).lineTo(120, 70), "#FFFFFF", "#91A09B", 1.5);
  shape(cart, g => g.circle(36, 108, 9), "#59615E", "#3F4846", 2);
  shape(cart, g => g.circle(111, 108, 9), "#59615E", "#3F4846", 2);
  // The basket is intentionally almost empty: this is part of the closing visual joke.
  parent.addChild(cart);
}

export function drawSupermarket(stage: Container) {
  shape(stage, g => g.rect(0, 0, WIDTH, HEIGHT), "#E9E6DF", "#E9E6DF", 0);
  shape(stage, g => g.rect(0, 0, WIDTH, 190), "#F5F3ED", "#F5F3ED", 0);
  shape(stage, g => g.rect(0, 177, WIDTH, 28), "#D8D5CE", "#D8D5CE", 0);

  // Ceiling panels and practical fluorescent fixtures.
  for (let i = 0; i < 5; i += 1) {
    const x = 100 + i * 285;
    shape(stage, g => g.roundRect(x, 36 + (i % 2) * 12, 170, 17, 8), "#FFFFFF", "#D4D0C8", 1, .96);
    shape(stage, g => g.rect(x + 8, 54 + (i % 2) * 12, 154, 3), "#D8E2E4", "#D8E2E4", 0, .5);
  }

  // Perspective end wall and distant inventory.
  shape(stage, g => g.moveTo(210, 205).lineTo(1190, 205).lineTo(1070, 955).lineTo(330, 955).closePath(), "#D8D2C8", "#D8D2C8", 0);
  shape(stage, g => g.rect(500, 220, 410, 48), "#52766D", "#52766D", 0);
  const sign = new Text({
    text: "ALMACÉN",
    style: { fontFamily: "Arial", fontSize: 25, fontWeight: "700", fill: "#FFF8EB", letterSpacing: 5 },
  });
  sign.position.set(617, 229);
  stage.addChild(sign);

  shelf(stage, 300, 305, 800, 590, 10, 4);

  // Side gondolas create a recognisable aisle and frame the action.
  shape(stage, g => g.moveTo(0, 215).lineTo(294, 310).lineTo(294, 905).lineTo(0, 1000).closePath(), "#BEB5A9", "#766B60", 4);
  shape(stage, g => g.moveTo(1400, 215).lineTo(1106, 310).lineTo(1106, 905).lineTo(1400, 1000).closePath(), "#BEB5A9", "#766B60", 4);
  for (let row = 0; row < 3; row += 1) {
    const y = 345 + row * 175;
    for (let i = 0; i < 4; i += 1) {
      product(stage, 24 + i * 61, y + i * 13, 42, 88, ["#D26B55", "#D3A24D", "#69936E", "#65889A"][i], i + row);
      product(stage, 1160 + i * 61, y + (3 - i) * 13, 42, 88, ["#65889A", "#B77D5A", "#71916D", "#D1A64F"][i], i + row + 2);
    }
  }

  // Rails, shelf lips and labels add real supermarket geometry without legibility noise.
  for (const x of [0, 270, 1130, 1370]) {
    shape(stage, g => g.moveTo(x, 330).lineTo(x, 940), "#B4AA9D", "#82766A", 5);
  }
  for (const y of [520, 695, 870]) {
    shape(stage, g => g.moveTo(12, y).lineTo(288, y + 42), "#C8BFB4", "#8B8075", 5);
    shape(stage, g => g.moveTo(1112, y + 42).lineTo(1388, y), "#C8BFB4", "#8B8075", 5);
  }

  // Polished floor with converging perspective and subtle reflections.
  shape(stage, g => g.moveTo(0, 940).lineTo(1400, 940).lineTo(1400, HEIGHT).lineTo(0, HEIGHT).closePath(), "#CFCAC1", "#CFCAC1", 0);
  shape(stage, g => g.moveTo(320, 940).lineTo(0, HEIGHT).moveTo(1080, 940).lineTo(1400, HEIGHT), "#B8B3AA", "#B8B3AA", 2, .65);
  for (let i = 1; i < 6; i += 1) {
    const y = 940 + i * 56;
    shape(stage, g => g.moveTo(0, y).lineTo(WIDTH, y), "#FFFFFF", "#AAA49A", 1, .24);
  }
  shape(stage, g => g.ellipse(680, 1155, 420, 34), "#FFFFFF", "#FFFFFF", 0, .15);

  // A little aisle-end stock keeps the floor from looking like a blank stage.
  drawCart(stage, 755, 1005);
}
