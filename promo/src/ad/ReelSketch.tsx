import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

import { Clip } from "../Clip";
import { Phone } from "../Phone";
import { Shears, snip } from "../Shears";
import { clamp, color, font } from "../theme";

/*
 * Animatic ("3D sketch") of the founder reel, 33 s, 9:16. A clay figure in a simple
 * room acts out the scenario; camera moves match the planned Higgsfield shots; the
 * Remotion overlays (bubbles, floating phone, glass shatter, captions) sit where they will.
 * It shows the idea to people before filming; it is not the final look.
 */
const S = { hook: 0, problem: 120, solution: 330, why: 600, close: 840 };
export const REEL_SKETCH_FRAMES = 990;
const io = Easing.bezier(0.65, 0, 0.35, 1);
const r = (f: number, a: number, b: number, from = 0, to = 1, e = io) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: e });

// ---------------------------------------------------------------------------
// 3D
// ---------------------------------------------------------------------------

const skin = "#C9A98E";
const dark = "#2B2724";

const Limb: React.FC<{ len: number; rad: number; col: string; children?: React.ReactNode }> = ({ len, rad, col, children }) => (
  <group>
    <mesh position={[0, -len / 2, 0]} castShadow>
      <capsuleGeometry args={[rad, len - rad * 2, 6, 12]} />
      <meshStandardMaterial color={col} roughness={0.85} />
    </mesh>
    <group position={[0, -len, 0]}>{children}</group>
  </group>
);

