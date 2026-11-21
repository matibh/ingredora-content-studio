import { Container, Graphics } from "pixi.js";
import type { CharacterId, DialogueCue, Gesture } from "./types";

const INK = "#473A34";
const WHITE = "#FFF8EF";

interface CharacterProfile {
  id: CharacterId;
  name: string;
  skin: string;
  hair: string;
  hairStyle: "bob" | "crop" | "shag" | "waves" | "silver";
  shirt: string;
  pants: string;
  accent: string;
  shoulders: number;
  waist: number;
  hips: number;
  headWidth: number;
  headHeight: number;
  height: number;
  body: "pear" | "athletic" | "lanky" | "hourglass" | "stocky";
  accessory?: "earring" | "glasses";
  beard?: boolean;
}

const PROFILES: Record<CharacterId, CharacterProfile> = {
  martina: {
    id: "martina", name: "MARTINA", skin: "#E9B99D", hair: "#34241F",
    hairStyle: "bob", shirt: "#D6A536", pants: "#355B5A", accent: "#F5E8CF",
    shoulders: 58, waist: 41, hips: 55, headWidth: 34, headHeight: 47,
    height: 1.00, body: "pear"
  },
  bruno: {
    id: "bruno", name: "BRUNO", skin: "#DDAA88", hair: "#32241F",
    hairStyle: "crop", shirt: "#E46F5D", pants: "#37475D", accent: "#F7D9C9",
    shoulders: 70, waist: 57, hips: 59, headWidth: 38, headHeight: 45,
    height: 1.01, body: "athletic"
  },
  tomas: {
    id: "tomas", name: "TOMÁS", skin: "#E8B997", hair: "#65442F",
    hairStyle: "shag", shirt: "#6F9B66", pants: "#765B48", accent: "#F3E8D7",
    shoulders: 50, waist: 39, hips: 47, headWidth: 31, headHeight: 50,
    height: 1.08, body: "lanky"
  },
  valentina: {
    id: "valentina", name: "VALENTINA", skin: "#EBC0A5", hair: "#2E211F",
    hairStyle: "waves", shirt: "#386E7A", pants: "#35424D", accent: "#E98A72",
    shoulders: 57, waist: 40, hips: 56, headWidth: 34, headHeight: 46,
    height: 1.02, body: "hourglass", accessory: "earring"
  },
  ernesto: {
    id: "ernesto", name: "ERNESTO", skin: "#D6A486", hair: "#7C7D78",
    hairStyle: "silver", shirt: "#B86F50", pants: "#51504D", accent: "#F0E4D1",
    shoulders: 65, waist: 62, hips: 65, headWidth: 39, headHeight: 47,
    height: 0.91, body: "stocky", accessory: "glasses", beard: true
  }
};

function shape(parent: Container, draw: (g: Graphics) => void, fill: string, width = 4) {
  const g = new Graphics();
  draw(g);
  g.fill(fill);
  if (width > 0) g.stroke({ color: INK, width, join: "round", cap: "round" });
  parent.addChild(g);
  return g;
}

function line(parent: Container, draw: (g: Graphics) => void, color: string, width: number) {
  const g = new Graphics();
  draw(g);
  g.stroke({ color, width, join: "round", cap: "round" });
  parent.addChild(g);
  return g;
}

function createHairBack(profile: CharacterProfile, head: Container) {
  const g = new Graphics();
  if (profile.hairStyle === "bob") {
    g.moveTo(-33, -23).bezierCurveTo(-54, -77, -31, -98, 4, -96)
      .bezierCurveTo(47, -94, 51, -59, 38, -12).lineTo(38, 75)
      .bezierCurveTo(25, 88, 18, 63, 18, 40).lineTo(-20, 42)
      .bezierCurveTo(-22, 77, -43, 85, -48, 59).lineTo(-43, -12).closePath();
  } else if (profile.hairStyle === "waves") {
    g.moveTo(-34, -15).bezierCurveTo(-55, -83, -25, -101, 4, -99)
      .bezierCurveTo(54, -96, 55, -45, 43, -5).lineTo(53, 119)
      .bezierCurveTo(40, 141, 28, 111, 27, 79).lineTo(-30, 83)
      .bezierCurveTo(-36, 117, -52, 137, -58, 108).lineTo(-46, -3).closePath();
  } else if (profile.hairStyle === "silver") {
    g.moveTo(-38, -24).bezierCurveTo(-49, -83, -27, -96, 0, -95)
      .bezierCurveTo(35, -98, 49, -72, 43, -26).lineTo(35, 11)
      .lineTo(-34, 11).closePath();
  } else if (profile.hairStyle === "shag") {
    g.moveTo(-36, -18).bezierCurveTo(-54, -59, -34, -93, -12, -94)
      .lineTo(-23, -110).lineTo(-1, -99).lineTo(8, -117).lineTo(20, -93)
      .bezierCurveTo(52, -91, 51, -56, 39, -17).lineTo(32, 9)
      .lineTo(-34, 9).closePath();
  } else {
    g.moveTo(-37, -23).bezierCurveTo(-48, -82, -17, -95, 8, -91)
      .bezierCurveTo(41, -93, 49, -64, 40, -23).lineTo(32, 8)
      .lineTo(-34, 8).closePath();
  }
  g.fill(profile.hair).stroke({ color: INK, width: 5, join: "round" });
  head.addChild(g);
}

