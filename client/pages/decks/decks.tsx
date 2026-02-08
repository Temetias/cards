import { Link, useParams } from "react-router-dom";
import "./decks.css";
import { useUser, useUserContext } from "../../context/UserContext.tsx";
import {
  CARD_DEFINITIONS,
  type Faction,
  getCardDefinition,
} from "../../../shared/cards/index.ts";
import { CardDisplayer } from "../../components/CardDisplayer/CardDisplayer.tsx";
import { uniqueByKey, uuid, type UUID } from "../../../shared/utils.ts";
import {
  validateDeck,
  type Deck,
  type UserData,
} from "../../../shared/user.ts";
import { useState } from "react";
import { GAME_RULE } from "../../../shared/constants.ts";
import { FACTIONS } from "../../../shared/cards/factions.ts";

function DeckItem({
  deck,
  user,
  onActivate,
  activating,
}: {
  deck?: Deck;
  user: UserData;
  onActivate: (deckId: Deck["id"]) => void;
  activating: boolean;
}) {
  const displayPool = uniqueByKey(deck?.cards || [], "definitionId").sort(
    (a, b) =>
      getCardDefinition(a.definitionId).cost -
      getCardDefinition(b.definitionId).cost,
  );
  const displayPoolImages = [
    displayPool[0]?.definitionId || "cardback",
    displayPool[1]?.definitionId || "cardback",
    displayPool[displayPool.length - 2]?.definitionId || "cardback",
    displayPool[displayPool.length - 1]?.definitionId || "cardback",
  ];
  return (
    <div className="DeckItem">
      <div className="DeckItem-Cards">
        {displayPoolImages.map((defId, index) => (
          <div
            key={index}
            style={{
              backgroundImage: `url(/${defId || "cardback"}.png)`,
            }}
          ></div>
        ))}
      </div>
      <Link to={`/decks/${deck?.id || "new"}`}>
        <div className="DeckItem-Name">{deck?.name || "Create new"}</div>
      </Link>
      {deck && (
        <button
          className="DeckItem-Button"
          type="button"
          onClick={() => onActivate(deck.id)}
          disabled={user.activeDeckId === deck.id || activating}
        >
          {user.activeDeckId === deck.id
            ? "Active"
            : activating
              ? "Setting..."
              : "Make active"}
        </button>
      )}
    </div>
  );
}

export default function Decks() {
  const { user } = useUser();
  const { setUser } = useUserContext();
  const [activatingId, setActivatingId] = useState<Deck["id"] | null>(null);
  if (!user) return <div className="Decks"></div>;
  const handleActivate = async (deckId: Deck["id"]) => {
    setActivatingId(deckId);
    try {
      const res = await fetch(`/api/user/setActiveDeck/${deckId}`, {
        method: "POST",
      });
      if (!res.ok) {
        return;
      }
      const updatedUser = (await res.json()) as UserData;
      setUser(updatedUser);
    } finally {
      setActivatingId(null);
    }
  };
  return (
    <div className="Decks">
      <DeckItem user={user} onActivate={handleActivate} activating={false} />
      {user?.decks.map((deck) => (
        <DeckItem
          key={deck.id}
          deck={deck}
          user={user}
          onActivate={handleActivate}
          activating={activatingId === deck.id}
        />
      ))}
    </div>
  );
}