/** The founder: sits, stands, steps, turns, raises a hand, scrolls the air, snaps. */
const Person: React.FC<{ f: number }> = ({ f }) => {
  const stand = r(f, S.problem, S.problem + 26);
  const step = r(f, S.problem + 26, S.problem + 70);
  const back = r(f, S.close, S.close + 40);
  const x = step * 0.9 * (1 - back);
  const hipY = interpolate(stand * (1 - back * 0), [0, 1], [0.52, 0.95]);
  // Faces the front camera, turns to the left camera in scene 3, back to the front after.
  const turn = r(f, S.solution, S.solution + 18) * (1 - r(f, S.why, S.why + 14));
  const rotY = -turn * 0.85;
  const z = interpolate(stand, [0, 1], [-0.62, -0.35]);

  // Right arm: raise (scene 3), scroll in the air, snap (scene 4), rest on the laptop (scene 5).
  const raise3 = r(f, S.solution + 30, S.solution + 50) * (1 - r(f, S.solution + 230, S.solution + 250));
  const scrollEnv = r(f, S.solution + 60, S.solution + 80) * (1 - r(f, S.solution + 185, S.solution + 205));
  const scroll = Math.sin((f - S.solution) / 9) * 0.22 * scrollEnv;
  const point4 = r(f, S.why + 4, S.why + 20) * (1 - r(f, S.why + 110, S.why + 122));
  const snap4 = r(f, S.why + 118, S.why + 130) * (1 - r(f, S.why + 160, S.why + 180));
  const hook = r(f, 60, 80) * (1 - r(f, 100, 120)); // closes the laptop lid
  const rest5 = r(f, S.close + 30, S.close + 55);
  const seatedArm = 1 - stand;

  const rArmX = -(raise3 * 1.3 + point4 * 0.2 + snap4 * 1.5 + hook * 1.0 + seatedArm * 0.9 + rest5 * 0.7) + scroll * 0.3;
  const rArmZ = -0.12 - point4 * 1.2;
  const rFore = -(raise3 * 1.1 + snap4 * 1.0 + seatedArm * 0.6 + rest5 * 0.4) + scroll;
  const lArmX = -(seatedArm * 0.9) - Math.max(0, Math.sin((f - S.problem - 80) / 14)) * 0.5 * r(f, S.problem + 80, S.problem + 100) * (1 - r(f, S.solution - 20, S.solution));
  const nod = Math.sin(f / 13) * 0.035 * stand;
  const breathe = Math.sin(f / 22) * 0.012;
  const sway = Math.sin(f / 31) * 0.035 * stand;
  const walking = Math.max(r(f, S.problem + 26, S.problem + 36) * (1 - r(f, S.problem + 60, S.problem + 72)), r(f, S.close, S.close + 8) * (1 - r(f, S.close + 32, S.close + 42)));
  const stride = Math.sin(f / 4) * 0.45 * walking;
  const lookDown = 0.25 * r(f, 10, 24) * (1 - r(f, 44, 62));
  const legBend = 1 - stand;

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <group position={[0, hipY + breathe * 0.5 + Math.abs(stride) * 0.03, 0]} rotation={[0, 0, sway * 0.4]}>
        {/* torso */}
        <mesh position={[0, 0.32, 0]} scale={[1 + breathe, 1, 1 + breathe]} castShadow>
          <capsuleGeometry args={[0.17, 0.36, 6, 16]} />
          <meshStandardMaterial color={dark} roughness={0.8} />
        </mesh>
        {/* head */}
        <group position={[0, 0.78, 0]} rotation={[lookDown + nod, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.13, 24, 16]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          {[-0.045, 0.045].map((ex) => (
            <mesh key={ex} position={[ex, 0.01, 0.12]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshStandardMaterial color="#1E1A17" />
            </mesh>
          ))}
          <mesh position={[0, -0.03, 0.13]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#B8957A" />
          </mesh>
          <mesh position={[0, 0.06, -0.03]}>
            <sphereGeometry args={[0.135, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
            <meshStandardMaterial color="#1E1A17" roughness={0.9} />
          </mesh>
        </group>
        {/* arms */}
        <group position={[0.22, 0.56, 0]} rotation={[rArmX, 0, rArmZ]}>
          <Limb len={0.3} rad={0.05} col={dark}>
            <group rotation={[rFore, 0, 0]}>
              <Limb len={0.28} rad={0.045} col={skin} />
            </group>
          </Limb>
        </group>
        <group position={[-0.22, 0.56, 0]} rotation={[lArmX + stride * 0.6, 0, 0.12]}>
          <Limb len={0.3} rad={0.05} col={dark}>
            <group rotation={[-(seatedArm * 0.6), 0, 0]}>
              <Limb len={0.28} rad={0.045} col={skin} />
            </group>
          </Limb>
        </group>
        {/* legs */}
        {[0.09, -0.09].map((lx) => (
          <group key={lx} position={[lx, 0, 0]} rotation={[-legBend * 1.5 + (lx > 0 ? stride : -stride), 0, 0]}>
            <Limb len={0.45} rad={0.06} col="#3A3631">
              <group rotation={[legBend * 1.5, 0, 0]}>
                <Limb len={0.46} rad={0.055} col="#3A3631" />
              </group>
            </Limb>
          </group>
        ))}
      </group>
    </group>
  );
};

const Room: React.FC<{ f: number }> = ({ f }) => {
  const lid = 1 - r(f, 62, 90) * 0.55 * (1 - r(f, S.problem, S.problem + 20));
  const buzz = (f > 6 && f < 18) || (f > 32 && f < 46) ? Math.sin(f * 3) * 0.006 : 0;
  const warm = r(f, S.close, S.close + 60);
  const towers = useMemo(() => [-0.9, -0.35, 0.25], []);
  return (
    <group>
      {/* floor and back wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#CFC6B8" roughness={1} />
      </mesh>
      <mesh position={[0, 2, -2.4]} receiveShadow>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#E9E2D6" roughness={1} />
      </mesh>
      {/* window with a sketch of Baku */}
      <mesh position={[0.2, 1.75, -2.38]}>
        <planeGeometry args={[2.6, 1.7]} />
        <meshBasicMaterial color={new THREE.Color("#F2C99A").lerp(new THREE.Color("#FFD9A8"), warm)} />
      </mesh>
      {towers.map((tx, i) => (
        <mesh key={tx} position={[tx + 0.2, 1.25 + i * 0.08, -2.36]}>
          <coneGeometry args={[0.16, 0.9 + i * 0.12, 3, 1]} />
          <meshBasicMaterial color="#B98563" />
        </mesh>
      ))}
      <mesh position={[0.2, 1.75, -2.35]}>
        <boxGeometry args={[2.7, 0.04, 0.03]} />
        <meshStandardMaterial color="#6B6157" />
      </mesh>
      {/* desk */}
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.05, 0.75]} />
        <meshStandardMaterial color="#8A6A4E" roughness={0.6} />
      </mesh>
      {[-0.68, 0.68].map((lx) => (
        <mesh key={lx} position={[lx, 0.37, 0]} castShadow>
          <boxGeometry args={[0.05, 0.74, 0.7]} />
          <meshStandardMaterial color="#6F543D" />
        </mesh>
      ))}
      {/* laptop: base + lid, back of the lid to the camera */}
      <group position={[0, 0.775, -0.05]}>
        <mesh>
          <boxGeometry args={[0.42, 0.015, 0.3]} />
          <meshStandardMaterial color="#B8BCC2" metalness={0.6} roughness={0.35} />
        </mesh>
        <group position={[0, 0, -0.15]} rotation={[-Math.PI * 0.42 * lid + 0.05, 0, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.42, 0.3, 0.012]} />
            <meshStandardMaterial color="#C3C7CD" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>
      {/* phone on the desk, buzzing */}
      <mesh position={[0.45 + buzz, 0.77, 0.18]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <boxGeometry args={[0.08, 0.16, 0.01]} />
        <meshStandardMaterial color="#141210" emissive={buzz ? "#5BD38A" : "#000000"} emissiveIntensity={0.4} />
      </mesh>
      {/* chair */}
      <group position={[0, 0, -0.62]}>
        <mesh position={[0, 0.46, 0]} castShadow>
          <boxGeometry args={[0.46, 0.06, 0.44]} />
          <meshStandardMaterial color={color.nar} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.8, -0.2]} castShadow>
          <boxGeometry args={[0.46, 0.6, 0.06]} />
          <meshStandardMaterial color={color.nar} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.44]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      </group>
      {/* a plant for scale */}
      <group position={[-1.6, 0, -1.6]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.4]} />
          <meshStandardMaterial color="#B5A48E" />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.38, 16, 12]} />
          <meshStandardMaterial color="#6F8A5C" roughness={1} />
        </mesh>
      </group>
    </group>
  );
};

