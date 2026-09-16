import { DefaultSession } from "next-auth";
import "next-auth/jwt";
import { PlayerRole, PlayerAccountStatus } from "./auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: PlayerRole;
    accountStatus: PlayerAccountStatus;
    forcePasswordChange: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: PlayerRole;
      accountStatus: PlayerAccountStatus;
      forcePasswordChange: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: PlayerRole;
    accountStatus: PlayerAccountStatus;
    forcePasswordChange: boolean;
  }
}
