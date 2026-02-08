import { leechingbat } from "./cards/leechingbat.ts";
import { polarbear } from "./cards/polarbear.ts";
import { bolster } from "./cards/bolster.ts";
import { butcher } from "./cards/butcher.ts";
import { cosmosWalker } from "./cards/cosmoswalker.ts";
import { doom } from "./cards/doom.ts";
import { beasttamer } from "./cards/beasttamer.ts";
import { farseer } from "./cards/farseer.ts";
import { firelash } from "./cards/firelash.ts";
import { maggotghoul } from "./cards/maggotghoul.ts";
import { peskyimp } from "./cards/peskyimp.ts";
import { reaper } from "./cards/reaper.ts";
import { warg } from "./cards/warg.ts";
import { uuid } from "./utils.ts";
import { fieryfiend } from "./cards/fieryfiend.ts";
import { tundracat } from "./cards/tundracat.ts";
import { whitestag } from "./cards/whitestag.ts";
import { emberwolf } from "./cards/emberwolf.ts";
import { spiritbunny } from "./cards/spiritbunny.ts";
import { lonelyarcher } from "./cards/lonelyarcher.ts";
import { royalknight } from "./cards/royalknight.ts";
import { stablemaster } from "./cards/stablemaster.ts";

export const GAME_RULE = {
  TURN_LENGTH_SECONDS: 60,
  PROTECTION_POWER: 2,
  DECK_SIZE: 50,
  DECK_MAX_COPIES: 4,
  MAX_HAND_SIZE: 10,
};

export const DEFAULT_DECK = () => [
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: fieryfiend.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: tundracat.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: whitestag.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: emberwolf.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: spiritbunny.definitionId,
    })),
  ...Array(2)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: doom.definitionId,
    })),
  ...Array(2)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: firelash.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: lonelyarcher.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: polarbear.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: royalknight.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: beasttamer.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: stablemaster.definitionId,
    })),
  ...Array(4)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: farseer.definitionId,
    })),
  ...Array(2)
    .fill(0)
    .map(() => ({
      id: uuid(),
      definitionId: cosmosWalker.definitionId,
    })),
];