/** Camera per scene: front push-in, dolly left + zoom out, left side angle, closer front, medium. */
function cameraAt(f: number): { pos: THREE.Vector3; look: THREE.Vector3 } {
  const keys: [number, [number, number, number], [number, number, number]][] = [
    [0, [0, 1.25, 2.5], [0, 1.15, -0.6]],
    [S.problem - 1, [0, 1.2, 1.9], [0, 1.15, -0.6]],
    [S.problem, [0, 1.2, 1.9], [0, 1.15, -0.6]],
    [S.problem + 40, [0, 1.2, 1.9], [0.2, 1.2, -0.5]],
    [S.problem + 110, [-1.5, 1.35, 3.8], [0.5, 1.0, -0.5]],
    [S.solution - 1, [-1.6, 1.35, 3.9], [0.5, 1.0, -0.5]],
    [S.solution, [-2.3, 1.4, 0.9], [0.8, 1.3, -0.4]],
    [S.why - 1, [-2.1, 1.4, 1.0], [0.8, 1.3, -0.4]],
    [S.why, [0.15, 1.35, 1.9], [0.15, 1.3, -0.4]],
    [S.close - 1, [0.1, 1.35, 1.75], [0.15, 1.3, -0.4]],
    [S.close, [0, 1.3, 2.7], [0, 1.15, -0.4]],
    [REEL_SKETCH_FRAMES, [0, 1.3, 2.4], [0, 1.15, -0.4]],
  ];
  let i = 0;
  while (i < keys.length - 2 && f > keys[i + 1][0]) i++;
  const [f0, p0, l0] = keys[i];
  const [f1, p1, l1] = keys[i + 1];
  const t = f1 - f0 <= 1 ? 1 : io(Math.min(1, Math.max(0, (f - f0) / (f1 - f0))));
  return {
    pos: new THREE.Vector3(...p0).lerp(new THREE.Vector3(...p1), t),
    look: new THREE.Vector3(...l0).lerp(new THREE.Vector3(...l1), t),
  };
}