function createHairFront(profile: CharacterProfile, head: Container) {
  const g = new Graphics();
  if (profile.hairStyle === "bob") {
    g.moveTo(-36, -34).bezierCurveTo(-37, -83, -8, -97, 18, -88)
      .bezierCurveTo(40, -81, 47, -55, 34, -35)
      .bezierCurveTo(17, -49, 4, -50, -8, -39)
      .bezierCurveTo(-17, -31, -24, -28, -36, -34).closePath();
  } else if (profile.hairStyle === "crop") {
    g.moveTo(-37, -31).bezierCurveTo(-49, -68, -25, -91, -8, -89)
      .lineTo(-14, -106).lineTo(5, -91).lineTo(19, -105).lineTo(22, -84)
      .bezierCurveTo(44, -77, 48, -52, 34, -28)
      .lineTo(22, -41).lineTo(8, -37).lineTo(-3, -48).lineTo(-19, -37).closePath();
  } else if (profile.hairStyle === "shag") {
    g.moveTo(-36, -31).bezierCurveTo(-47, -76, -21, -97, -8, -92)
      .lineTo(-18, -109).lineTo(1, -95).lineTo(12, -112).lineTo(22, -89)
      .lineTo(43, -95).lineTo(37, -70).bezierCurveTo(49, -52, 43, -38, 32, -30)
      .lineTo(21, -45).lineTo(8, -37).lineTo(-7, -48).lineTo(-23, -35).closePath();
  } else if (profile.hairStyle === "waves") {
    g.moveTo(-38, -29).bezierCurveTo(-47, -79, -18, -101, 13, -92)
      .bezierCurveTo(45, -83, 49, -55, 35, -28)
      .bezierCurveTo(17, -49, 5, -50, -9, -39)
      .bezierCurveTo(-19, -31, -28, -28, -38, -29).closePath();
  } else {
    g.moveTo(-38, -34).bezierCurveTo(-45, -75, -20, -94, 3, -93)
      .bezierCurveTo(33, -95, 45, -67, 36, -37)
      .bezierCurveTo(18, -52, 2, -48, -12, -39).closePath();
  }
  g.fill(profile.hair).stroke({ color: INK, width: 4, join: "round" });
  head.addChild(g);
}

