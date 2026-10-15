function endpointFor(domain, path) {
  const origin = domain === 'lark' ? 'https://open.larksuite.com' : 'https://open.feishu.cn';
  return new URL(path, origin);
}

function jsonResponse(body, operation) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error(`${operation} returned a non-JSON response`);
  }
  if (body.code !== 0) {
    throw new Error(`${operation} failed: ${body.msg || `code ${body.code}`}`);
  }
  return body;
}

/** Validate freshly provisioned credentials and read the bot identity. */
export async function verifyFeishuApp({
  appId,
  appSecret,
  domain = 'feishu',
  httpInstance,
  timeoutMs = 15000,
}) {
  if (!appId || !appSecret) throw new Error('Feishu credentials are incomplete');
  if (!httpInstance || typeof httpInstance.request !== 'function') {
    throw new TypeError('Feishu verification requires an HTTP instance');
  }
  const tokenBody = jsonResponse(await httpInstance.request({
    method: 'POST',
    url: endpointFor(domain, '/open-apis/auth/v3/tenant_access_token/internal').href,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    data: { app_id: appId, app_secret: appSecret },
    signal: AbortSignal.timeout(timeoutMs),
    timeout: timeoutMs,
  }), 'Feishu authentication');
  if (!tokenBody.tenant_access_token) {
    throw new Error('Feishu authentication returned no tenant access token');
  }

  const botBody = jsonResponse(await httpInstance.request({
    method: 'GET',
    url: endpointFor(domain, '/open-apis/bot/v3/info/').href,
    headers: { authorization: `Bearer ${tokenBody.tenant_access_token}` },
    signal: AbortSignal.timeout(timeoutMs),
    timeout: timeoutMs,
  }), 'Feishu bot verification');
  const bot = botBody.bot ?? {};
  return Object.freeze({
    appId,
    name: bot.app_name ?? bot.bot_name ?? null,
    openId: bot.open_id ?? null,
    activated: bot.activate_status ?? null,
  });
}


/**
 * Best-effort post-creation configuration that registerApp cannot carry through
 * its public addons: long-connection mode and the desktop OAuth redirect URL.
 *
 * @param {object} input
 * @param {object} input.client - authenticated Lark SDK client.
 * @param {string} input.appId - created application id.
 * @param {readonly string[]} input.events - event subscriptions to request.
 * @param {readonly string[]} input.callbacks - callbacks requested by addons.
 * @param {readonly string[]} input.redirectUris - OAuth redirect URLs.
 * @param {readonly string[]} input.tenantScopes - tenant scopes to add.
 * @param {readonly string[]} input.userScopes - user scopes to add.
 * @returns {Promise<object>} applied configuration summary.
 */
export async function configureFeishuApplication({
  client,
  appId,
  events = [],
  callbacks = [],
  redirectUris = [],
  tenantScopes = [],
  userScopes = [],
} = {}) {
  if (!client || typeof client !== 'object') {
    throw new TypeError('Feishu application configuration requires a client');
  }
  if (typeof appId !== 'string' || appId.trim() === '') {
    throw new TypeError('Feishu application configuration requires an app id');
  }

  const application = client.application;
  const modern = application?.v7?.applicationConfig;
  if (modern && typeof modern.patch === 'function') {
    // Scope repair is best-effort and isolated from event/security config: an
    // existing app may already carry these scopes, and a duplicate-scope error
    // must not prevent long-connection or redirect setup.
    if (tenantScopes.length || userScopes.length) {
      try {
        await modern.patch({
          path: { app_id: appId },
          data: {
            scope: {
              add_scopes: [
                ...tenantScopes.map((scope_name) => ({ scope_name, token_type: 'tenant' })),
                ...userScopes.map((scope_name) => ({ scope_name, token_type: 'user' })),
              ],
            },
          },
        });
      } catch {
        // Some tenants require publishing or administrator approval first.
      }
    }
    const response = await modern.patch({
      path: { app_id: appId },
      data: {
        event: {
          subscription_type: 'websocket',
          add_events: [...events],
        },
        security: {
          add: { redirect_urls: [...redirectUris] },
          allow_refresh_token: true,
        },
      },
    });
    if (response?.code) {
      throw new Error(`Feishu application config failed: ${response.msg ?? `code ${response.code}`}`);
    }
    return { configured: true, mode: 'v7', events: [...events], callbacks: [...callbacks], redirectUris: [...redirectUris], tenantScopes: [...tenantScopes], userScopes: [...userScopes] };
  }

  const legacy = application?.v6?.application;
  if (legacy && typeof legacy.patch === 'function') {
    const response = await legacy.patch({
      path: { app_id: appId },
      data: {
        event: {
          subscription_type: 'websocket',
          subscribed_events: [...events],
        },
        security: {
          redirect_urls: [...redirectUris],
          allow_refresh_token: true,
        },
      },
    });
    if (response?.code) {
      throw new Error(`Feishu application config failed: ${response.msg ?? `code ${response.code}`}`);
    }
    return { configured: true, mode: 'v6', events: [...events], callbacks: [...callbacks], redirectUris: [...redirectUris] };
  }

  throw new Error('Feishu SDK does not support application development configuration');
}