const Rig: React.FC<{ f: number }> = ({ f }) => {
  const { pos, look } = cameraAt(f);
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const size = useThree((st) => st.size);
  camera.position.copy(pos);
  camera.fov = 50;
  camera.aspect = size.width / size.height;
  camera.lookAt(look);
  camera.updateProjectionMatrix();
  return null;
};

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

const SCENES = [
  { at: S.hook, title: "1 · Diqqət (Hook)", note: "Ön kamera · Higgsfield: Bakı ofisi fonu" },
  { at: S.problem, title: "2 · Problem", note: "Higgsfield: kamera sola gedir və uzaqlaşır" },
  { at: S.solution, title: "3 · Həll", note: "Sol kamera, 45° · virtual telefon (Remotion)" },
  { at: S.why, title: "4 · Niyə biz", note: "Ön kamera, yaxın · şüşə effekti (Remotion)" },
  { at: S.close, title: "5 · Final", note: "Ön kamera · loqo (Remotion)" },
];

const LINES: [number, number, string][] = [
  [75, 118, "Bərbərlər gündə neçə zəngə cavab verir?"],
  [150, 200, "Usta müştərinin saçını kəsir..."],
  [200, 240, "...telefon isə susmur."],
  [240, 326, "Cavab gecikir — müştəri başqa salona gedir."],
  [335, 380, "Biz bunu həll etdik."],
  [405, 480, "Müştəri boş vaxtları özü görür..."],
  [480, 540, "...və bir toxunuşla yazılır."],
  [540, 598, "Usta isə zəngə yox, işinə baxır."],
  [605, 668, "Başqa proqramlar var, bəli..."],
  [668, 735, "...amma hər yeni usta üçün əlavə pul alırlar."],
  [770, 838, "Bizdə qiymət sabitdir. Komandanız böyüyür, qiymətiniz yox."],
  [845, 900, "yazılnow — tezliklə App Store və Google Play-də."],
  [900, 935, "Save your time with us."],
];

const Subtitles: React.FC<{ f: number }> = ({ f }) => {
  const line = LINES.find(([a, b]) => f >= a && f < b);
  if (!line) return null;
  const o = r(f, line[0], line[0] + 6) * (1 - r(f, line[1] - 5, line[1]));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom: 250, textAlign: "center", opacity: o }}>
      <span style={{ fontFamily: font, fontWeight: 700, fontSize: 54, lineHeight: 1.25, color: "#fff", background: "rgba(20,18,16,0.72)", padding: "8px 18px", borderRadius: 14, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
        {line[2]}
      </span>
    </div>
  );
};

const SceneTag: React.FC<{ f: number }> = ({ f }) => {
  const s = [...SCENES].reverse().find((x) => f >= x.at)!;
  if (f > S.close + 60) return null;
  return (
    <div style={{ position: "absolute", top: 70, left: 50, fontFamily: font }}>
      <div style={{ display: "inline-block", background: color.nar, color: "#fff", fontWeight: 700, fontSize: 30, padding: "8px 18px", borderRadius: 999 }}>{s.title}</div>
      <div style={{ marginTop: 10, fontSize: 26, fontWeight: 500, color: "#3A352F", background: "rgba(243,239,232,0.85)", padding: "6px 14px", borderRadius: 10, display: "inline-block" }}>{s.note}</div>
      <div style={{ position: "absolute", top: 0, left: 930, fontSize: 24, fontWeight: 600, color: "#3A352F", whiteSpace: "nowrap" }}>{(f / 30).toFixed(1)} s</div>
    </div>
  );
};