function createFace(profile: CharacterProfile, head: Container) {
  const w = profile.headWidth;
  const h = profile.headHeight;
  const face = new Graphics();
  if (profile.id === "martina") {
    face.moveTo(-w * 0.95, -h * 0.30)
      .bezierCurveTo(-w * 1.02, -h * 0.90, -w * 0.43, -h * 1.10, 0, -h * 1.02)
      .bezierCurveTo(w * 0.64, -h * 1.10, w * 1.00, -h * 0.72, w * 0.94, -h * 0.12)
      .lineTo(w * 0.70, h * 0.48).lineTo(w * 0.28, h * 0.95)
      .quadraticCurveTo(0, h * 1.13, -w * 0.28, h * 0.95)
      .lineTo(-w * 0.72, h * 0.48).closePath();
  } else if (profile.id === "bruno") {
    face.moveTo(-w * 0.96, -h * 0.24)
      .bezierCurveTo(-w * 1.04, -h * 0.87, -w * 0.52, -h * 1.08, 0, -h * 1.00)
      .bezierCurveTo(w * 0.63, -h * 1.08, w * 1.03, -h * 0.73, w * 0.98, -h * 0.12)
      .lineTo(w * 0.90, h * 0.43).quadraticCurveTo(w * 0.66, h * 0.94, 0, h * 0.92)
      .quadraticCurveTo(-w * 0.70, h * 0.92, -w * 0.91, h * 0.40).closePath();
  } else if (profile.id === "tomas") {
    face.moveTo(-w * 0.91, -h * 0.30)
      .bezierCurveTo(-w * 0.98, -h * 0.94, -w * 0.45, -h * 1.13, 0, -h * 1.04)
      .bezierCurveTo(w * 0.57, -h * 1.13, w * 0.94, -h * 0.72, w * 0.90, -h * 0.10)
      .lineTo(w * 0.70, h * 0.53).quadraticCurveTo(0, h * 1.10, -w * 0.70, h * 0.53).closePath();
  } else if (profile.id === "valentina") {
    face.moveTo(-w * 0.96, -h * 0.27)
      .bezierCurveTo(-w * 1.05, -h * 0.88, -w * 0.43, -h * 1.12, 0, -h * 1.02)
      .bezierCurveTo(w * 0.57, -h * 1.12, w * 1.03, -h * 0.78, w * 0.96, -h * 0.18)
      .lineTo(w * 0.74, h * 0.43).quadraticCurveTo(w * 0.44, h * 0.72, 0, h * 1.08)
      .quadraticCurveTo(-w * 0.43, h * 0.72, -w * 0.74, h * 0.43).closePath();
  } else {
    face.moveTo(-w * 0.98, -h * 0.25)
      .bezierCurveTo(-w * 1.05, -h * 0.87, -w * 0.50, -h * 1.08, 0, -h * 1.02)
      .bezierCurveTo(w * 0.64, -h * 1.08, w * 1.05, -h * 0.72, w * 0.98, -h * 0.15)
      .lineTo(w * 0.92, h * 0.38).quadraticCurveTo(w * 0.65, h * 0.99, 0, h * 0.98)
      .quadraticCurveTo(-w * 0.68, h * 0.99, -w * 0.92, h * 0.38).closePath();
  }
  face.fill(profile.skin).stroke({ color: INK, width: 4.5, join: "round" });
  head.addChild(face);

  shape(head, g => g.ellipse(-w * 0.97, -h * 0.12, 5.5, 9), profile.skin, 3);
  shape(head, g => g.ellipse(w * 0.97, -h * 0.12, 5.5, 9), profile.skin, 3);

  const eyes: Graphics[] = [];
  const pupils: Graphics[] = [];
  for (const side of [-1, 1]) {
    const eye = new Graphics().ellipse(side * w * 0.38, -h * 0.12, 6.2, 8.2).fill(WHITE)
      .stroke({ color: INK, width: 2.6 });
    const pupil = new Graphics().circle(side * w * 0.38 + 0.8, -h * 0.11, 3.2).fill(INK);
    head.addChild(eye, pupil);
    eyes.push(eye);
    pupils.push(pupil);
    line(head, g => {
      g.moveTo(side * w * 0.56 - 8, -h * 0.36)
        .quadraticCurveTo(side * w * 0.38, -h * 0.47, side * w * 0.56 + 5, -h * 0.34);
    }, profile.hair, profile.id === "ernesto" ? 4.2 : 3.6);
  }

  line(head, g => {
    g.moveTo(0, -h * 0.02).quadraticCurveTo(-3, h * 0.16, 2, h * 0.20);
  }, "#B77E68", 2.6);

  const mouth = new Graphics();
  head.addChild(mouth);

  if (profile.accessory === "glasses") {
    const glasses = new Graphics();
    glasses.roundRect(-w * 0.72, -h * 0.30, 24, 18, 5)
      .roundRect(w * 0.10, -h * 0.30, 24, 18, 5)
      .moveTo(-w * 0.02, -h * 0.22).lineTo(w * 0.11, -h * 0.22)
      .stroke({ color: "#635C55", width: 2.5 });
    head.addChild(glasses);
  }
  if (profile.accessory === "earring") {
    shape(head, g => g.circle(w * 0.99, h * 0.17, 3.4), "#DDAE54", 1.6);
  }
  if (profile.beard) {
    const beard = new Graphics();
    beard.moveTo(-w * 0.58, h * 0.35).bezierCurveTo(-w * 0.38, h * 1.05, w * 0.40, h * 1.07, w * 0.59, h * 0.34)
      .bezierCurveTo(w * 0.35, h * 0.58, -w * 0.32, h * 0.58, -w * 0.58, h * 0.35)
      .closePath().fill("#85847D").stroke({ color: INK, width: 2.5 });
    head.addChild(beard);
  }

  createHairFront(profile, head);
  return { mouth, eyes, pupils };
}

