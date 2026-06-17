"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface SceneProps {
  singlePlayer?: boolean;
  onRollOverride?: () => void;
  onAnimDone?: () => void;
}

const GameSceneInner = dynamic(
  () => import("./ThreeScene").then((m) => ({ default: m.GameScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black/20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading 3D scene...</span>
        </div>
      </div>
    ),
  }
);

export function DynamicGameScene({ singlePlayer, onRollOverride, onAnimDone }: SceneProps) {
  return <GameSceneInner singlePlayer={singlePlayer} onRollOverride={onRollOverride} onAnimDone={onAnimDone} />;
}
