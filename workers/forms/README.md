# Rosenkranz form service

The Worker accepts contact and test-drive inquiries, sends an internal HTML email through Resend, and can send a customer confirmation only in the production environment. It does not store form submissions. The request is validated and HTML-escaped before email delivery.

## One-time account setup

1. In Resend, verify `automobile-rosenkranz.de`. Add the exact DNS records Resend provides in IONOS. Keep IONOS MX records for incoming mail; do not create duplicate SPF records.
2. Create a Cloudflare API token with Workers Scripts edit and account settings read access. Do not put it in the repository or chat.
3. In GitHub repository Settings → Secrets and variables → Actions, add `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `RESEND_API_KEY`. Do not place these values in the repository or chat. The staging workflow uploads the Resend key to the Worker as an encrypted secret.
4. Run Actions → Deploy Rosenkranz forms Worker → Run workflow. This workflow deploys staging only. The staging origin is the public GitHub Pages preview, email notifications go to `anfragen@automobile-rosenkranz.de`, and customer auto-replies remain off.
5. Copy the deployed staging Worker URL and add `/submit`. Put that URL as the `endpoint` value in the root `forms-config.json`, then publish. The form UI will remain in setup mode until that endpoint is configured.
6. Submit test inquiries using a mailbox you control. Confirm the internal notification arrives at `anfragen@` and that staging does not send confirmation messages to customers.

The production configuration is prepared but is not deployed by this workflow. Before production, switch the website to IONOS, add an IONOS-specific origin to the Worker, enable the production Resend secret and customer confirmation, configure edge rate limiting, then run a separately reviewed production deployment.