function createTorso(profile: CharacterProfile, root: Container) {
  const y = -282;
  const shoulder = profile.shoulders;
  const waist = profile.waist;
  const hips = profile.hips;
  const torso = new Container();
  torso.position.set(0, 0);
  root.addChild(torso);

  const body = new Graphics();
  if (profile.id === "martina") {
    // Neat tucked blouse: balanced shoulders, narrow waist, softly wider hips.
    body.moveTo(-shoulder, y + 18)
      .quadraticCurveTo(-shoulder - 3, y + 66, -waist, y + 126)
      .lineTo(-hips, y + 160).quadraticCurveTo(0, y + 171, hips, y + 160)
      .lineTo(waist, y + 126).quadraticCurveTo(shoulder + 3, y + 66, shoulder, y + 18)
      .quadraticCurveTo(0, y - 6, -shoulder, y + 18).closePath();
  } else if (profile.id === "bruno") {
    // Broad hoodie: boxier shoulders and chest, straight hem, compact waist.
    body.moveTo(-shoulder, y + 17)
      .quadraticCurveTo(-shoulder - 5, y + 69, -waist, y + 135)
      .lineTo(-hips, y + 162).quadraticCurveTo(0, y + 168, hips, y + 162)
      .lineTo(waist, y + 135).quadraticCurveTo(shoulder + 5, y + 69, shoulder, y + 17)
      .quadraticCurveTo(0, y - 14, -shoulder, y + 17).closePath();
  } else if (profile.id === "tomas") {
    // Long, slim overshirt with a straight lower silhouette.
    body.moveTo(-shoulder, y + 14)
      .quadraticCurveTo(-shoulder - 3, y + 62, -waist, y + 132)
      .lineTo(-hips, y + 174).lineTo(hips, y + 174).lineTo(waist, y + 132)
      .quadraticCurveTo(shoulder + 3, y + 62, shoulder, y + 14)
      .quadraticCurveTo(0, y - 8, -shoulder, y + 14).closePath();
  } else if (profile.id === "valentina") {
    // Fitted cropped jacket: distinct waist and long curved side seam.
    body.moveTo(-shoulder, y + 16)
      .quadraticCurveTo(-shoulder - 2, y + 56, -waist + 3, y + 112)
      .quadraticCurveTo(-waist - 6, y + 137, -hips, y + 160)
      .quadraticCurveTo(0, y + 174, hips, y + 160)
      .quadraticCurveTo(waist + 6, y + 137, waist - 3, y + 112)
      .quadraticCurveTo(shoulder + 2, y + 56, shoulder, y + 16)
      .quadraticCurveTo(0, y - 7, -shoulder, y + 16).closePath();
  } else {
    // Ernesto has a shorter, broad cardigan with a soft round belly.
    body.moveTo(-shoulder, y + 20)
      .quadraticCurveTo(-shoulder - 8, y + 82, -waist, y + 132)
      .quadraticCurveTo(-hips - 7, y + 159, -hips, y + 166)
      .quadraticCurveTo(0, y + 193, hips, y + 166)
      .quadraticCurveTo(hips + 7, y + 159, hips, y + 132)
      .quadraticCurveTo(shoulder + 8, y + 82, shoulder, y + 20)
      .quadraticCurveTo(0, y - 7, -shoulder, y + 20).closePath();
  }
  body.fill(profile.shirt).stroke({ color: INK, width: 5, join: "round" });
  torso.addChild(body);

  if (profile.id === "bruno") {
    shape(torso, g => {
      g.moveTo(-27, y + 19).quadraticCurveTo(-4, y + 48, 0, y + 40)
        .quadraticCurveTo(12, y + 48, 27, y + 19).lineTo(21, y + 3)
        .quadraticCurveTo(0, y + 32, -21, y + 3).closePath();
    }, "#CB5F52", 3);
    shape(torso, g => g.roundRect(-29, y + 105, 58, 28, 10), "#D65F53", 3);
    line(torso, g => { g.moveTo(-9, y + 35).lineTo(-3, y + 58); g.moveTo(9, y + 35).lineTo(3, y + 58); }, "#F3D5C7", 2);
  } else if (profile.id === "martina") {
    shape(torso, g => g.roundRect(-hips + 5, y + 143, (hips - 5) * 2, 12, 4), "#B98C2F", 2.5);
    shape(torso, g => {
      g.moveTo(-18, y + 18).lineTo(-7, y + 31).lineTo(0, y + 22).lineTo(7, y + 31).lineTo(18, y + 18).lineTo(12, y + 4).lineTo(-12, y + 4).closePath();
    }, "#F4E6CF", 2.5);
    shape(torso, g => g.circle(0, y + 76, 2.8), "#F4E6CF", 1);
  } else if (profile.id === "tomas") {
    shape(torso, g => {
      g.moveTo(-16, y + 19).lineTo(-4, y + 43).lineTo(0, y + 32).lineTo(5, y + 43).lineTo(17, y + 19).lineTo(11, y + 7).lineTo(-11, y + 7).closePath();
    }, "#F0E4D2", 2.5);
    line(torso, g => { g.moveTo(0, y + 44).lineTo(0, y + 156); }, "#416F50", 3);
    shape(torso, g => g.roundRect(20, y + 58, 20, 26, 3), "#609057", 2);
    line(torso, g => { g.moveTo(23, y + 69).lineTo(36, y + 69); }, "#DDE7CE", 1.7);
  } else if (profile.id === "valentina") {
    shape(torso, g => {
      g.moveTo(-17, y + 19).lineTo(-7, y + 35).lineTo(0, y + 28).lineTo(7, y + 35).lineTo(17, y + 19).lineTo(11, y + 4).lineTo(-11, y + 4).closePath();
    }, "#E98A72", 2.5);
    line(torso, g => { g.moveTo(0, y + 47).lineTo(0, y + 119); }, "#D4E5E0", 2.4);
  } else {
    shape(torso, g => {
      g.moveTo(-22, y + 20).lineTo(-8, y + 43).lineTo(0, y + 34).lineTo(8, y + 43).lineTo(22, y + 20).lineTo(14, y + 5).lineTo(-14, y + 5).closePath();
    }, "#F0E4D2", 3);
    line(torso, g => { g.moveTo(0, y + 47).lineTo(0, y + 153); }, "#E8D7C5", 2.5);
    for (let i = 0; i < 3; i += 1) shape(torso, g => g.circle(0, y + 71 + i * 22, 2.7), "#F0E4D2", 1);
    shape(torso, g => g.roundRect(25, y + 62, 20, 24, 3), "#A45C45", 2);
  }
  return torso;
}

