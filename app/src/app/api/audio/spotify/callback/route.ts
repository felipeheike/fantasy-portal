import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/security";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // holds the userId

    if (!code || !state) {
      return new Response("Missing code or state parameters.", { status: 400 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID || "";
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
    
    // Construct redirect URI prioritizing SPOTIFY_REDIRECT_URI, then NEXTAUTH_URL, then request headers/fallbacks
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

    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      return new Response(`Failed to exchange code: ${errText}`, { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch current player apiKeys
    const player = await prisma.player.findUnique({
      where: { id: state }
    });

    if (!player) {
      return new Response("Player not found.", { status: 404 });
    }

    const currentKeys = (player.apiKeys as any) || {};
    const updatedKeys = {
      ...currentKeys,
      spotifyAccessToken: encrypt(access_token),
      spotifyRefreshToken: encrypt(refresh_token),
      spotifyTokenExpiresAt: Date.now() + expires_in * 1000
    };

    // Save tokens in database
    await prisma.player.update({
      where: { id: state },
      data: { apiKeys: updatedKeys }
    });

    // Return an HTML response that closes the popup and posts a message to the opener window
    const closeScriptHtml = `
      <html>
        <head>
          <title>Conectado ao Spotify</title>
          <style>
            body {
              background: #121212;
              color: #ffffff;
              font-family: sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .card {
              padding: 20px;
              border-radius: 8px;
              background: #181818;
              border: 1px solid #282828;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h3 style="color: #1DB954;">Conectado ao Spotify!</h3>
            <p>Fechando esta janela...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage("spotify-connected", "*");
            }
            setTimeout(() => {
              window.close();
            }, 1500);
          </script>
        </body>
      </html>
    `;
    
    return new Response(closeScriptHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
