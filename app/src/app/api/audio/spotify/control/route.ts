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

async function getAccessToken(userId: string) {
  const player = await prisma.player.findUnique({
    where: { id: userId },
    select: { apiKeys: true }
  });

  const apiKeys = (player?.apiKeys as any) || {};
  const encryptedAccessToken = apiKeys.spotifyAccessToken;
  const encryptedRefreshToken = apiKeys.spotifyRefreshToken;
  const expiresAt = Number(apiKeys.spotifyTokenExpiresAt || 0);

  if (!encryptedAccessToken || !encryptedRefreshToken) {
    throw new Error("Spotify não conectado");
  }

  if (Date.now() >= expiresAt - 60000) {
    return await refreshSpotifyToken(userId, encryptedRefreshToken, apiKeys);
  }

  return decrypt(encryptedAccessToken) || '';
}

// GET: Get currently playing state
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    let accessToken;
    try {
      accessToken = await getAccessToken(userId);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    const spotifyRes = await fetch('https://api.spotify.com/v1/me/player', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (spotifyRes.status === 204) {
      return NextResponse.json({ isPlaying: false, active: false });
    }

    if (!spotifyRes.ok) {
      const errText = await spotifyRes.text();
      return NextResponse.json({ error: `Spotify API error: ${errText}` }, { status: spotifyRes.status });
    }

    const data = await spotifyRes.json();
    return NextResponse.json({
      active: true,
      isPlaying: data.is_playing,
      progressMs: data.progress_ms,
      volumePercent: data.device?.volume_percent || 50,
      deviceName: data.device?.name || '',
      deviceId: data.device?.id || '',
      repeatState: data.repeat_state || 'off',
      shuffleState: data.shuffle_state || false,
      item: data.item ? {
        id: data.item.id,
        name: data.item.name,
        artists: data.item.artists?.map((a: any) => a.name).join(', ') || '',
        albumArt: data.item.album?.images?.[0]?.url || '',
        durationMs: data.item.duration_ms
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Execute a playback control action
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { action, volume, deviceId, state } = await req.json();
    const userId = (session.user as any).id;
    let accessToken;
    try {
      accessToken = await getAccessToken(userId);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    let url = '';
    let method = 'POST';
    let body: any = null;

    const queryParams = deviceId ? `?device_id=${deviceId}` : '';

    if (action === 'play') {
      url = `https://api.spotify.com/v1/me/player/play${queryParams}`;
      method = 'PUT';
    } else if (action === 'pause') {
      url = `https://api.spotify.com/v1/me/player/pause${queryParams}`;
      method = 'PUT';
    } else if (action === 'next') {
      url = `https://api.spotify.com/v1/me/player/next${queryParams}`;
      method = 'POST';
    } else if (action === 'previous') {
      url = `https://api.spotify.com/v1/me/player/previous${queryParams}`;
      method = 'POST';
    } else if (action === 'volume') {
      const volumeQuery = deviceId ? `&device_id=${deviceId}` : '';
      url = `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}${volumeQuery}`;
      method = 'PUT';
    } else if (action === 'repeat') {
      const repeatQuery = deviceId ? `&device_id=${deviceId}` : '';
      url = `https://api.spotify.com/v1/me/player/repeat?state=${state}${repeatQuery}`;
      method = 'PUT';
    } else if (action === 'shuffle') {
      const shuffleQuery = deviceId ? `&device_id=${deviceId}` : '';
      url = `https://api.spotify.com/v1/me/player/shuffle?state=${state}${shuffleQuery}`;
      method = 'PUT';
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const spotifyRes = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : null
    });

    if (spotifyRes.ok) {
      return NextResponse.json({ success: true });
    }

    const status = spotifyRes.status;
    let errMsg = 'Erro desconhecido no controle do Spotify';
    try {
      const errBody = await spotifyRes.json();
      errMsg = errBody.error?.message || errMsg;
    } catch (_) {}

    return NextResponse.json({ error: errMsg }, { status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