interface LegPair { left: Container; right: Container }
interface ArmPair { upper: Container; forearm: Container }

function createLegs(profile: CharacterProfile, root: Container): LegPair {
  const group = new Container();
  root.addChild(group);
  const gap = profile.body === "lanky" ? 22 : profile.body === "stocky" ? 25 : 20;
  const legWidth = profile.body === "stocky" ? 28 : profile.body === "athletic" ? 26 : 24;
  const legs: Container[] = [];

  for (const side of [-1, 1]) {
    const x = side * gap;
    const leg = new Container();
    leg.position.set(x, -132);
    group.addChild(leg);
    const trouser = new Graphics();
    trouser.moveTo(-legWidth * 0.56, 0)
      .lineTo(legWidth * 0.55, 0)
      .bezierCurveTo(legWidth * 0.70, 44, legWidth * 0.64, 94, legWidth * 0.66, 125)
      .lineTo(-legWidth * 0.62, 125)
      .bezierCurveTo(-legWidth * 0.70, 82, -legWidth * 0.66, 39, -legWidth * 0.56, 0)
      .closePath().fill(profile.pants).stroke({ color: INK, width: 4, join: "round" });
    leg.addChild(trouser);
    line(leg, g => { g.moveTo(0, 12).lineTo(side * 1.5, 93); }, "#FFFFFF", 1.05);
    if (profile.id === "valentina") {
      shape(leg, g => g.roundRect(-19, 107, 39, 13, 6), "#262F37", 3);
      shape(leg, g => g.roundRect(-24, 115, 49, 17, 8), "#2E3840", 3);
      line(leg, g => { g.moveTo(-13, 123).lineTo(13, 123); }, "#B9C6C6", 1.6);
    } else if (profile.id === "ernesto") {
      shape(leg, g => g.roundRect(-22, 108, 44, 18, 8), "#4B4946", 3);
      shape(leg, g => g.roundRect(-27, 116, 50, 15, 7), "#5A554E", 3);
    } else {
      shape(leg, g => g.roundRect(-22, 108, 43, 18, 8), WHITE, 3);
      shape(leg, g => g.roundRect(-26, 116, 49, 15, 7), "#E9E0D4", 3);
    }
    legs.push(leg);
  }
  return { left: legs[0], right: legs[1] };
}

