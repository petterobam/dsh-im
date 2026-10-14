import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const required = [
  'lib/index.js',
  'lib/client.js',
  'bin/dsh-im.mjs',
  'cordis.patch.yml',
  'FORK.md',
  'THIRD_PARTY_NOTICES.md',
  'plugin-src/host/index.mjs',
  'src/channels/feishu/wind-config.mjs',
];
await Promise.all(required.map((path) => access(resolve(root, path))));

const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (manifest.name !== 'dsh-plugin-im') throw new Error(`unexpected package name ${manifest.name}`);
const client = await readFile(resolve(root, 'lib/client.js'), 'utf8');
const host = await readFile(resolve(root, 'lib/index.js'), 'utf8');
if (!client.includes('dsh-plugin-im')) throw new Error('client bundle has no built-in loader id');
if (!host.includes('startFeishuRegistration')) throw new Error('host bundle has no dshIm registration service');
if (!host.includes('{user}') || !host.includes('docx:document')) throw new Error('host bundle has no 有风 Buddy Feishu preset');
if (host.includes('@tencent-connect/qqbot-connector')) throw new Error('host bundle still imports the UNLICENSED QQ QR connector');
console.log('Verified dsh-plugin-im package artifacts.');
