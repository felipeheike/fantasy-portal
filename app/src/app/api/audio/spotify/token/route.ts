import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/security";

async function refreshSpotifyToken(userId: string, encryptedRefreshToken: string, currentKeys: any) {
  const refreshToken = decrypt(encryptedRefreshToken);
  const clientId = process.env.SPOTIFY_CLIENT_ID || "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Failed to refresh token: ${errText}`);
  }

  const tokenData = await tokenResponse.json();
  const nextAccessToken = tokenData.access_token;
  const nextExpiresIn = tokenData.expires_in;

  const updatedKeys = {
    ...currentKeys,
    spotifyAccessToken: encrypt(nextAccessToken),
    spotifyTokenExpiresAt: Date.now() + nextExpiresIn * 1000
  };

  if (tokenData.refresh_token) {
    updatedKeys.spotifyRefreshToken = encrypt(tokenData.refresh_token);
  }

  await prisma.player.update({
    where: { id: userId },
    data: { apiKeys: updatedKeys }
  });

  return nextAccessToken;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const player = await prisma.player.findUnique({
      where: { id: userId },
      select: { apiKeys: true }
    });

    const apiKeys = (player?.apiKeys as any) || {};
    const encryptedAccessToken = apiKeys.spotifyAccessToken;
    const encryptedRefreshToken = apiKeys.spotifyRefreshToken;
    const expiresAt = Number(apiKeys.spotifyTokenExpiresAt || 0);

    if (!encryptedAccessToken || !encryptedRefreshToken) {
      return NextResponse.json({ error: "Spotify não conectado" }, { status: 400 });
    }

    let accessToken = '';

    // Check if token is expired or close to it
    if (Date.now() >= expiresAt - 60000) {
      try {
        accessToken = await refreshSpotifyToken(userId, encryptedRefreshToken, apiKeys);
      } catch (err: any) {
        return NextResponse.json({ error: "Falha ao renovar conexão com o Spotify" }, { status: 401 });
      }
    } else {
      accessToken = decrypt(encryptedAccessToken) || '';
    }

    return NextResponse.json({ accessToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
