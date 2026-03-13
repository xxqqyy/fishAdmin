import dayjs from 'dayjs';

export function normalizeModerationStatus(rawStatus) {
  const value = String(rawStatus || '').trim();

  if (!value) {
    return 'unknown';
  }

  if (value === 'hidden' || value.includes('殣')) {
    return 'hidden';
  }

  if (value === 'resolved' || value === 'restored' || value.includes('宸插')) {
    return 'resolved';
  }

  if (value === 'pending' || value.includes('寰')) {
    return 'pending';
  }

  if (value.includes('褰')) {
    return 'recorded';
  }

  return value;
}

export function formatStatusLabel(rawStatus) {
  const status = normalizeModerationStatus(rawStatus);
  const labelMap = {
    pending: '待处理',
    hidden: '已隐藏',
    resolved: '已处置',
    recorded: '已登记',
    restored: '已恢复',
    unknown: '未知'
  };

  return labelMap[status] || rawStatus || '未知';
}

export function getStatusColor(rawStatus) {
  const status = normalizeModerationStatus(rawStatus);
  const colorMap = {
    pending: 'orange',
    hidden: 'red',
    resolved: 'green',
    recorded: 'blue',
    restored: 'cyan',
    unknown: 'default'
  };

  return colorMap[status] || 'default';
}

export function formatTargetTypeLabel(targetType) {
  const labelMap = {
    spot: '钓点',
    content: '内容',
    share: '分享',
    review: '点评',
    post: '动态',
    video: '视频'
  };

  return labelMap[targetType] || targetType || '未知类型';
}

export function formatModerationActionLabel(action) {
  const labelMap = {
    hide: '隐藏',
    resolve: '处置',
    restore: '恢复'
  };

  return labelMap[action] || action || '操作';
}

export function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const time = dayjs(value);
  if (time.isValid()) {
    return time.format('YYYY-MM-DD HH:mm');
  }

  return value;
}

export function toPercent(value, total) {
  if (!value || !total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