function createArm(profile: CharacterProfile, side: -1 | 1, root: Container): ArmPair {
  const upper = new Container();
  upper.position.set(side * profile.shoulders * 0.82, -260);
  root.addChild(upper);
  line(upper, g => {
    g.moveTo(0, 0).bezierCurveTo(side * 14, 16, side * 18, 43, side * 15, 63);
  }, profile.shirt, profile.id === "ernesto" ? 25 : 22);

  const forearm = new Container();
  forearm.position.set(side * 15, 61);
  upper.addChild(forearm);
  line(forearm, g => {
    g.moveTo(0, 0).bezierCurveTo(side * 4, 14, side * 6, 28, side * 5, 42);
  }, profile.skin, 13);
  shape(forearm, g => g.ellipse(side * 5, 47, 8.2, 10), profile.skin, 2.6);
  if (profile.id === "tomas" && side === 1) {
    shape(upper, g => g.roundRect(side * 8, 34, 18, 22, 4), "#5E8759", 2);
  }
  return { upper, forearm };
}

export interface CharacterRig {
  id: CharacterId;
  root: Container;
  head: Container;
  torso: Container;
  leftArm: Container;
  rightArm: Container;
  leftForearm: Container;
  rightForearm: Container;
  leftLeg: Container;
  rightLeg: Container;
  mouth: Graphics;
  eyes: Graphics[];
  pupils: Graphics[];
  baseX: number;
  baseY: number;
  scale: number;
  phase: number;
}

