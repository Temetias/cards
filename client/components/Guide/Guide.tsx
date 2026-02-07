import "./Guide.css";

export function Guide({ onClose }: { onClose?: () => void }) {
  return (
    <div className="Guide">
      <div className="Guide-Content">
        <h2>Deck Rules</h2>
        <ul>
          <li>Deck size is fixed at 50 cards.</li>
          <li>Max 4 copies per card.</li>
          <li>Set active deck from My Decks page.</li>
          <li>Active deck is used when a match starts.</li>
        </ul>
      </div>
      <div className="Guide-Content">
        <h2>Game Rules</h2>
        <ul>
          <li>
            Your goal is to destroy all opponent protection and deal a finishing
            blow
          </li>
          <li>You can only attack protection when opponents field is empty</li>
          <li>Card cost resource. You can play one resource per turn</li>
          <li>
            Creatures can attack once per turn, and not on the turn they are
            summoned.
          </li>
          <li>Creatures can attack solo, or combine their power as a group.</li>
          <li>
            When creatures combat the higher power wins. In combined attacks,
            the total is only used as the offensive value.
          </li>
        </ul>
      </div>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