export function DeckEdit() {
  const { user } = useUser();
  const { setUser } = useUserContext();
  const deckId = useParams().id;
  const [deck, setDeck] = useState<Deck>(
    user?.decks.find((d) => d.id === deckId) ?? {
      id: "new" as UUID,
      name: "",
      cards: [],
      factions: null as any, // This should never flow through
    },
  );
  const [factions, setFactions] = useState<Faction[] | null>(
    user?.decks.find((d) => d.id === deckId)?.factions ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <main className="DeckEdit">
        <p>Please sign in to edit decks.</p>
      </main>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/deck/${deck.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: deck.name,
          cards: deck.cards,
          factions: factions,
        }),
      });
      if (!res.ok) {
        const message = await res.text();
        setError(message || "Failed to save deck.");
        return;
      }
      const updatedUser = (await res.json()) as typeof user;
      setUser(updatedUser);
      if (deck.id === "new") {
        const createdDeck = updatedUser.decks[updatedUser.decks.length - 1];
        if (createdDeck) {
          setDeck(createdDeck);
          setFactions(createdDeck.factions);
        }
      } else {
        const updatedDeck = updatedUser.decks.find((d) => d.id === deck.id);
        if (updatedDeck) {
          setDeck(updatedDeck);
          setFactions(updatedDeck.factions);
        }
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="DeckEdit">
      <div className="DeckEdit-Collection">
        {[
          // Factions
          ...Object.entries(CARD_DEFINITIONS)
            .filter(([id]) => id.startsWith("collectible"))
            .filter(([_, def]) => {
              if (!deck.factions) return false;
              return deck.factions.includes(def.faction);
            })
            .sort(([, a], [, b]) => a.cost - b.cost),
          // Neutrals
          ...Object.entries(CARD_DEFINITIONS)
            .filter(([id]) => id.startsWith("collectible"))
            .filter(([_, def]) => {
              if (!deck.factions) return false;
              if (def.faction !== FACTIONS.NEUTRAL) return false;
              return true;
            })
            .sort(([, a], [, b]) => a.cost - b.cost),
        ].map(
          (
            [cardDefinitionId, cardDefinition], // Once collections is implemented, just loop through those instead
          ) => (
            <div key={cardDefinitionId} className="DeckEdit-Collection-Card">
              <CardDisplayer
                onClick={() => {
                  if (deck.cards.length >= GAME_RULE.DECK_SIZE) return;
                  if (
                    deck.cards.filter(
                      (c) => c.definitionId === cardDefinitionId,
                    ).length >= GAME_RULE.DECK_MAX_COPIES
                  ) {
                    return;
                  }
                  setDeck({
                    ...deck,
                    cards: [
                      ...deck.cards,
                      {
                        id: uuid(),
                        definitionId: cardDefinition.definitionId,
                      },
                    ],
                  });
                }}
                showCost
                showPower
                showDetails
                card={{
                  ...cardDefinition,
                  id: "preview" as UUID, // this id should be changed when adding to deck
                }}
              />
            </div>
          ),
        )}
      </div>
      <div className="DeckEdit-Deck">
        <div className="DeckEdit-Name">
          <input
            type="text"
            value={deck.name}
            onChange={(event) => {
              setDeck({ ...deck, name: event.target.value });
            }}
            placeholder="New deck"
          />
        </div>
        <div className="DeckEdit-DeckList">
          {uniqueByKey(deck.cards, "definitionId")
            .sort((a, b) => {
              return (
                getCardDefinition(a.definitionId).cost -
                getCardDefinition(b.definitionId).cost
              );
            })
            .map((card) => (
              <div
                key={card.id}
                className="DeckEdit-DeckItem"
                style={{
                  backgroundImage: `url(/${card.definitionId}.png)`,
                }}
                onClick={() => {
                  setDeck({
                    ...deck,
                    cards: deck.cards.filter((c) => c.id !== card.id),
                  });
                }}
              >
                <div>{getCardDefinition(card.definitionId)?.name}</div>
                <div>
                  x
                  {
                    deck.cards.filter(
                      (c) => c.definitionId === card.definitionId,
                    ).length
                  }
                </div>
              </div>
            ))}
        </div>
        <div className="DeckEdit-Actions">
          <div>
            {deck.cards.length}/{GAME_RULE.DECK_SIZE}
          </div>
          <div className="DeckEdit-Actions-Save">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !validateDeck(deck)}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          {error ? <div>{error}</div> : null}
        </div>
      </div>
      {!deck.factions && (
        <div className="DeckEdit-Factions">
          <div>
            <h2>Select 2 Factions</h2>
          </div>
          <div className="DeckEdit-Factions-Options">
            <div
              className={`DeckEdit-Factions-Card ${factions?.includes(FACTIONS.THORNBOUND) ? "Faction-Selected" : ""}`}
              style={{ backgroundImage: `url(/thornbound.png)` }}
              onClick={() => {
                if (factions?.includes(FACTIONS.THORNBOUND)) {
                  setFactions(
                    factions.filter((f) => f !== FACTIONS.THORNBOUND),
                  );
                } else {
                  if (factions && factions.length >= 2) return;
                  setFactions([...(factions || []), FACTIONS.THORNBOUND]);
                }
              }}
            >
              <h3>Thornbound</h3>
              <div>
                <p>
                  The Thornbound wield the power of nature to control the
                  resources and time to their advantage, and to get rid of their
                  opponents in a way that leaves no traces.
                </p>
                <p>
                  <b>Gameplay themes:</b>
                </p>
                <ul>
                  <li>Resource acceleration</li>
                  <li>Removal via transformation</li>
                  <li>Per turn mechanics manipulation</li>
                </ul>
              </div>
            </div>
            <div
              className={`DeckEdit-Factions-Card ${factions?.includes(FACTIONS.DOMINION) ? "Faction-Selected" : ""}`}
              style={{ backgroundImage: `url(/dominion.png)` }}
              onClick={() => {
                if (factions?.includes(FACTIONS.DOMINION)) {
                  setFactions(factions.filter((f) => f !== FACTIONS.DOMINION));
                } else {
                  if (factions && factions.length >= 2) return;
                  setFactions([...(factions || []), FACTIONS.DOMINION]);
                }
              }}
            >
              <h3>Dominion</h3>
              <div>
                <p>
                  The Dominion controls over the realm of death, and aim to
                  expand their realm by force. They utilize necromancy and
                  vermin to fuel their forces, and are masters of disruption.
                </p>
                <p>
                  <b>Gameplay themes:</b>
                </p>
                <ul>
                  <li>Hand disruption</li>
                  <li>Field flooding</li>
                  <li>Graveyard leveraging</li>
                </ul>
              </div>
            </div>
            <div
              className={`DeckEdit-Factions-Card ${factions?.includes(FACTIONS.WORLDFORGED) ? "Faction-Selected" : ""}`}
              style={{ backgroundImage: `url(/worldforged.png)` }}
              onClick={() => {
                if (factions?.includes(FACTIONS.WORLDFORGED)) {
                  setFactions(
                    factions.filter((f) => f !== FACTIONS.WORLDFORGED),
                  );
                } else {
                  if (factions && factions.length >= 2) return;
                  setFactions([...(factions || []), FACTIONS.WORLDFORGED]);
                }
              }}
            >
              <h3>Worldforged</h3>
              <div>
                <p>
                  The Worldforged are brutal spawns of the realm of fire and
                  metal. They utilize fire and chaos to accelerate their
                  expansion over the realms.
                </p>
                <p>
                  <b>Gameplay themes:</b>
                </p>
                <ul>
                  <li>Card draw</li>
                  <li>Creature evolution</li>
                  <li>Direct damage</li>
                </ul>
              </div>
            </div>
            <div
              className={`DeckEdit-Factions-Card ${factions?.includes(FACTIONS.ASTRALS) ? "Faction-Selected" : ""}`}
              style={{ backgroundImage: `url(/astrals.png)` }}
              onClick={() => {
                if (factions?.includes(FACTIONS.ASTRALS)) {
                  setFactions(factions.filter((f) => f !== FACTIONS.ASTRALS));
                } else {
                  if (factions && factions.length >= 2) return;
                  setFactions([...(factions || []), FACTIONS.ASTRALS]);
                }
              }}
            >
              <h3>Astrals</h3>
              <div>
                <p>
                  The Astrals are humans of the icy north worshipping the
                  astral, a realm of spirits and illusions. They utilize the
                  power of the weather to their advantage, and the power of
                  astral to pull on greater forces.
                </p>
                <p>
                  <b>Gameplay themes:</b>
                </p>
                <ul>
                  <li>Field manipulation</li>
                  <li>Buffing and debuffing</li>
                  <li>Situational magic</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <button
              type="button"
              disabled={factions?.length !== 2}
              onClick={() => {
                if (!factions || factions.length !== 2) return;
                setDeck({
                  ...deck,
                  factions: factions as [Faction, Faction],
                });
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
