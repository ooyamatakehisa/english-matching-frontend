import { postWaitlistedUser } from './post_waitlisted_user';

export async function POST(req: Request) {
    const res = await req.json()
    const data = await postWaitlistedUser(res.unauthenticatedUserId);
    return Response.json(data, { status: 201 });
}
