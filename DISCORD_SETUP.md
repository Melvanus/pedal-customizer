# Discord Order System Setup

## Quick Setup (2 minutes)

### 1. Create Discord Webhook

1. Open your Discord server
2. Create a channel for orders (e.g., `#pedal-orders`)
3. Right-click the channel → **Edit Channel** → **Integrations**
4. Click **"Create Webhook"** (or "View Webhooks" if you have others)
5. Click **"New Webhook"**
6. Give it a name: `Pedal Orders`
7. (Optional) Upload a custom avatar
8. Click **"Copy Webhook URL"**

### 2. Add Webhook to Project

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and paste your webhook URL:
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890/your-webhook-token
```

3. Restart your dev server:
```bash
npm run dev
```

### 3. Test It!

1. Go to your customizer
2. Complete a configuration
3. Fill out the summary page
4. Click "Submit Order"
5. Check your Discord channel!

## What You'll Get

Orders appear in Discord as formatted embeds with:
- ✅ Customer name & email
- ✅ All product selections
- ✅ Modifications
- ✅ Total price
- ✅ Special notes
- ✅ Timestamp

## Benefits

- 📱 **Instant notifications** on phone & desktop
- 💬 **Reply directly** to customers from Discord
- 📋 **Order history** automatically saved
- 🏷️ **Add reactions** to track status (✅ ✉️ 📦 ✔️)
- 👥 **Share with team** - just invite them to the channel
- 🆓 **Completely free** - no limits

## Development Mode

In development (`npm run dev`), orders are only logged to console, not sent to Discord.

To test the actual Discord webhook in development, temporarily comment out lines 14-30 in `src/app/api/submit-order/route.ts`.

## Security

✅ Webhook URL is stored in `.env.local` (git ignored)  
✅ Never exposed to the client  
✅ Only you and your Discord server can see orders  
✅ Can regenerate webhook URL anytime if compromised

## Managing Orders in Discord

**Track status with reactions:**
- 👀 Seen
- ✉️ Email sent
- 🔨 In production
- 📦 Shipped
- ✅ Completed

**Pin important orders:**
- Right-click message → Pin Message

**Search orders:**
- Use Discord search: `from:Pedal Orders customer name`

## Troubleshooting

**"Order submission not configured" error:**
- Make sure `.env.local` file exists
- Verify `DISCORD_WEBHOOK_URL` is set correctly
- Restart dev server after adding environment variables

**Webhook not working:**
- Test the webhook URL with curl:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"content":"Test message"}' \
  YOUR_WEBHOOK_URL
```
- Check webhook still exists in Discord settings
- Verify bot has permission to post in channel

**Orders not showing up:**
- Check you're looking at the correct channel
- Verify webhook hasn't been deleted
- Check browser console for errors

## Production Deployment

When deploying to Vercel/Netlify/etc.:

1. Add `DISCORD_WEBHOOK_URL` to your hosting provider's environment variables
2. Make sure `.env.local` is in `.gitignore` (it already is)
3. Don't commit your webhook URL to git
4. You can use a different webhook for production vs development

## Alternative: Multiple Webhooks

Want separate channels for dev/staging/production?

```env
# Development orders
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/.../dev-orders

# Production orders (set in hosting dashboard)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/.../prod-orders
```
