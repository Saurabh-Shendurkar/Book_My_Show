export interface RenderConsentOptions {
  appName: string;
  appLogoUrl?: string | null;
  appUrl?: string;
  userSupportEmail?: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  } | null;
  errorMessage?: string;
}

export function renderConsentPage(options: RenderConsentOptions): string {
  const {
    appName,
    appLogoUrl,
    clientId,
    redirectUri,
    scope,
    state = "",
    nonce = "",
    codeChallenge = "",
    codeChallengeMethod = "",
    user,
    errorMessage,
  } = options;

  const scopesList = scope.split(" ").filter(Boolean);
  const scopeDescriptions: Record<string, { label: string; desc: string; icon: string }> = {
    openid: {
      label: "OpenID Identity",
      desc: "Confirm and authenticate your Book_My_Show identity",
      icon: "🔑",
    },
    profile: {
      label: "Profile Information",
      desc: "Access your first name, last name, and account details",
      icon: "👤",
    },
    email: {
      label: "Email Address",
      desc: "View your verified email address",
      icon: "✉️",
    },
    phone: {
      label: "Phone Number",
      desc: "View your registered phone number for booking updates",
      icon: "📱",
    },
    offline_access: {
      label: "Offline Access",
      desc: "Stay signed in and maintain access when you are offline",
      icon: "🔄",
    },
  };

  const cancelUrl = `${redirectUri}${redirectUri.includes("?") ? "&" : "?"}error=access_denied&error_description=User+denied+access${state ? `&state=${encodeURIComponent(state)}` : ""}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ${appName} - Book_My_Show Single Sign-On</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: rgba(30, 41, 59, 0.85);
      --border: rgba(148, 163, 184, 0.15);
      --primary: #f43f5e;
      --primary-hover: #e11d48;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --card-inner: #0f172a;
      --badge-bg: rgba(244, 63, 94, 0.12);
      --badge-text: #fb7185;
      --error-bg: rgba(239, 68, 68, 0.15);
      --error-border: rgba(239, 68, 68, 0.3);
      --error-text: #fca5a5;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    body {
      background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg) 70%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .container {
      width: 100%;
      max-width: 480px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    .header {
      text-align: center;
      margin-bottom: 28px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 20px;
    }

    .brand-icon {
      font-size: 18px;
    }

    .auth-exchange {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .app-avatar, .provider-avatar {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.3);
    }

    .provider-avatar {
      background: linear-gradient(135deg, #e11d48, #be123c);
      color: white;
    }

    .app-avatar {
      background: #334155;
      color: #38bdf8;
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .app-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .arrow-icon {
      color: var(--text-muted);
      font-size: 20px;
    }

    .title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #fff;
    }

    .subtitle {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .app-highlight {
      color: #38bdf8;
      font-weight: 600;
    }

    .alert {
      background: var(--error-bg);
      border: 1px solid var(--error-border);
      color: var(--error-text);
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-pill {
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .user-email {
      font-size: 12px;
      color: var(--text-muted);
    }

    .verified-badge {
      font-size: 11px;
      font-weight: 600;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      padding: 4px 8px;
      border-radius: 9999px;
    }

    .scope-section {
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 24px;
    }

    .scope-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .scope-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .scope-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .scope-icon {
      font-size: 16px;
      line-height: 1.2;
    }

    .scope-text {
      flex: 1;
    }

    .scope-label {
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 2px;
    }

    .scope-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .form-input {
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 14px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.2);
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      flex: 1;
      padding: 13px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
    }

    .btn-primary {
      background: var(--primary);
      color: #fff;
      box-shadow: 0 4px 14px rgba(244, 63, 94, 0.35);
    }

    .btn-primary:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(148, 163, 184, 0.1);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover {
      background: rgba(148, 163, 184, 0.18);
      color: #fff;
    }

    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .footer a {
      color: var(--primary);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <span class="brand-icon">🎬</span>
        <span>Book_My_Show Identity</span>
      </div>

      <div class="auth-exchange">
        <div class="provider-avatar" title="Book_My_Show">BMS</div>
        <div class="arrow-icon">⇄</div>
        <div class="app-avatar" title="${appName}">
          ${appLogoUrl ? `<img src="${appLogoUrl}" alt="${appName}" />` : appName.charAt(0).toUpperCase()}
        </div>
      </div>

      <h1 class="title">Authorize <span class="app-highlight">${appName}</span></h1>
      <p class="subtitle">This application wants to connect to your Book_My_Show account.</p>
    </div>

    ${errorMessage ? `<div class="alert">⚠️ <span>${errorMessage}</span></div>` : ""}

    <form method="POST" action="/oauth/authorize">
      <!-- Hidden OIDC parameters -->
      <input type="hidden" name="client_id" value="${clientId}" />
      <input type="hidden" name="redirect_uri" value="${redirectUri}" />
      <input type="hidden" name="scope" value="${scope}" />
      <input type="hidden" name="state" value="${state}" />
      <input type="hidden" name="nonce" value="${nonce}" />
      <input type="hidden" name="code_challenge" value="${codeChallenge}" />
      <input type="hidden" name="code_challenge_method" value="${codeChallengeMethod}" />

      ${
        user
          ? `
        <div class="user-pill">
          <div class="user-info">
            <span class="user-name">${user.name || "Authenticated User"}</span>
            <span class="user-email">${user.email}</span>
          </div>
          <span class="verified-badge">Signed In</span>
        </div>
      `
          : `
        <div class="login-form">
          <div class="form-group">
            <label class="form-label" for="email">Book_My_Show Email</label>
            <input class="form-input" type="email" id="email" name="email" placeholder="name@example.com" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input class="form-input" type="password" id="password" name="password" placeholder="••••••••" required />
          </div>
        </div>
      `
      }

      <div class="scope-section">
        <div class="scope-title">Permissions Requested</div>
        <div class="scope-list">
          ${scopesList
            .map((s) => {
              const info = scopeDescriptions[s] || {
                label: s,
                desc: `Grants access to ${s} permission`,
                icon: "🔒",
              };
              return `
              <div class="scope-item">
                <span class="scope-icon">${info.icon}</span>
                <div class="scope-text">
                  <div class="scope-label">${info.label}</div>
                  <div class="scope-desc">${info.desc}</div>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>

      <div class="actions">
        <a href="${cancelUrl}" class="btn btn-secondary">Cancel</a>
        <button type="submit" name="consent" value="allow" class="btn btn-primary">
          ${user ? "Allow Access" : "Sign In & Authorize"}
        </button>
      </div>
    </form>

    <div class="footer">
      Secured by <a href="/">Book_My_Show OpenID Provider</a>. Redirecting to <code style="color:#94a3b8">${redirectUri}</code>.
    </div>
  </div>
</body>
</html>`;
}
