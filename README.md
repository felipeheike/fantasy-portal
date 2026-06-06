# 🌌 Fantasy Portal: Crônicas do Destino Infinito

**Fantasy Portal** é uma plataforma de RPG narrativo de próxima geração, alimentada por IA generativa e multimodal. Inspirado nos clássicos *gamebooks* (livros-jogo), o sistema expande a imersão tradicional através de inteligência artificial de ponta, permitindo jornadas infinitas e reativas a cada decisão do jogador.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Gemini-1.5_Pro-blue?style=for-the-badge&logo=google-gemini" alt="Gemini" />
  <img src="https://img.shields.io/badge/Prisma-PostgreSQL-336791?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

## ✨ Visão Geral
Este projeto nasceu da nostalgia dos livros-jogos clássicos (Série Kai, Lone Wolf) combinada com o poder da IA moderna. O objetivo é proporcionar uma experiência de leitura dinâmica, onde o mestre (IA) não apenas narra, mas reage taticamente, visualmente e auditivamente às ações do jogador.

## 🚀 Guia Rápido de Navegação
Explore a documentação detalhada para entender as camadas do sistema:

1.  **[Recursos e Funcionalidades](./docs/FEATURES.md)**: Conheça o sistema de Sorte, AI Vision, TTS e o Theme Hub.
2.  **[Instalação e Setup](./docs/SETUP.md)**: Como configurar suas chaves de API e subir os containers Docker.
3.  **[Comandos Úteis](./docs/COMMANDS.md)**: Atalhos do Makefile para gerenciamento de banco e logs.
4.  **[Arquitetura Técnica](./docs/ARCHITECTURE.md)**: Como o Next.js, MinIO e PostgreSQL trabalham em harmonia.

## 🛠️ Stack Tecnológica
*   **Frontend:** Next.js 15, Tailwind CSS, Framer Motion.
*   **Inteligência:** Google Gemini (Texto/Visão), OpenAI (DALL-E/TTS).
*   **Infraestrutura:** Docker, PostgreSQL, MinIO (S3 Local).
*   **Estado & Persistência:** Zustand e Prisma ORM.

## 🛡️ Segurança
O sistema conta com suporte nativo a **BYOK** (Bring Your Own Key) com chaves criptografadas em AES e proteção de perfil via **MFA (Multi-Factor Authentication)**.

---
*Este portal é um experimento de fusão entre tecnologia e narrativa clássica.*
