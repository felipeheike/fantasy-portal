import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }

    const userId = (session.user as any).id;
    const clientId = process.env.SPOTIFY_CLIENT_ID || "";
    
    // Construct redirect URI prioritizing SPOTIFY_REDIRECT_URI, then NEXTAUTH_URL, then request headers
    let redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    if (!redirectUri) {
      if (process.env.NEXTAUTH_URL) {
        const baseUrl = process.env.NEXTAUTH_URL.replace(/\/$/, "");
        redirectUri = `${baseUrl}/api/audio/spotify/callback`;
      } else {
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '127.0.0.1:25039';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        redirectUri = `${protocol}://${host}/api/audio/spotify/callback`;
      }
    }

    const scopes = "user-read-playback-state user-modify-playback-state user-read-currently-playing streaming user-read-email user-read-private";

    if (!clientId) {
      return new Response("SPOTIFY_CLIENT_ID is not configured in env.", { status: 500 });
    }

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${userId}`;

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
