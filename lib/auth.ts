import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "backjoon_session";
const SESSION_DAYS = 30;

export type CurrentUser = {
    id: number;
    handle: string;
    email: string;
    name: string | null;
    role: string;
    score: number;
    rank: number;
    solvedCount: number;
    tags: string[];
};

function expiresAt() {
    const date = new Date();
    date.setDate(date.getDate() + SESSION_DAYS);
    return date;
}

export async function createAuthSession(userId: number) {
    const headerStore = await headers();
    const session = await prisma.authSession.create({
        data: {
            id: randomUUID(),
            userId,
            userAgent: headerStore.get("user-agent") ?? "",
            ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
            expiresAt: expiresAt(),
        },
    });

    return session;
}

export async function setAuthCookie(sessionId: string, expiry: Date) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: expiry,
    });
}

export async function clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!sessionId) {
        return null;
    }

    const session = await prisma.authSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
        if (session) {
            await prisma.authSession.delete({ where: { id: session.id } }).catch(() => null);
        }
        return null;
    }

    await prisma.authSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
    });

    return {
        id: session.user.id,
        handle: session.user.handle,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        score: session.user.score,
        rank: session.user.rank,
        solvedCount: session.user.solvedCount,
        tags: session.user.tags,
    };
}

export async function destroyCurrentSession() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (sessionId) {
        await prisma.authSession.delete({ where: { id: sessionId } }).catch(() => null);
    }

    await clearAuthCookie();
}
