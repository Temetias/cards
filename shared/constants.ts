import { bolster } from "./cards/bolster.ts";
import { butcher } from "./cards/butcher.ts";
import { cosmosWalker } from "./cards/cosmoswalker.ts";
import { doom } from "./cards/doom.ts";
import { firelash } from "./cards/firelash.ts";
import { ghoul } from "./cards/ghoul.ts";
import { imp } from "./cards/imp.ts";
import { reaper } from "./cards/reaper.ts";
import { uuid } from "./utils.ts";

export const GAME_RULE = {
  TURN_LENGTH_SECONDS: 60,
  PROTECTION_POWER: 2,
};

export const DEFAULT_DECK = () => [
  ...Array(10)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: imp.definitionId,
    })),
  ...Array(5)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: butcher.definitionId,
    })),
  ...Array(5)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: cosmosWalker.definitionId,
    })),
  ...Array(5)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: reaper.definitionId,
    })),
  ...Array(5)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: firelash.definitionId,
    })),
  ...Array(5)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: ghoul.definitionId,
    })),
  ...Array(5)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: doom.definitionId,
    })),
  ...Array(5)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: bolster.definitionId,
    })),
];
