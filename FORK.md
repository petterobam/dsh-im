# 有风 Buddy built-in IM fork

This directory is the in-repo fork of [`@xmanrui/dsh-im`](https://github.com/xmanrui/dsh-im).
The upstream package remains MIT-licensed; keep `LICENSE` and
`THIRD_PARTY_NOTICES.md` with the vendored source.

- Upstream release: `v4.13.0`
- Upstream commit: `45693cbb44a3fa50766e3939f78d0d96675aa651`
- npm tarball: `https://registry.npmmirror.com/@xmanrui/dsh-im/-/dsh-im-4.13.0.tgz`
- Tarball SHA-256: `fbbe190047d215689517aa20584d04205e98cd742f961d1c6b10171befcd57d0`

The fork keeps the package row id `xmanrui-dsh-im` so existing DSH settings,
credentials, bot records and profile migration data remain valid. The package
name is `dsh-plugin-im`, and the client bundle loader id is updated to match the
built-in package.

## Local deltas against upstream `v4.13.0`

1. **Built-in identity and client loader id** — package name is
   `dsh-plugin-im`; `cordis.patch.yml` and the client bundle resolve the new
   package name while the row id stays `xmanrui-dsh-im`.
2. **有风 Buddy Feishu preset** — QR-created apps use
   `{user} 的有风 Buddy`, request IM plus Feishu office user scopes
   (`docx:document`, `bitable:app`, `calendar:calendar`, `task:task`,
   `wiki:wiki`, `sheets:spreadsheet`, `offline_access`, and the meeting/VC
   read scopes), and request the card callback `card.action.trigger`.
3. **Post-creation application config** — after `registerApp` returns
   credentials, the Host best-effort patches the app for WebSocket long
   connection, adds the desktop OAuth redirect URL
   `http://localhost:3000/callback`, and enables refresh tokens. Older SDK
   fallback, or tenants that require publishing first, keep the created app and
   credentials usable.
4. **Host service projection** — `ctx.dshIm` exposes
   `startFeishuRegistration`, `getFeishuStatus` and
   `cancelFeishuRegistration` so the Desktop chat tool can drive the same
   registration path as the IM settings page.
5. **Bundled update behavior** — the Settings update panel reports the fork as
   a built-in package and refuses npm self-update; plugin updates ship with
   the Desktop application.
6. **QQ QR connector removed** — the built-in fork does not redistribute
   `@tencent-connect/qqbot-connector` because its npm metadata declares
   `UNLICENSED`. QQ message delivery and manual AppID + AppSecret binding remain;
   QR creation returns a clear “use manual binding” error.
7. **Workspace integration** — root Yarn workspace, Desktop profile bundle
   list, package metadata and the old `@xmanrui/dsh-im` profile dependency
   migration are part of the in-repo fork.

## Refresh workflow

1. Download the intended upstream npm tarball and inspect its `package.json`
   and generated bundles.
2. Replace `lib/`, `src/`, `plugin-src/`, `assets/`, `bin/` and the upstream
   docs while preserving this file, the local Feishu preset, the dshIm service
   projection and the built-in updater behavior.
3. Run:

```bash
cd dsh-plugin-im
corepack yarn check
```

The local syntax check parses every shipped module; the build regenerates
`lib/client.js` and `lib/index.js`; focused tests cover the Feishu preset,
post-creation config and registration-manager handoff.
