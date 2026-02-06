import { sendMessage } from "../shared/communication.ts";
import { User } from "../shared/user.ts";
import { startMatch } from "./game/core.ts";

let MATCHMAKING: User[] = [];

export function matchMake(user: User) {
  user.socket.onopen = () => {
    if (!MATCHMAKING.length && !MATCHMAKING.find((u) => u.id === user.id)) {
      MATCHMAKING.push(user);
      console.log("User added to matchmaking queue:", user.id);
      sendMessage({ message: "MATCH_PENDING" }, user.socket);
      user.socket.onclose = () => {
        MATCHMAKING = MATCHMAKING.filter((u) => u.id !== user.id);
      };
      return;
    }
    const opponent = MATCHMAKING.shift()!;
    console.log("Match found between users:", user.id, "and", opponent.id);
    sendMessage({ message: "MATCH_FOUND" }, user.socket);
    sendMessage({ message: "MATCH_FOUND" }, opponent.socket);
    MATCHMAKING = MATCHMAKING.filter(
      (u) => u.id !== user.id && u.id !== opponent.id,
    );
    startMatch(user, opponent);
  };
}
