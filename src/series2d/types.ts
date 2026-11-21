export type CharacterId = "martina" | "bruno" | "tomas" | "valentina" | "ernesto";
export type Gesture = "open-hand" | "shrug" | "point" | "none";
export type Expression = "neutral" | "smile" | "skeptical" | "surprised";

export interface CharacterPlacement {
  id: CharacterId;
  x: number;
  baselineY: number;
  scale: number;
}

export interface DialogueCue {
  id: string;
  speaker: CharacterId;
  text: string;
  startSeconds: number;
  endSeconds: number;
  lookAt: CharacterId | "camera";
  gesture?: Gesture;
  expression?: Expression;
}

export interface SitcomProductionPackage {
  schemaVersion: 1;
  engineVersion: "pixi-2d-1.0.0";
  id: string;
  title: string;
  description: string;
  createdAt: string;
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
  background: "apartment-living-room";
  characters: CharacterPlacement[];
  dialogue: DialogueCue[];
  voiceTrackUrl: string;
  wordTimingsUrl?: string;
  voiceStems?: Partial<Record<CharacterId, string>>;
}
