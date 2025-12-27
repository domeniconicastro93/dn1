-- CreateTable
CREATE TABLE "steam_link_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "redirect" TEXT NOT NULL DEFAULT '/games',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "steam_link_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "steam_link_sessions_user_id_idx" ON "steam_link_sessions"("user_id");

-- CreateIndex
CREATE INDEX "steam_link_sessions_expires_at_idx" ON "steam_link_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "steam_link_sessions" ADD CONSTRAINT "steam_link_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
