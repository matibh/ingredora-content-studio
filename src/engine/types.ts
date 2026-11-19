export type Vec3 = [number, number, number];

export type SceneObject = {
  id: string;
  shape: "box" | "sphere" | "cylinder" | "torus" | "cone";
  color: string;
  position: Vec3;
  scale: Vec3;
  rotation?: Vec3;
  animation?: {
    type: "float-rotate" | "rotate" | "pulse";
    speed?: number;
    amount?: number;
    phase?: number;
  };
};

export type ProductionScene = {
  id: string;
  startFrame: number;
  durationFrames: number;
  background: string;
  camera?: { position?: Vec3; target?: Vec3; fov?: number };
  objects: SceneObject[];
  headline?: string;
  subline?: string;
  accentColor?: string;
};

export type ProductionPackage = {
  schemaVersion: 1;
  engineVersion: "1.0.0";
  id: string;
  title: string;
  description: string;
  createdAt: string;
  fps: number;
  width: number;
  height: number;
  scenes: ProductionScene[];
  visualPreset?: "nutella-supermarket";
  /** Public, pre-generated narration asset; never store provider credentials in the client. */
  voiceoverUrl?: string;
  voiceoverOffsetSeconds?: number;
};
