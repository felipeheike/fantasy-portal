-- CreateTable
CREATE TABLE "LocalGenerationConfig" (
    "id" TEXT NOT NULL,
    "imageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "textEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ttsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ttsEngine" TEXT NOT NULL DEFAULT 'kokoro',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalGenerationConfig_pkey" PRIMARY KEY ("id")
);
