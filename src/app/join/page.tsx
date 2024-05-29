import Client from '@/components/client';
import { SkyWayAuthToken, nowInSec, uuidV4 } from '@skyway-sdk/token';
import { postMatching } from '../api/match/post_matching';
import { postWaitlistedUser } from '../api/waitlisted-users/post_waitlisted_user';

export default async function Home() {
    const token = new SkyWayAuthToken({
        jti: uuidV4(),
        iat: nowInSec(),
        exp: nowInSec() + 60 * 60 * 24,
        scope: {
            app: {
                id: process.env.SKY_WAY_APP_ID!,
                turn: true,
                actions: ['read'],
                channels: [
                    {
                        id: '*',
                        name: '*',
                        actions: ['write'],
                        members: [
                            {
                                id: '*',
                                name: '*',
                                actions: ['write'],
                                publication: {
                                    actions: ['write'],
                                },
                                subscription: {
                                    actions: ['write'],
                                },
                            },
                        ],

                        sfuBots: [
                            {
                                actions: ['write'],
                                forwardings: [{ actions: ['write'] }],
                            },
                        ],
                    },
                ],
            },
        },
    }).encode(process.env.SKY_WAY_SECRET!);

    const channel = await postMatching();
    const props = channel ? { channel } : await postWaitlistedUser()

    return <Client token={token} {...props} />;
}