const Bubble: React.FC<{ f: number; at: number; x: number; y: number; text: string; call?: boolean }> = ({ f, at, x, y, text, call }) => {
  const p = r(f, at, at + 8, 0, 1, Easing.bezier(0.23, 1, 0.32, 1));
  const blur = r(f, 62, 80);
  if (f < at || f > S.problem + 10) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${0.6 + p * 0.4})`, opacity: p * (1 - r(f, S.problem - 4, S.problem + 8)), filter: `blur(${blur * 3}px)`, fontFamily: font, fontSize: 30, fontWeight: 600, background: call ? "#fff" : "#DCF8C6", color: call ? color.nar : "#141210", padding: "14px 20px", borderRadius: 22, boxShadow: "0 6px 20px rgba(0,0,0,0.18)", maxWidth: 520 }}>
      {text}
    </div>
  );
};

const Counter: React.FC<{ f: number }> = ({ f }) => {
  if (f < 20 || f > S.solution - 8) return null;
  const calls = Math.round(interpolate(f, [20, 70, S.problem + 80, S.problem + 95], [1, 12, 12, 18], clamp));
  const msgs = Math.round(interpolate(f, [20, 70], [3, 37], clamp));
  return (
    <div style={{ position: "absolute", right: 50, top: 230, fontFamily: font, fontWeight: 700, fontSize: 40, background: "rgba(255,255,255,0.9)", padding: "12px 22px", borderRadius: 18, color: "#141210" }}>
      📞 {calls} · 💬 {msgs}
    </div>
  );
};

const ProblemBits: React.FC<{ f: number }> = ({ f }) => {
  const inset = r(f, S.problem + 30, S.problem + 42) * (1 - r(f, S.solution - 20, S.solution - 6));
  const shake = f > S.problem + 80 && f < S.problem + 92 ? Math.sin(f * 2.5) * 6 : 0;
  const cap = r(f, S.problem + 125, S.problem + 137) * (1 - r(f, S.solution - 18, S.solution - 4));
  const walk = r(f, S.problem + 120, S.problem + 185, 0, 1, Easing.linear);
  return (
    <>
      <div style={{ position: "absolute", left: 50, top: 330, width: 330, height: 220, borderRadius: 20, background: "#2B2724", opacity: inset, transform: `translateX(${shake}px)`, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, color: "#F3EFE8", fontSize: 26, fontWeight: 600, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 70 }}>✂️💈</div>[bərbər video kadrı]
          </div>
        </div>
      </div>
      {walk > 0 && walk < 1 ? (
        <div style={{ position: "absolute", top: 1120, left: 640 + walk * 520, fontSize: 110 }}>🚶</div>
      ) : null}
      <div style={{ position: "absolute", left: 60, right: 60, top: 600, textAlign: "center", opacity: cap }}>
        <span style={{ fontFamily: font, fontWeight: 800, fontSize: 50, color: "#fff", background: color.nar, padding: "10px 22px", borderRadius: 16 }}>Hər gecikmiş cavab = itirilmiş müştəri</span>
      </div>
    </>
  );
};

/** Scene 3: a phone rises out of the palm, plays the real app, the booking flies to a calendar. */
const FloatingPhone: React.FC<{ f: number }> = ({ f }) => {
  const a = S.solution + 35;
  const show = r(f, a, a + 22, 0, 1, Easing.bezier(0.23, 1, 0.32, 1)) * (1 - r(f, S.solution + 235, S.solution + 255));
  if (show <= 0) return null;
  const t = f / 30;
  const card = r(f, S.solution + 200, S.solution + 225);
  return (
    <>
      <div style={{ position: "absolute", left: 300, top: 470 + (1 - show) * 380, width: 480, opacity: show, transform: `scale(${0.3 + show * 0.7}) rotateY(${Math.sin(t) * 6}deg) rotateZ(${Math.sin(t * 0.8) * 2}deg)`, transformOrigin: "50% 100%", filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.35))" }}>
        <Phone width={480}>
          <Sequence from={a} durationInFrames={50} layout="none">
            <Clip name="trial" from={20} playbackRate={2.4} />
          </Sequence>
          <Sequence from={a + 50} durationInFrames={70} layout="none">
            <Clip name="find2" from={0} playbackRate={1.7} />
          </Sequence>
          <Sequence from={a + 120} durationInFrames={110} layout="none">
            <Clip name="book2" from={20} playbackRate={1.5} />
          </Sequence>
        </Phone>
      </div>
      {card > 0 ? (
        <div style={{ position: "absolute", left: interpolate(card, [0, 1], [440, 700]), top: interpolate(card, [0, 1], [800, 420]), fontFamily: font, fontWeight: 700, fontSize: 30, background: "#fff", color: "#2E7D4F", padding: "14px 20px", borderRadius: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", opacity: Math.min(1, card * 3) * show }}>
          ✓ Yeni növbə: 15:30, Skin fade
        </div>
      ) : null}
    </>
  );
};

const RIVALS: [string, number][] = [["Altegio", 115], ["Arnica", 88], ["Rezneed", 69], ["DIKIDI", 32]];
const SNAP = S.why + 125;

/** Scene 4: glass cards with rival prices, a snap, they shatter, yazılnow 29 ₼ remains. */
const Shatter: React.FC<{ f: number }> = ({ f }) => {
  const shards = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({ dx: Math.cos(i * 2.39) * (240 + (i % 7) * 50), dy: -120 + Math.sin(i * 1.7) * 260, rot: (i % 2 ? 1 : -1) * (60 + (i * 37) % 180), size: 30 + (i * 13) % 50, card: i % 4 })),
    [],
  );
  if (f < S.why || f > S.close + 10) return null;
  const broken = f >= SNAP;
  const k = broken ? (f - SNAP) / 30 : 0;
  const win = r(f, SNAP + 20, SNAP + 36, 0, 1, Easing.bezier(0.23, 1, 0.32, 1));
  const out = r(f, S.close - 10, S.close + 6);
  return (
    <div style={{ position: "absolute", left: 70, top: 440, width: 560, fontFamily: font, opacity: 1 - out }}>
      {!broken ? (
        <>
          <div style={{ fontSize: 26, color: "#3A352F", fontWeight: 600, marginBottom: 12 }}>10 ustalı salon, aylıq</div>
          {RIVALS.map(([n, p], i) => {
            const s = r(f, S.why + 8 + i * 8, S.why + 20 + i * 8, 0, 1, Easing.bezier(0.23, 1, 0.32, 1));
            const grow = r(f, S.why + 70, S.why + 110);
            return (
              <div key={n} style={{ marginBottom: 16, padding: "20px 26px", height: 96 + grow * 18, borderRadius: 20, background: "rgba(255,255,255,0.42)", border: "2px solid rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", opacity: s, transform: `translateX(${(1 - s) * -200}px)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: "#141210" }}>{n}</span>
                <span style={{ fontSize: 44, fontWeight: 800, color: "#141210" }}>
                  ≈{Math.round(p * (1 + grow * 0.12))} ₼ {grow > 0.05 ? <span style={{ fontSize: 26, color: color.nar }}>↑ + usta</span> : null}
                </span>
              </div>
            );
          })}
        </>
      ) : (
        <>
          {shards.map((s, i) => (
            <div key={i} style={{ position: "absolute", left: 230 + (i % 6) * 40, top: 60 + s.card * 112, width: s.size, height: s.size * 0.8, background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(255,255,255,0.95)", clipPath: "polygon(50% 0, 100% 70%, 20% 100%)", transform: `translate(${s.dx * k}px, ${s.dy * k + 900 * k * k}px) rotate(${s.rot * k}deg)`, opacity: 1 - r(f, SNAP + 25, SNAP + 45) }} />
          ))}
          <div style={{ position: "absolute", top: 120, left: 0, right: 0, padding: "34px 30px", borderRadius: 26, background: "#141210", color: "#F3EFE8", transform: `scale(${0.6 + win * 0.4})`, opacity: win, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 34, fontWeight: 600, opacity: 0.8 }}>yazılnow Start</div>
            <div style={{ fontSize: 110, fontWeight: 800, lineHeight: 1.05 }}>29 ₼</div>
            <div style={{ fontSize: 28, marginTop: 8, color: "#E8A0AE", fontWeight: 600 }}>Usta sayından asılı deyil · 0% komissiya</div>
          </div>
        </>
      )}
      {f >= SNAP && f < SNAP + 8 ? <div style={{ position: "fixed", inset: 0, background: "#fff", opacity: 1 - (f - SNAP) / 8 }} /> : null}
    </div>
  );
};

