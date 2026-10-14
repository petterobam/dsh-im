/**
 * QQ QR binding is intentionally unavailable in the built-in 有风 Buddy fork.
 *
 * Upstream delegates this one flow to `@tencent-connect/qqbot-connector`,
 * whose npm metadata declares `UNLICENSED`; the Desktop cannot redistribute it.
 * QQ message delivery and manual AppID + AppSecret binding remain available.
 * Tests and embedders may still inject a permissive `start` implementation.
 */
export class QqQrAuth {
  #start;
  #source;

  constructor({ start, source = 'deepseek-harness' } = {}) {
    if (start !== undefined && typeof start !== 'function') {
      throw new TypeError('QQ QR connector must be a function when provided');
    }
    this.#start = start;
    this.#source = source;
  }

  start(callbacks, { signal } = {}) {
    if (!callbacks || typeof callbacks.onSuccess !== 'function'
      || typeof callbacks.onFailure !== 'function') {
      throw new TypeError('QQ QR callbacks are required');
    }
    if (typeof this.#start !== 'function') {
      const error = new Error('当前内置版本不提供 QQ 扫码创建，请使用 App ID + App Secret 手动绑定。');
      error.code = 'qq-qr-unavailable';
      throw error;
    }
    return this.#start(callbacks, {
      displayQrCodeToConsole: false,
      source: this.#source,
      signal,
    });
  }
}
