import Svg, { Circle, Line } from 'react-native-svg';
import { Keypoint, SKELETON_EDGES } from '@/features/pose/keypoints';
import { colors } from '@/theme/tokens';

export function SkeletonOverlay({
  frame,
  width,
  height,
  mirrored,
}: {
  frame: Keypoint[] | null;
  width: number;
  height: number;
  mirrored?: boolean;
}) {
  if (!frame) return null;

  const project = (p: Keypoint) => ({
    x: (mirrored ? 1 - p.x : p.x) * width,
    y: p.y * height,
  });

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
      {SKELETON_EDGES.map(([a, b], i) => {
        const pa = frame[a];
        const pb = frame[b];
        if (!pa || !pb) return null;
        if ((pa.score ?? 1) < 0.3 || (pb.score ?? 1) < 0.3) return null;
        const A = project(pa);
        const B = project(pb);
        return (
          <Line
            key={i}
            x1={A.x}
            y1={A.y}
            x2={B.x}
            y2={B.y}
            stroke={colors.primary}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      {frame.map((p, i) => {
        if ((p.score ?? 1) < 0.3) return null;
        const P = project(p);
        return (
          <Circle key={i} cx={P.x} cy={P.y} r={4} fill={colors.warn} />
        );
      })}
    </Svg>
  );
}
