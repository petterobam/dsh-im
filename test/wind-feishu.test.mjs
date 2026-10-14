import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WIND_FEISHU_APP_DESC,
  WIND_FEISHU_APP_NAME,
  WIND_FEISHU_CALLBACKS,
  WIND_FEISHU_EVENTS,
  WIND_FEISHU_EXTRA_TENANT_SCOPES,
  WIND_FEISHU_REDIRECT_URIS,
  WIND_FEISHU_USER_SCOPES,
} from '../src/channels/feishu/wind-config.mjs';
import { configureFeishuApplication } from '../src/channels/feishu/feishu-app.mjs';
import { MultiBotDshFeishuController } from '../src/channels/feishu/multi-bot-controller.mjs';
import { REQUIRED_TENANT_SCOPES } from '../src/channels/feishu/plugin-controller.mjs';

test('uses the 有风 Buddy app identity and office permissions', () => {
  assert.equal(WIND_FEISHU_APP_NAME, '{user} 的有风 Buddy');
  assert.match(WIND_FEISHU_APP_DESC, /有风 Buddy/u);
  assert.deepEqual(WIND_FEISHU_REDIRECT_URIS, ['http://localhost:3000/callback']);
  assert.ok(WIND_FEISHU_USER_SCOPES.includes('docx:document'));
  assert.ok(WIND_FEISHU_USER_SCOPES.includes('bitable:app'));
  assert.ok(WIND_FEISHU_USER_SCOPES.includes('calendar:calendar'));
  assert.ok(WIND_FEISHU_USER_SCOPES.includes('offline_access'));
  assert.ok(WIND_FEISHU_EXTRA_TENANT_SCOPES.includes('application:application:self_manage'));
  assert.ok(REQUIRED_TENANT_SCOPES.includes('application:application:self_manage'));
  assert.deepEqual(WIND_FEISHU_EVENTS, ['im.message.receive_v1']);
  assert.deepEqual(WIND_FEISHU_CALLBACKS, ['card.action.trigger']);
});

test('configures long connection, redirect URL and refresh token after creation', async () => {
  const calls = [];
  const client = {
    application: {
      v7: {
        applicationConfig: {
          async patch(payload) {
            calls.push(payload);
            return { code: 0 };
          },
        },
      },
    },
  };
  const result = await configureFeishuApplication({
    client,
    appId: 'cli_test',
    events: WIND_FEISHU_EVENTS,
    callbacks: WIND_FEISHU_CALLBACKS,
    redirectUris: WIND_FEISHU_REDIRECT_URIS,
  });
  assert.equal(result.configured, true);
  assert.equal(result.mode, 'v7');
  assert.deepEqual(calls, [{
    path: { app_id: 'cli_test' },
    data: {
      event: { subscription_type: 'websocket', add_events: ['im.message.receive_v1'] },
      security: {
        add: { redirect_urls: ['http://localhost:3000/callback'] },
        allow_refresh_token: true,
      },
    },
  }]);
});

test('passes the preset through the production Feishu registration manager', async () => {
  let captured;
  const controller = new MultiBotDshFeishuController({
    registerApp: async (options) => {
      captured = options;
      throw Object.assign(new Error('stop after capture'), { code: 'access_denied' });
    },
    verifyApp: async () => ({ name: 'test bot', openId: 'ou_test', activated: true }),
    credentials: {
      resolve: async () => ({ value: 'secret' }),
      set: async () => undefined,
      unset: async () => undefined,
    },
    configStore: {
      list: () => [],
      getBot: () => undefined,
      saveBot: async (value) => value,
    },
    createRuntime: async () => ({ start: async () => undefined, stop: async () => undefined }),
  });

  controller.startRegistration();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.ok(captured);
  assert.equal(captured.appPreset.name, WIND_FEISHU_APP_NAME);
  assert.equal(captured.appPreset.desc, WIND_FEISHU_APP_DESC);
  assert.deepEqual(captured.addons.scopes.user, [...WIND_FEISHU_USER_SCOPES]);
  assert.deepEqual(captured.addons.events.items.tenant, [...WIND_FEISHU_EVENTS]);
  assert.deepEqual(captured.addons.callbacks.items, [...WIND_FEISHU_CALLBACKS]);
  await controller.close();
});
