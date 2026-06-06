import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { encrypt, decrypt, maskKey, generateMfaSecret, generateQrCode, verifyMfaCode } from "@/lib/security";
import bcrypt from "bcrypt";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const isAdmin = (session.user as any).role === 'ADMIN';

    // Se um ID foi solicitado e quem pede é ADMIN, usamos o ID alvo. 
    // Caso contrário, usamos o ID da própria sessão.
    const userId = (requestedUserId && isAdmin) ? requestedUserId : (session.user as any).id;

    const player = await prisma.player.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        apiKeys: true,
        apiEnabled: true,
        aiPreferences: true,
        usageStats: true,
        mfaEnabled: true,
      }
    });

    if (!player) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Descriptografar e mascarar chaves para o front
    const rawKeys = (player.apiKeys as any) || {};
    const maskedKeys: Record<string, string> = {};
    
    Object.keys(rawKeys).forEach(provider => {
      const encryptedValue = rawKeys[provider];
      if (encryptedValue && typeof encryptedValue === 'string') {
        const decrypted = decrypt(encryptedValue);
        maskedKeys[provider] = decrypted ? maskKey(decrypted) : '';
      }
    });

    return NextResponse.json({
      id: player.id,
      email: player.email,
      name: player.name,
      role: player.role,
      apiKeys: maskedKeys,
      apiEnabled: player.apiEnabled || {},
      aiPreferences: player.aiPreferences || {},
      usageStats: player.usageStats || {},
      mfaEnabled: player.mfaEnabled,
      isImpersonated: userId !== (session.user as any).id
    });
  } catch (error: any) {
    console.error('PROFILE_GET_ERR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { name, currentPassword, newPassword, apiKeys, apiEnabled, aiPreferences, mfaAction, mfaToken, targetUserId } = body;
    
    const isAdmin = (session.user as any).role === 'ADMIN';
    const userId = (targetUserId && isAdmin) ? targetUserId : (session.user as any).id;

    const player = await prisma.player.findUnique({ where: { id: userId } });
    if (!player) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const updateData: any = {};

    // 1. Atualizar Nome
    if (name) updateData.name = name;

    // 2. Trocar Senha (Só permitida para o próprio usuário ou Admin sem checar senha atual)
    if (newPassword) {
      const isSelf = userId === (session.user as any).id;
      if (isSelf) {
        if (!currentPassword) return NextResponse.json({ error: "Senha atual obrigatória" }, { status: 400 });
        const isValid = await bcrypt.compare(currentPassword, player.passwordHash || '');
        if (!isValid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
      }
      // Se for Admin trocando de outro, pula a validação de currentPassword
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      updateData.forcePasswordChange = false;
    }

    // 3. Atualizar API Keys (BYOK)
    if (apiKeys) {
      const currentKeys = (player.apiKeys as any) || {};
      const newKeys = { ...currentKeys };
      
      Object.entries(apiKeys).forEach(([provider, value]) => {
        const val = value as string;
        if (val === '') {
          delete newKeys[provider]; // Remover chave
        } else if (!val.includes('...')) { 
          // Só atualiza se não for a versão mascarada que enviamos no GET
          newKeys[provider] = encrypt(val);
        }
      });
      updateData.apiKeys = newKeys;
    }

    // 3.1. Atualizar API Enabled (Toggles)
    if (apiEnabled) {
      updateData.apiEnabled = apiEnabled;
    }

    // 4. Preferências de IA
    if (aiPreferences) {
      updateData.aiPreferences = aiPreferences;
    }

    // 5. Lógica de MFA (Setup/Enable/Disable)
    if (mfaAction === 'SETUP') {
      const { secret, otpauth } = generateMfaSecret(player.email);
      const qrCode = await generateQrCode(otpauth);
      // Salva o secret temporariamente (criptografado)
      await prisma.player.update({
        where: { id: userId },
        data: { mfaSecret: encrypt(secret) }
      });
      return NextResponse.json({ qrCode });
    }

    if (mfaAction === 'ENABLE') {
      if (!mfaToken) return NextResponse.json({ error: "Token MFA obrigatório" }, { status: 400 });
      const decryptedSecret = decrypt(player.mfaSecret || '');
      const isValid = verifyMfaCode(mfaToken, decryptedSecret);
      if (!isValid) return NextResponse.json({ error: "Código MFA inválido" }, { status: 400 });
      updateData.mfaEnabled = true;
    }

    if (mfaAction === 'DISABLE') {
      if (!mfaToken) return NextResponse.json({ error: "Token MFA obrigatório" }, { status: 400 });
      const decryptedSecret = decrypt(player.mfaSecret || '');
      if (!decryptedSecret) return NextResponse.json({ error: "MFA não configurado" }, { status: 400 });
      const isValid = verifyMfaCode(mfaToken, decryptedSecret);
      if (!isValid) return NextResponse.json({ error: "Código MFA inválido" }, { status: 400 });
      updateData.mfaEnabled = false;
      updateData.mfaSecret = null;
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, mfaEnabled: true }
    });

    return NextResponse.json(updatedPlayer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
