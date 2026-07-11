# Variables d'environnement — configuration pour Seeker-Spy-Seeker

Ne commitez PAS vos clés API ou tokens. Copiez `.env.template` en `.env` ou configurez les variables dans votre environnement de déploiement / Secrets GitHub.

Variables requises
- BRIXHUB_API_KEY — clé API BRIX (ex: brix_Wz3...)
- TELEGRAM_BOT_TOKEN — token du bot Telegram (ex: 8961403780:AAFz...)
- TELEGRAM_CHAT_ID — identifiant du chat (ex: 7808474075 ou -1001234567890 pour un groupe)

Tester localement
1. Copier et remplir les valeurs :
   cp .env.template .env
   # puis éditez .env et ajoutez vos valeurs

2. Lancer l'application (suivez les instructions existantes du projet, ex: `npm install && npm run dev` ou `bun dev`).

3. Tester l'envoi Telegram (script fourni):
   bash scripts/test-telegram.sh

Configurer GitHub Actions / Déploiement
- Ajoutez les mêmes variables en tant que Secrets du dépôt (Settings → Secrets and variables → Actions) : BRIXHUB_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- Injectez-les dans vos workflows via `env:`.

Sécurité et bonnes pratiques
- Ne pas committer `.env`.
- Limiter la quantité d'informations envoyées sur Telegram (résumés seulement).
- Gérer le rate-limiting pour éviter de spammer le bot.
