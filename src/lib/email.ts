import nodemailer from 'nodemailer';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 54325),
  secure: false,
  // No auth needed for Mailpit / dev. Add user/pass for production SMTP.
});

type Brand = 'phpro' | '25carat';

// PHPro logo with white "PH" (for dark header background)
const PHPRO_LOGO_SVG = `<svg width="122" height="42" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 841.89 300"><defs><style>.a{fill:#fff}.b{fill:#bdd431}.c{fill:#bcd631}</style></defs><path class="a" d="M173,114.1c0,53.52-19.6,64.38-77.63,64.38H62.54v70c0,3.44-.79,4.23-4,4.23H24.92c-3.18,0-4-.79-4-4.23V52.63c0-2.91.8-3.44,4-3.71C48.23,46.81,73.67,46,95.39,46,153.42,46,173,61.11,173,114.1ZM62.54,82.31v64.11H91.16c31.52,0,39.74-4.24,39.74-31.26,0-26.49-8.22-32.85-39.74-32.85Z"/><path class="a" d="M353.18,47.6c2.65,0,4,1.32,4,4.24V248.43c0,2.91-1.33,4.23-4,4.23H319.54c-2.65,0-4-1.32-4-4.23v-80H227.87v80c0,2.91-1.33,4.23-4,4.23H190.25c-2.65,0-4-1.32-4-4.23V51.84c0-2.92,1.33-4.24,4-4.24h33.64c2.65,0,4,1.32,4,4.24v79.75h87.69V51.84c0-2.92,1.33-4.24,4-4.24Z"/><path class="b" d="M533.61,114.1c0,53.52-19.61,64.38-77.63,64.38H423.13v70c0,3.44-.8,4.23-4,4.23H385.51c-3.18,0-4-.79-4-4.23V52.63c0-2.91.8-3.44,4-3.71C408.82,46.81,434.26,46,456,46,514,46,533.61,61.11,533.61,114.1ZM423.13,82.31v64.11h28.61c31.53,0,39.74-4.24,39.74-31.26,0-26.49-8.21-32.85-39.74-32.85Z"/><path class="b" d="M626.61,105.89c2.91.79,4.23,1.85,4.23,5.3v21.72c0,2.65-1.59,4-4.5,4h-24.9c-13.78,0-18.55,2.12-18.55,13.51v98c0,2.91-1.33,4.23-4,4.23H547.39c-2.65,0-4-1.32-4-4.23V140.33c0-33.38,23.85-37.36,48-37.36C599.05,103,617.33,103.77,626.61,105.89Z"/><path class="b" d="M764.64,178.48c0,60.41-12.45,75.51-67.56,75.51-54.84,0-67.56-15.1-67.56-75.51,0-60.67,12.72-75.51,67.56-75.51C752.19,103,764.64,117.81,764.64,178.48Zm-95.64,0c0,33.38,4,41.6,28.08,41.6,24.38,0,28.35-8.22,28.35-41.6s-4-41.59-28.35-41.59C673,136.89,669,145.1,669,178.48Z"/><g><path class="c" d="M777.43,107.59a6.39,6.39,0,0,0,6.39,6.39h6.78a6.39,6.39,0,0,0,6.39-6.39V90H777.43Z"/><path class="c" d="M797,52.9a6.39,6.39,0,0,0-6.39-6.39h-6.78a6.39,6.39,0,0,0-6.39,6.39V70.46H797Z"/><path class="c" d="M814.6,70.46H797V90H814.6a6.35,6.35,0,0,0,6.34-6.35V76.81A6.34,6.34,0,0,0,814.6,70.46Z"/><path class="c" d="M759.86,70.46a6.38,6.38,0,0,0-6.38,6.38v6.8A6.38,6.38,0,0,0,759.86,90h17.57V70.46Z"/></g></svg>`;

