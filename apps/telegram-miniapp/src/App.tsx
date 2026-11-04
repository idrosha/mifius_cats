import { useCallback, useEffect, useState } from "react";
import type { LevelRunResult, LevelSession } from "@mir-games/game-core";
import type { AccountSnapshotDto, OnlineMatchPublicDto } from "@mir-games/adapters-telegram";
import type { AppBootstrap } from "./bootstrap";
import { getLevel, MAP_LOCATIONS } from "@mir-games/question-bank";
import { MenuScreen } from "./screens/MenuScreen";
import { MapScreen } from "./screens/MapScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { StubScreen } from "./screens/StubScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { AccountScreen } from "./screens/AccountScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { OnlineLobbyScreen } from "./screens/OnlineLobbyScreen";
import { OnlineMatchScreen } from "./screens/OnlineMatchScreen";
import { OnlineResultScreen } from "./screens/OnlineResultScreen";

type Route =
  | { name: "menu" }
  | { name: "map" }
  | { name: "play"; session: LevelSession; locationTitle: string }
  | { name: "result"; result: LevelRunResult; commitError: string | null }
  | { name: "shop" }
  | { name: "account" }
  | { name: "settings" }
  | { name: "online-lobby" }
  | { name: "online-match"; match: OnlineMatchPublicDto }
  | { name: "online-result"; match: OnlineMatchPublicDto }
  | { name: "stub"; title: string };

const STUB_TITLES: Record<string, string> = {
  championship: "Чемпионат",
  leaders: "Лидеры",
};

type Props = {
  boot: AppBootstrap;
};

export function App({ boot }: Props) {
  const { engine, progressApi, shopApi, onlineApi, payment, storage, player } = boot;
  const [route, setRoute] = useState<Route>({ name: "menu" });
  const [progress, setProgress] = useState(() => engine.getProgress());
  const [avatar, setAvatar] = useState(() => engine.getAvatar());
  const [totalPoints, setTotalPoints] = useState(0);
  const [account, setAccount] = useState<AccountSnapshotDto | null>(null);
  const [displayName, setDisplayName] = useState(player.displayName);

  const applyAccount = useCallback(
    (snap: AccountSnapshotDto) => {
      engine.setProgress(snap.progress);
      engine.setAvatar(snap.avatar);
      setProgress(snap.progress);
      setAvatar(snap.avatar);
      setTotalPoints(snap.totalPoints);
      setAccount(snap);
      if (snap.displayName) {
        setDisplayName(snap.displayName);
      }
    },
    [engine],
  );

  const refreshFromServer = useCallback(async () => {
    const snap = await progressApi.load(player.playerId);
    applyAccount(snap);
  }, [applyAccount, player.playerId, progressApi]);

  useEffect(() => {
    void refreshFromServer();
  }, [refreshFromServer]);

  function onMenuSelect(id: string): void {
    if (id === "single") {
      setRoute({ name: "map" });
      return;
    }
    if (id === "online") {
      setRoute({ name: "online-lobby" });
      return;
    }
    if (id === "shop") {
      setRoute({ name: "shop" });
      return;
    }
    if (id === "account") {
      setRoute({ name: "account" });
      return;
    }
    if (id === "settings") {
      setRoute({ name: "settings" });
      return;
    }
    setRoute({ name: "stub", title: STUB_TITLES[id] ?? id });
  }

  function startLevel(levelIndex: number): void {
    const level = getLevel(levelIndex);
    if (!level) {
      window.alert("Уровень не найден");
      return;
    }
    const session = engine.startLevel(level);
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
        applyAccount(snap);
      } catch (err) {
        commitError = err instanceof Error ? err.message : String(err);
        setProgress(engine.getProgress());
      }
      setRoute({ name: "result", result, commitError });
    },
    [applyAccount, engine, player.playerId, progressApi],
  );

  if (route.name === "menu") {
    return <MenuScreen displayName={displayName} onSelect={onMenuSelect} />;
  }
  if (route.name === "stub") {
    return <StubScreen title={route.title} onBack={() => setRoute({ name: "menu" })} />;
  }
  if (route.name === "online-lobby") {
    return (
      <OnlineLobbyScreen
        playerId={player.playerId}
        avatar={avatar}
        onlineApi={onlineApi}
        onMatched={(match) => setRoute({ name: "online-match", match })}
        onBack={() => setRoute({ name: "menu" })}
      />
    );
  }
  if (route.name === "online-match") {
    return (
      <OnlineMatchScreen
        playerId={player.playerId}
        onlineApi={onlineApi}
        initialMatch={route.match}
        onFinished={(match) => setRoute({ name: "online-result", match })}
      />
    );
  }
  if (route.name === "online-result") {
    return (
      <OnlineResultScreen
        match={route.match}
        onAgain={() => setRoute({ name: "online-lobby" })}
        onMenu={() => {
          void refreshFromServer();
          setRoute({ name: "menu" });
        }}
      />
    );
  }
  if (route.name === "shop" && account) {
    return (
      <ShopScreen
        playerId={player.playerId}
        shopApi={shopApi}
        payment={payment}
        account={account}
        onAccountChange={applyAccount}
        onBack={() => setRoute({ name: "menu" })}
      />
    );
  }
  if (route.name === "account" && account) {
    return (
      <AccountScreen
        playerId={player.playerId}
        shopApi={shopApi}
        account={account}
        onAccountChange={applyAccount}
        onDisplayNameChange={setDisplayName}
        onBack={() => setRoute({ name: "menu" })}
      />
    );
  }
  if (route.name === "settings" && account) {
    return (
      <SettingsScreen
        playerId={player.playerId}
        shopApi={shopApi}
        storage={storage}
        account={account}
        onAccountChange={applyAccount}
        onBack={() => setRoute({ name: "menu" })}
      />
    );
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
  if (route.name === "result") {
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
  return (
    <section className="screen">
      <p>Загрузка аккаунта…</p>
    </section>
  );
}
