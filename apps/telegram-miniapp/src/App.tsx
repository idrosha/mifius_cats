import { useCallback, useEffect, useState } from "react";
import type { LevelRunResult, LevelSession } from "@mir-games/game-core";
import type { AppBootstrap } from "./bootstrap";
import { EGYPT_LEVEL, MAP_LOCATIONS } from "./content/egypt-level";
import { MenuScreen } from "./screens/MenuScreen";
import { MapScreen } from "./screens/MapScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { StubScreen } from "./screens/StubScreen";

type Route =
  | { name: "menu" }
  | { name: "map" }
  | { name: "play"; session: LevelSession; locationTitle: string }
  | { name: "result"; result: LevelRunResult; commitError: string | null }
  | { name: "stub"; title: string };

const STUB_TITLES: Record<string, string> = {
  online: "Онлайн",
  championship: "Чемпионат",
  leaders: "Лидеры",
  shop: "Магазин",
  account: "Аккаунт",
  settings: "Настройки",
};

type Props = {
  boot: AppBootstrap;
};

export function App({ boot }: Props) {
  const { engine, progressApi, player } = boot;
  const [route, setRoute] = useState<Route>({ name: "menu" });
  const [progress, setProgress] = useState(() => engine.getProgress());
  const [avatar, setAvatar] = useState(() => engine.getAvatar());
  const [totalPoints, setTotalPoints] = useState(0);

  const refreshFromServer = useCallback(async () => {
    const snap = await progressApi.load(player.playerId);
    engine.setProgress(snap.progress);
    engine.setAvatar(snap.avatar);
    setProgress(snap.progress);
    setAvatar(snap.avatar);
    setTotalPoints(snap.totalPoints);
  }, [engine, player.playerId, progressApi]);

  useEffect(() => {
    void refreshFromServer();
  }, [refreshFromServer]);

  function onMenuSelect(id: string): void {
    if (id === "single") {
      setRoute({ name: "map" });
      return;
    }
    setRoute({ name: "stub", title: STUB_TITLES[id] ?? id });
  }

  function startLevel(levelIndex: number): void {
    if (levelIndex !== 1) {
      return;
    }
    const session = engine.startLevel(EGYPT_LEVEL);
    if (!session) {
      window.alert("Уровень закрыт");
      return;
    }
    const loc = MAP_LOCATIONS.find((l) => l.levelIndex === levelIndex);
    setRoute({
      name: "play",
      session,
      locationTitle: loc?.title ?? "Уровень",
    });
  }

  const finishPlay = useCallback(
    async (result: LevelRunResult) => {
      let commitError: string | null = null;
      try {
        engine.commitRun(result);
        const snap = await progressApi.commit(player.playerId, result);
        engine.setProgress(snap.progress);
        engine.setAvatar(snap.avatar);
        setProgress(snap.progress);
        setAvatar(snap.avatar);
        setTotalPoints(snap.totalPoints);
      } catch (err) {
        commitError = err instanceof Error ? err.message : String(err);
        setProgress(engine.getProgress());
      }
      setRoute({ name: "result", result, commitError });
    },
    [engine, player.playerId, progressApi],
  );

  if (route.name === "menu") {
    return <MenuScreen displayName={player.displayName} onSelect={onMenuSelect} />;
  }
  if (route.name === "stub") {
    return <StubScreen title={route.title} onBack={() => setRoute({ name: "menu" })} />;
  }
  if (route.name === "map") {
    return (
      <MapScreen
        progress={progress}
        avatar={avatar}
        totalPoints={totalPoints}
        onBack={() => setRoute({ name: "menu" })}
        onPlayLevel={startLevel}
      />
    );
  }
  if (route.name === "play") {
    return (
      <PlayScreen
        session={route.session}
        avatar={avatar}
        locationTitle={route.locationTitle}
        onFinished={(result) => {
          void finishPlay(result);
        }}
      />
    );
  }
  return (
    <ResultScreen
      result={route.result}
      avatar={avatar}
      commitError={route.commitError}
      onMap={() => setRoute({ name: "map" })}
      onMenu={() => setRoute({ name: "menu" })}
    />
  );
}