// 25Carat wordmark in gold
const CARAT_LOGO_SVG = `<svg width="164" height="53" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 164 53" fill="none"><g clip-path="url(#c)"><path d="M124.973 52.248h8.031l-10.397-26.782h-8.119l10.485 26.782Z" fill="#C5A053"/><path d="M116.381 40.651l-4.54 11.597h-8.083l4.507-11.597h8.116Z" fill="#C5A053"/><path d="M56.615 52.248h8.028L54.246 25.466h-8.119l10.488 26.782Z" fill="#C5A053"/><path d="M48.021 40.651l-4.539 11.597h-8.088l4.508-11.597h8.119Z" fill="#C5A053"/><path d="M148.204 31.173h-9.72v-5.707h25.517v5.707h-9.72v21.075h-6.077V31.173Z" fill="#C5A053"/><path d="M13.24 45.031c-4.48 0-6.921-3.872-6.921-7.907 0-4.035 2.397-7.952 6.921-7.952 3.313 0 5.662 2.196 6.546 5.098h6.447c-1.111-6.076-5.81-10.976-12.997-10.976C4.802 23.218 0 30.033 0 37.124c0 7.091 4.802 13.939 13.24 13.939 7.084 0 11.767-4.879 12.953-10.883h-6.474c-.932 2.793-3.241 4.851-6.479 4.851Z" fill="#C5A053"/><path d="M72.842 23.624h9.994c1.78 0 3.357.26 4.735.783 1.373.524 2.54 1.23 3.5 2.119.96.889 1.681 1.928 2.166 3.117.486 1.19.729 2.464.729 3.824 0 1.859-.434 3.568-1.294 5.139-.864 1.567-2.198 2.76-4.006 3.568l6.152 10.078h-7.972l-6.96-12.315v12.315h-7.044V23.624Zm7.04 6.271v7.529h2.425c.756 0 1.41-.11 1.963-.337.55-.22 1.02-.508 1.394-.861.378-.353.661-.763.848-1.234.191-.471.283-.954.283-1.453 0-1.177-.378-2.078-1.135-2.707-.756-.629-1.875-.942-3.36-.942h-2.418v.005Z" fill="#C5A053"/><path d="M42.743 1.624H40.967V0h5.196v1.624h-1.76v5.646h-1.66V1.624Z" fill="#C5A053"/><path d="M48.369 0h1.728l1.115 4.42L52.427 0h1.688l1.223 4.44L56.441 0h1.7l-1.963 7.27h-1.68L53.267 2.768l-1.21 4.502h-1.72L48.369 0Z" fill="#C5A053"/><path d="M60.367 0H64.6v1.616h-2.533v1.193H64.6v1.615h-2.533v1.234H64.6v1.616h-4.233V0Z" fill="#C5A053"/><path d="M67 0h1.816l2.58 4.144V0h1.692v7.27h-1.692L68.692 2.918V7.27H67V0Z" fill="#C5A053"/><path d="M77.231 1.624h-1.776V0h5.197v1.624h-1.76v5.646h-1.661V1.624Z" fill="#C5A053"/><path d="M85.015 3.864L82.789 0h1.848l1.242 2.192L87.106 0h1.835l-2.218 3.884V7.27h-1.708V3.864Z" fill="#C5A053"/><path d="M94.815 0h4.073v1.616h-2.373v1.193h2.373v1.615h-2.373v2.849h-1.7V0Z" fill="#C5A053"/><path d="M103.048 0v7.27h-1.72V0h1.72Z" fill="#C5A053"/><path d="M105.295 0h1.768l1.417 4.542L109.858 0h1.748l-2.246 7.27h-1.76L105.295 0Z" fill="#C5A053"/><path d="M113.844 0h4.233v1.616h-2.533v1.193h2.533v1.615h-2.533v1.234h2.533v1.616h-4.233V0Z" fill="#C5A053"/></g><defs><clipPath id="c"><rect width="164" height="52.248" fill="#fff"/></clipPath></defs></svg>`;

const brandConfig: Record<
  Brand,
  {
    name: string;
    primary: string;
    headerBg: string;
    pageBg: string;
    footerBg: string;
    linkColor: string;
    url: string;
    logoSvg: string;
  }
> = {
  phpro: {
    name: 'PHPro',
    primary: '#bdd431',
    headerBg: '#1a1a1a',
    pageBg: '#f4f4f5',
    footerBg: '#fafafa',
    linkColor: '#7a8a1e',
    url: 'https://www.phpro.be',
    logoSvg: PHPRO_LOGO_SVG,
  },
  '25carat': {
    name: '25Carat',
    primary: '#C5A053',
    headerBg: '#1E2029',
    pageBg: '#f9f6ee',
    footerBg: '#f5edd8',
    linkColor: '#96782e',
    url: 'https://25carat.be',
    logoSvg: CARAT_LOGO_SVG,
  },
};

type SendEmailParams = {
  to: string;
  subject: string;
  body: string;
  from?: string;
  brand?: Brand;
};

function wrapInTemplate(body: string, brand: Brand): string {
  const b = brandConfig[brand];
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: ${b.pageBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .header { background: ${b.headerBg}; padding: 24px 32px; border-radius: 12px 12px 0 0; }
    .header img { height: 32px; display: block; }
    .content { background: #ffffff; padding: 32px; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7; }
    .content p { margin: 0 0 16px; line-height: 1.6; color: #27272a; font-size: 15px; }
    .content p:last-child { margin-bottom: 0; }
    .footer { background: ${b.footerBg}; padding: 20px 32px; border: 1px solid #e4e4e7; border-top: 0; border-radius: 0 0 12px 12px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #a1a1aa; }
    .footer a { color: ${b.linkColor}; text-decoration: none; font-weight: 500; }
    .divider { height: 1px; background: #e4e4e7; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="data:image/svg+xml;base64,${Buffer.from(b.logoSvg).toString('base64')}" alt="${b.name}" />
    </div>
    <div class="content">
      ${body
        .split('\n')
        .map((line) => `<p>${escapeHtml(line) || '&nbsp;'}</p>`)
        .join('\n      ')}
    </div>
    <div class="footer">
      <p>Verstuurd via <a href="${b.url}">${b.name}</a> CRM</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail({ to, subject, body, from, brand = 'phpro' }: SendEmailParams) {
  const b = brandConfig[brand];
  const sender = from ?? process.env.SMTP_FROM ?? `${b.name} CRM <noreply@${b.name.toLowerCase()}.be>`;

  const html = wrapInTemplate(body, brand);

  const info = await transporter.sendMail({
    from: sender,
    to,
    subject,
    text: body,
    html,
  });

  return { messageId: info.messageId };
}