const Badges: React.FC<{ f: number }> = ({ f }) => {
  const p = r(f, S.close + 20, S.close + 36, 0, 1, Easing.bezier(0.23, 1, 0.32, 1)) * (1 - r(f, S.close + 58, S.close + 66));
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", bottom: 420, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 20, opacity: p, transform: `translateY(${(1 - p) * 40}px)`, fontFamily: font }}>
      {["App Store", "Google Play"].map((n) => (
        <div key={n} style={{ background: "#141210", color: "#fff", padding: "14px 26px", borderRadius: 16, fontSize: 30, fontWeight: 700, textAlign: "center" }}>
          <div style={{ fontSize: 18, opacity: 0.7 }}>Tezliklə</div>
          {n}
        </div>
      ))}
    </div>
  );
};

const EndCard: React.FC<{ f: number }> = ({ f }) => {
  const at = S.close + 62;
  if (f < at) return null;
  const lf = f - at;
  const cream = r(lf, 0, 14);
  const enter = r(lf, 8, 24);
  const line = r(lf, 24, 38);
  return (
    <AbsoluteFill style={{ background: `rgba(243,239,232,${cream})`, alignItems: "center", fontFamily: font }}>
      <div style={{ marginTop: 560, opacity: enter }}>
        <Shears width={520} open={snip(lf, 12)} />
      </div>
      <div style={{ marginTop: 30, fontWeight: 800, fontSize: 120, letterSpacing: -5, color: color.ink, opacity: enter }}>yazılnow</div>
      <div style={{ marginTop: 30, fontWeight: 600, fontSize: 46, color: color.ink, opacity: line }}>Save your time with us</div>
      <div style={{ marginTop: 20, fontWeight: 500, fontSize: 32, color: color.inkMuted, opacity: line }}>İlk 30 gün pulsuz · kart tələb olunmur</div>
      <div style={{ marginTop: 12, fontWeight: 700, fontSize: 36, color: color.nar, opacity: line }}>yazilnow.az</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------

export const ReelSketch: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#E9E2D6" }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
        <Rig f={f} />
        <color attach="background" args={["#E9E2D6"]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#FFF4E2", "#8C7B66", 0.5]} />
        <directionalLight position={[2.5, 4, 2.5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[0.2, 1.8, -2]} intensity={1.2} color="#FFC98A" />
        <Room f={f} />
        <Person f={f} />
      </ThreeCanvas>
      {/* Scene 1: messages pile up */}
      <Bubble f={f} at={8} x={560} y={1240} text="Sabah saat neçədə boşsunuz?" />
      <Bubble f={f} at={34} x={600} y={1110} text="📞 Buraxılmış zəng" call />
      <Bubble f={f} at={42} x={520} y={990} text="Bu gün yer var?" />
      <Bubble f={f} at={50} x={580} y={870} text="Vaxtımı dəyişə bilərəm?" />
      <Counter f={f} />
      <ProblemBits f={f} />
      <FloatingPhone f={f} />
      <Shatter f={f} />
      <Badges f={f} />
      <Subtitles f={f} />
      <SceneTag f={f} />
      <EndCard f={f} />
    </AbsoluteFill>
  );
};
