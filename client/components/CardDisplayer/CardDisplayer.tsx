import { ComponentPropsWithRef } from "react";
import { isCreature, type Card } from "../../../shared/cards/index.ts";
import "./CardDisplayer.css";
import type {
  ClientHandCard,
  FieldCreatureCard,
} from "../../../shared/game.ts";
import {
  GiAbstract047,
  GiBroadsword,
  GiBrokenShield,
  GiChewedSkull,
  GiHumanTarget,
  GiSkullShield,
} from "react-icons/gi";

type CardDisplayerProps = {
  card: Card | FieldCreatureCard | ClientHandCard;
  selection?: "OPPONENT" | "PLAYER" | null;
  playable?: boolean;
  showCost?: true;
  showPower?: true;
  showDetails?: true;
  showIcons?: true;
  showShield?: true;
  flipside?: true;
  handHover?: true;
  fieldAnimations?: {
    attack?: boolean;
    defend?: boolean;
    trigger?: boolean;
    death?: boolean;
    break?: boolean;
  };
} & ComponentPropsWithRef<"div">;

function CostSvg({ cost }: { cost: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="CardDisplayer-Cost"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="black"
        strokeWidth="5"
        fill="lightblue"
      />
      <text
        x="50%"
        y="58%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="80"
        fill="black"
        fontFamily="Arial, sans-serif"
      >
        {cost}
      </text>
    </svg>
  );
}

function PowerSvg({ power }: { power: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="CardDisplayer-Power"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="black"
        strokeWidth="5"
        fill="tomato"
      />
      <text
        x="50%"
        y="58%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="80"
        fill="black"
        fontFamily="Arial, sans-serif"
      >
        {power}
      </text>
    </svg>
  );
}

// Description is split into multiple lines already in the backend definition
function DescriptionSvg({ description }: { description: string[] }) {
  const height = description.length * 14;
  const MARGIN = 10;
  const FONT_SIZE = 14;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 200 ${height + MARGIN}`}
      className="CardDisplayer-Description"
    >
      {description.map((line, index) => (
        <text
          key={index}
          x="50%"
          y={`${(height / description.length) * (index + 1) - FONT_SIZE / 2 + MARGIN / 2}`}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={FONT_SIZE}
          fill="black"
          fontFamily="Arial, sans-serif"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}

function NameSvg({ name }: { name: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 25"
      className="CardDisplayer-Name"
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="16"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        {name}
      </text>
    </svg>
  );
}

export function CardDisplayer({
  card,
  selection,
  playable,
  showCost,
  showPower,
  showDetails,
  showIcons,
  showShield,
  flipside,
  handHover,
  fieldAnimations,
  ...native
}: CardDisplayerProps) {
  const highlightClass = (() => {
    switch (true) {
      case selection === "PLAYER":
        return "CardDisplayer-PlayerSelection";
      case selection === "OPPONENT":
        return "CardDisplayer-OpponentSelection";
      case playable:
        return "CardDisplayer-Playable";
      default:
        return "";
    }
  })();
  const handHoverClass = handHover ? "CardDisplayer-HandHover" : "";
  return (
    <div
      {...native}
      className={[
        "CardDisplayer",
        handHoverClass,
        highlightClass,
        native.className,
      ].join(" ")}
      style={{
        ...native.style,
        backgroundImage: flipside ? "url(/cardback.png)" : undefined,
      }}
    >
      {showShield && (
        <>
          <GiBrokenShield className="CardDisplayer-Power CardDisplayer-Shield-Decor" />
          <PowerSvg power={2} />
          {fieldAnimations?.break && (
            <GiSkullShield className="CardDisplayer-Overlay" />
          )}
        </>
      )}
      {!flipside && (
        <div
          className="CardDisplayer-Inner"
          style={{
            backgroundImage: `url(/${card.definitionId}.png)`,
          }}
        >
          {showCost && <CostSvg cost={card.cost} />}
          {showPower && "power" in card && (
            <>
              <GiBroadsword className="CardDisplayer-Power CardDisplayer-Power-Decor" />
              <PowerSvg power={card.power} />
            </>
          )}
          {showIcons &&
            isCreature(card) &&
            !!Object.keys(card.triggers).length && (
              <GiAbstract047
                className={[
                  "CardDisplayer-Icon",
                  fieldAnimations?.trigger ? " CardDisplayer-Icon-Active" : "",
                ].join(" ")}
              />
            )}
          {fieldAnimations?.defend && (
            <GiHumanTarget className="CardDisplayer-Overlay" />
          )}
          {fieldAnimations?.attack && (
            <GiBroadsword className="CardDisplayer-Overlay" />
          )}
          {fieldAnimations?.death && (
            <GiChewedSkull className="CardDisplayer-Overlay" />
          )}
          {showDetails && (
            <>
              <NameSvg name={card.name} />
              {card.description.length > 0 && (
                <DescriptionSvg description={card.description} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
