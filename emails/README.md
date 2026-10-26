# Scoop emails (EmailJS)

Scoop sends four emails to candidates, all from **one shared template** (`scoop-notification.html`). The app fills in the subject, heading, body, details box, optional note and button for each type, so there is one design to maintain, and it fits EmailJS plans that limit how many templates you can have.

| Email | Sent when | Subject | Button | Accent |
| --- | --- | --- | --- | --- |
| Application received | A candidate applies | We received your application for *{job}* | Track your application | Violet |
| Interview invite | HR schedules or reschedules an interview | Interview invitation: *{job}* at *{company}* | Join the interview room | Violet |
| Rejection | HR rejects an application (single or bulk) | Your application for *{job}* at *{company}* | Browse open roles | Ink |
| Offer | HR sends an offer | Your job offer from *{company}* 🎉 | Review and accept your offer | Green |

The interview invite shows the date, time and time zone, plus the length. The offer shows the salary and start date. HR's optional message appears in a "A note from …" box.

## Set it up (about 10 minutes)

1. **Create an EmailJS account** at https://dashboard.emailjs.com.
2. **Email Services → Add New Service.** Connect the inbox emails should come from (Gmail, Outlook, or SMTP for a company address), then copy the **Service ID**.
3. **Email Templates → Create New Template.**
   - **Content:** click *Edit content*, switch to the **Code** editor (`<>`), and paste the whole of `scoop-notification.html`.
   - **Settings** (right-hand panel):

     | Field | Value |
     | --- | --- |
     | Subject | `{{subject}}` |
     | To Email | `{{to_email}}` |
     | From Name | `{{from_name}}` |
     | From Email | leave *Use Default Email Address* ticked |
     | Reply To | `{{reply_to}}` |

   - Save, then copy the **Template ID**.
4. **Account → General:** copy your **Public Key**.
5. Add the three values to `.env.local` and restart `npm run dev`:
   ```
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   ```
6. **Test it:** apply to a job with your candidate account. The "Application received" email should arrive within a minute. In EmailJS, the **History** tab shows every send and any errors.

If you later want one email type to look different, create a second template and set its override variable (`NEXT_PUBLIC_EMAILJS_TEMPLATE_APPLICATION`, `_INTERVIEW`, `_REJECTION` or `_OFFER`). Any type without an override uses the shared template.

## Template variables

| Variable | Contains |
| --- | --- |
| `{{subject}}` | Email subject |
| `{{preheader}}` | Inbox preview line (hidden in the body) |
| `{{heading}}` | Big title, e.g. "You're invited to interview" |
| `{{first_name}}`, `{{to_name}}`, `{{to_email}}` | The candidate |
| `{{company_name}}`, `{{job_title}}` | The role |
| `{{from_name}}` | "Sarah K at Northwind Labs", or the company name |
| `{{reply_to}}` | The HR person's email, so replies reach them |
| `{{{message_html}}}` | Body paragraphs (built and HTML-escaped by Scoop) |
| `{{{details_html}}}` | Details box: interview time, offer salary… (may be empty) |
| `{{{note_html}}}` | HR's personal note (may be empty) |
| `{{button_label}}`, `{{action_url}}` | Call-to-action button and link |
| `{{accent_color}}` | Accent colour for this email type |
| `{{message}}` | Plain-text body, for text-only templates |
| `{{email_type}}` | `applicationReceived`, `interviewInvite`, `rejection` or `offer` |
| `{{site_url}}` | The site's address |

Triple braces `{{{…}}}` insert HTML as-is. Scoop escapes everything people type before building those values, so candidates' names and HR notes can't inject markup.

## Good to know

- **Limits:** EmailJS's free plan has a monthly email allowance and a cap on templates. Check your plan in the dashboard.
- **Deliverability:** a custom domain service (SMTP, or Gmail with your company domain) lands in inboxes more reliably than a personal Gmail.
- **Security:** EmailJS sends from the browser with a public key, which is how it's designed. In **Account → Security**, turn on the protections EmailJS offers for your account, such as allowed origins or rate limits, so others can't send through your template. For high volume, the next step is to send from a server route with EmailJS's private key.
