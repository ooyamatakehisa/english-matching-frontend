import Client from "@/components/client";
import { SkyWayAuthToken, nowInSec, uuidV4 } from "@skyway-sdk/token";


export default function Home() {
    const token = new SkyWayAuthToken({
      jti: uuidV4(),
      iat: nowInSec(),
      exp: nowInSec() + 60 * 60 * 24,
      scope: {
        app: {
          id: process.env.SKY_WAY_APP_ID!,
          turn: true,
          actions: ["read"],
          channels: [
            {
              id: "*",
              name: "*",
              actions: ["write"],
              members: [
                {
                  id: "*",
                  name: "*",
                  actions: ["write"],
                  publication: {
                    actions: ["write"],
                  },
                  subscription: {
                    actions: ["write"],
                  },
                },
              ],

              sfuBots: [
                {
                  actions: ["write"],
                  forwardings: [{ actions: ["write"] }],
                },
              ],
            },
          ],
        },
      },
    }).encode(process.env.SKY_WAY_SECRET!);

  return <Client token={token} />;
}
