/**
 * 有风 Buddy's Feishu app preset.
 *
 * The public registerApp addons pre-fill the confirmation page; the controller
 * then patches the created app for long-connection mode and the desktop OAuth
 * callback. Keep the preset focused on the product's own assistant work:
 * IM delivery, Feishu docs/Bitable/Wiki, calendar, tasks and meetings.
 */

export const WIND_FEISHU_APP_NAME = '{user} 的有风 Buddy';
export const WIND_FEISHU_APP_DESC = '有风 Buddy 企业智能助手：在飞书中处理消息、文档、多维表格、日历、任务与会议。';
export const WIND_FEISHU_REDIRECT_URIS = Object.freeze(['http://localhost:3000/callback']);

/** Extra tenant scopes beyond the IM runtime's base manifest. */
export const WIND_FEISHU_EXTRA_TENANT_SCOPES = Object.freeze([
  'application:application:self_manage',
]);

/** User scopes requested on the app confirmation page for personal work. */
export const WIND_FEISHU_USER_SCOPES = Object.freeze([
  'offline_access',
  'calendar:calendar',
  'minutes:minutes:readonly',
  'vc:meeting.meetingid:read',
  'vc:note:read',
  'vc:room:readonly',
  'task:task',
  'docx:document',
  'drive:drive',
  'bitable:app',
  'wiki:wiki',
  'sheets:spreadsheet',
]);

export const WIND_FEISHU_EVENTS = Object.freeze(['im.message.receive_v1']);
export const WIND_FEISHU_CALLBACKS = Object.freeze(['card.action.trigger']);