export function createCharacter(id: CharacterId, x: number, baselineY: number, scale = 0.82): CharacterRig {
  const profile = PROFILES[id];
  const root = new Container();
  root.position.set(x, baselineY);
  root.scale.set(scale * profile.height, scale * profile.height);

  shape(root, g => g.ellipse(0, -2, 49, 8), "#5A493E", 0).alpha = 0.13;

  const legs = createLegs(profile, root);
  const leftArm = createArm(profile, -1, root);
  const rightArm = createArm(profile, 1, root);

  shape(root, g => g.roundRect(-12, -304, 24, 27, 7), profile.skin, 3);
  const torso = createTorso(profile, root);
  const head = new Container();
  head.position.set(0, -337);
  root.addChild(head);

  createHairBack(profile, head);
  const faceParts = createFace(profile, head);

  if (profile.id === "ernesto") {
    line(head, g => { g.moveTo(-21, 33).quadraticCurveTo(0, 49, 21, 33); }, "#77736B", 3.5);
  }
  if (profile.id === "tomas") {
    shape(head, g => g.circle(-37, 4, 4), profile.hair, 1.5);
    shape(head, g => g.circle(37, 10, 3.5), profile.hair, 1.5);
  }

  const rig: CharacterRig = {
    id, root, head, torso,
    leftArm: leftArm.upper, rightArm: rightArm.upper,
    leftForearm: leftArm.forearm, rightForearm: rightArm.forearm,
    leftLeg: legs.left, rightLeg: legs.right,
    mouth: faceParts.mouth, eyes: faceParts.eyes, pupils: faceParts.pupils,
    baseX: x, baseY: baselineY, scale, phase: Object.keys(PROFILES).indexOf(id) * 0.71
  };
  updateCharacter(rig, 0, [], []);
  return rig;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isBlinking(time: number, phase: number) {
  const cycle = (time + phase * 1.9) % 4.3;
  return cycle > 0.11 && cycle < 0.20;
}

export function updateCharacter(
  rig: CharacterRig,
  time: number,
  cues: DialogueCue[],
  placements: Array<{
    id: CharacterId;
    x: number;
    entrance?: { startSeconds: number; fromX: number; durationSeconds: number };
  }>,
  forceCamera = false
) {
  const cue = cues.find(item => item.speaker === rig.id && time >= item.startSeconds && time <= item.endSeconds);
  const activeSpeaker = cues.find(item => time >= item.startSeconds && time <= item.endSeconds);
  const lookTarget = forceCamera ? "camera" : (cue?.lookAt || (activeSpeaker && activeSpeaker.speaker !== rig.id ? activeSpeaker.speaker : null));
  let headTurn = 0;
  if (lookTarget === "camera") {
    headTurn = 0;
  } else if (lookTarget) {
    const target = placements.find(item => item.id === lookTarget);
    if (target) headTurn = clamp((target.x - rig.baseX) / 440, -0.19, 0.19);
  }

  const placement = placements.find(item => item.id === rig.id);
  let walking = 0;
  let walkProgress = 1;
  let positionX = rig.baseX;
  if (placement?.entrance) {
    const entrance = placement.entrance;
    walkProgress = clamp((time - entrance.startSeconds) / Math.max(0.01, entrance.durationSeconds), 0, 1);
    const eased = walkProgress * walkProgress * (3 - 2 * walkProgress);
    positionX = entrance.fromX + (rig.baseX - entrance.fromX) * eased;
    walking = time >= entrance.startSeconds && walkProgress < 1 ? 1 : 0;
    if (time < entrance.startSeconds) positionX = entrance.fromX;
  }

  // The baseline never moves vertically: body weight shifts through the hips, not through floating.
  rig.root.x = positionX;
  rig.root.y = rig.baseY;
  const walkCycle = (time - (placement?.entrance?.startSeconds ?? 0)) * 8.2 + rig.phase;
  rig.leftLeg.rotation = walking ? Math.sin(walkCycle) * 0.105 : 0;
  rig.rightLeg.rotation = walking ? -Math.sin(walkCycle) * 0.105 : 0;

  const progress = cue ? clamp((time - cue.startSeconds) / Math.max(0.01, cue.endSeconds - cue.startSeconds), 0, 1) : 0;
  const gesturePulse = cue ? Math.sin(progress * Math.PI) : 0;
  const lean = cue ? 0.012 * gesturePulse : 0;
  rig.torso.rotation = lean + 0.002 * Math.sin(time * 0.55 + rig.phase);
  rig.torso.scale.y = 1;
  rig.head.rotation = headTurn + (cue ? Math.sin(progress * Math.PI * 2) * 0.012 : Math.sin(time * 0.9 + rig.phase) * 0.006);

  const gesture: Gesture = cue?.gesture || "none";
  const walkSwing = walking ? Math.sin(walkCycle) * 0.075 : 0;
  const openHand = gesture === "open-hand" ? 0.075 * gesturePulse : 0;
  const point = gesture === "point" ? 0.11 * gesturePulse : 0;
  const shrug = gesture === "shrug" ? 0.10 * gesturePulse : 0;
  rig.leftArm.rotation = walkSwing + shrug + (gesture === "open-hand" ? 0.035 * gesturePulse : 0);
  rig.rightArm.rotation = -walkSwing - point - shrug - openHand;
  rig.leftForearm.rotation = walking ? -0.10 * Math.sin(walkCycle) : (gesture === "shrug" ? -0.10 * gesturePulse : 0.012 * Math.sin(time * .65 + rig.phase));
  rig.rightForearm.rotation = walking ? 0.10 * Math.sin(walkCycle) : (gesture === "open-hand" ? -0.12 * gesturePulse : gesture === "point" ? 0.07 * gesturePulse : 0.012 * Math.sin(time * .6 + rig.phase));

  const blink = isBlinking(time, rig.phase);
  for (const eye of rig.eyes) eye.scale.y = blink ? 0.12 : 1;
  const pupilOffset = headTurn * 13;
  rig.pupils[0].x = -13 + pupilOffset;
  rig.pupils[1].x = 13 + pupilOffset;

  rig.mouth.clear();
  if (cue && Math.sin((time - cue.startSeconds) * 16.4) > 0.03) {
    rig.mouth.ellipse(0, 31, 7.5, 5.8).fill("#723F42").stroke({ color: "#8A4E4B", width: 1.8 });
  } else {
    const smile = cue?.expression === "smile" || (!cue && rig.id !== "martina" && rig.id !== "ernesto");
    rig.mouth.moveTo(-8, 31).quadraticCurveTo(0, smile ? 37 : 35, 8, 31)
      .stroke({ color: "#8A4E4B", width: 2.7, cap: "round" });
  }
}
