import { postWaitlistedUser } from './post_waitlisted_user';

export async function POST(req: Request) {
    const data = await postWaitlistedUser();
    return Response.json(data, { status: 201 });
}
