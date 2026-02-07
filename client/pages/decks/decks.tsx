import { Link, useParams } from "react-router-dom";
import "./decks.css";
import { useUser, useUserContext } from "../../context/UserContext.tsx";
import {
  CARD_DEFINITIONS,
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
    },
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
        }
      } else {
        const updatedDeck = updatedUser.decks.find((d) => d.id === deck.id);
        if (updatedDeck) {
          setDeck(updatedDeck);
        }
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="DeckEdit">
      <div className="DeckEdit-Collection">
        {Object.entries(CARD_DEFINITIONS)
          .filter(([id]) => id.startsWith("collectible"))
          .sort(([, a], [, b]) => a.cost - b.cost)
          .map(
            (
              [cardDefinitionId, cardDefinition], // Once collections is implemented, just loop through those instead
            ) => (
              <div key={cardDefinitionId} className="DeckEdit-Collection-Card">
                <CardDisplayer
                  onClick={() => {
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
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !validateDeck(deck)}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {error ? <div>{error}</div> : null}
        </div>
      </div>
    </main>
  );
}
