import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/security";

// Function to refresh Spotify access token
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

  // Save new access token
  const updatedKeys = {
    ...currentKeys,
    spotifyAccessToken: encrypt(nextAccessToken),
    spotifyTokenExpiresAt: Date.now() + nextExpiresIn * 1000
  };

  // Optional: Update refresh token if a new one is returned
  if (tokenData.refresh_token) {
    updatedKeys.spotifyRefreshToken = encrypt(tokenData.refresh_token);
  }

  await prisma.player.update({
    where: { id: userId },
    data: { apiKeys: updatedKeys }
  });

  return nextAccessToken;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { contextUri, deviceId } = await req.json();
    if (!contextUri) {
      return NextResponse.json({ error: "Context URI is required" }, { status: 400 });
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
      return NextResponse.json({ error: "Spotify não conectado" }, { status: 401 });
    }

    let accessToken = '';

    // Check if token is expired (using 1 minute safety buffer)
    if (Date.now() >= expiresAt - 60000) {
      console.log('LOG: Spotify token expired. Refreshing...');
      try {
        accessToken = await refreshSpotifyToken(userId, encryptedRefreshToken, apiKeys);
      } catch (err: any) {
        console.error('LOG: Failed to refresh Spotify token:', err);
        return NextResponse.json({ error: "Falha ao renovar conexão com o Spotify. Por favor, conecte novamente." }, { status: 401 });
      }
    } else {
      accessToken = decrypt(encryptedAccessToken) || '';
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Erro de descriptografia do token do Spotify" }, { status: 500 });
    }

    // Call Spotify play player API
    const playUrl = deviceId 
      ? `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`
      : 'https://api.spotify.com/v1/me/player/play';

    const spotifyPlayRes = await fetch(playUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context_uri: contextUri
      })
    });

    if (spotifyPlayRes.ok) {
      return NextResponse.json({ success: true });
    }

    // If play request fails, capture why
    const status = spotifyPlayRes.status;
    let errMessage = 'Erro desconhecido no Spotify';
    try {
      const errBody = await spotifyPlayRes.json();
      errMessage = errBody.error?.message || errMessage;
    } catch (_) {
      // Body may not be JSON
    }

    // Handle standard "No active device" error
    if (status === 404) {
      return NextResponse.json({ 
        error: "Dispositivo ativo não encontrado", 
        code: "NO_ACTIVE_DEVICE",
        details: "Abra o aplicativo do Spotify em seu aparelho e dê 'play' em qualquer música para ativá-lo."
      }, { status: 404 });
    }

    if (status === 403) {
      return NextResponse.json({
        error: "Permissão negada no Spotify",
        code: "NOT_PREMIUM",
        details: "O controle de reprodução da API do Spotify exige uma assinatura do Spotify Premium."
      }, { status: 403 });
    }

    return NextResponse.json({ error: errMessage }, { status });
  } catch (error: any) {
    console.error('!!! SPOTIFY PLAY FAILURE !!!', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
