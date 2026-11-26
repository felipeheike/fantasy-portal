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
      /** How this session was opened: password (+TOTP) or SSO via Authentik. */
      authMethod?: AuthMethod;
    } & DefaultSession["user"];
  }
}

type AuthMethod = "credentials" | "oidc";

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: PlayerRole;
    accountStatus: PlayerAccountStatus;
    forcePasswordChange: boolean;
    authMethod?: AuthMethod;
  }
}
