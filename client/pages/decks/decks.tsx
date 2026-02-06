import { Link, useParams } from "react-router-dom";
import "./decks.css";
import { useUser } from "../../context/UserContext.tsx";
import {
  CARD_DEFINITIONS,
  getCardDefinition,
} from "../../../shared/cards/index.ts";
import { CardDisplayer } from "../../components/CardDisplayer/CardDisplayer.tsx";
import { uniqueByKey, uuid, type UUID } from "../../../shared/utils.ts";
import type { Deck } from "../../../shared/user.ts";
import { useState } from "react";

export default function Decks() {
  const { user } = useUser();
  return (
    <main className="decks-page">
      <h1>My Decks</h1>
      <Link to="/decks/new">
        <button type="button">Create deck</button>
      </Link>
      <ul className="decks-list">
        {user?.decks.map((deck) => (
          <Link to={`/decks/${deck.id}`} key={deck.id}>
            <div key={deck.id}>{deck.name}</div>
          </Link>
        ))}
      </ul>
    </main>
  );
}

export function DeckEdit() {
  const { user } = useUser();
  const deckId = useParams().id;
  const [deck, setDeck] = useState<Deck>(
    user?.decks.find((d) => d.id === deckId) ?? {
      id: "new" as UUID,
      name: "",
      cards: [],
    },
  );
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
        <div>
          <button type="button">Save</button>
          <Link to="/decks">
            <button type="button">Back to decks</button>
          </Link>
        </div>
      </div>
    </main>
  );
}
