import "server-only";

import { cache } from "react"
import { auth } from "@/auth";

export const getCurentUser = cache(async () => {
    const session = await auth();
    if (!session) return undefined;
    return session.user;
});