import { bat } from "./cards/bat.ts";
import { bear } from "./cards/bear.ts";
import { bolster } from "./cards/bolster.ts";
import { butcher } from "./cards/butcher.ts";
import { chort } from "./cards/chort.ts";
import { cosmosWalker } from "./cards/cosmoswalker.ts";
import { doom } from "./cards/doom.ts";
import { explorer } from "./cards/explorer.ts";
import { farseer } from "./cards/farseer.ts";
import { firelash } from "./cards/firelash.ts";
import { ghoul } from "./cards/ghoul.ts";
import { imp } from "./cards/imp.ts";
import { reaper } from "./cards/reaper.ts";
import { summoner } from "./cards/summoner.ts";
import { warg } from "./cards/warg.ts";
import { uuid } from "./utils.ts";

export const GAME_RULE = {
  TURN_LENGTH_SECONDS: 60,
  PROTECTION_POWER: 2,
  DECK_SIZE: 50,
  DECK_MAX_COPIES: 4,
};

export const DEFAULT_DECK = () => [
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: imp.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: bat.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: bear.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: explorer.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: warg.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: butcher.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: firelash.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: doom.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: farseer.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: cosmosWalker.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: bolster.definitionId,
    })),
  ...Array(3)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: ghoul.definitionId,
    })),
  ...Array(3)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: reaper.definitionId,
    })),
];
