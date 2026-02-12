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
            blow.
          </li>
          <li>You can only attack protection when opponents field is empty.</li>
          <li>Destroyed protection cards go into the hand.</li>
          <li>Card cost resource. You can add one resource per turn.</li>
          <li>
            Creatures can attack once per turn, and not on the turn they are
            summoned.
          </li>
          <li>
            Creatures can attack solo, or combine their offensive power as a
            group.
          </li>
          <li>
            When creatures combat the higher power wins. If the power is equal
            both creatures die.
          </li>
          <li>
            Dead creatures go to the graveyard, and can be revived by certain
            cards. Discarded cards are gone for forever.
          </li>
          <li>Max hand size is 10, max field size if 5.</li>
        </ul>
      </div>
      <div className="Guide-Content">
        <h2>Tips</h2>
        <ul>
          <li>Clear your user selection with ESC</li>
        </ul>
      </div>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
