import { ComponentPropsWithRef } from "react";
import { isCreature, type Card } from "../../../shared/cards/index.ts";
import { CardDisplayer } from "../CardDisplayer/CardDisplayer.tsx";
import "./PreviewDisplayer.css";

type PreviewDisplayerProps = {
  card: Card;
} & ComponentPropsWithRef<"div">;

export function PreviewDisplayer({ card, ...native }: PreviewDisplayerProps) {
  return (
    <div {...native} className="PreviewDisplayer">
      <CardDisplayer card={card} />
      <div className="PreviewDisplayer-content">
        <div>{card.cost}</div>
        <div>{card.name}</div>
        <div>{card.description}</div>
        <div>{isCreature(card) ? card.power : ""}</div>
      </div>
    </div>
  );
}
