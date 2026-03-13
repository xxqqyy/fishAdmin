const STORAGE_KEY = 'fish-admin-config';

function trimSlash(value) {
  return (value || '').replace(/\/+$/, '');
}

const defaultBaseUrl = trimSlash(import.meta.env.VITE_API_BASE_URL || 'https://api.example.com/api/v1');
const defaultOperatorId = String(import.meta.env.VITE_OPERATOR_ID || 'u-001').trim() || 'u-001';

const defaultConfig = {
  baseUrl: defaultBaseUrl,
  operatorId: defaultOperatorId
};

export function getApiConfig() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      baseUrl: trimSlash(stored.baseUrl || defaultConfig.baseUrl),
      operatorId: stored.operatorId || defaultConfig.operatorId
    };
  } catch {
    return defaultConfig;
  }
}

export function setApiConfig(config) {
  const nextConfig = {
    baseUrl: trimSlash(config.baseUrl || defaultConfig.baseUrl),
    operatorId: config.operatorId || defaultConfig.operatorId
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
  window.dispatchEvent(new Event('fish-admin-config-change'));
  return nextConfig;
}

async function request(path, options = {}) {
  const { baseUrl, operatorId } = options.config || getApiConfig();
  const query = new URLSearchParams(
    Object.entries(options.query || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
  const normalizedPath = String(path).replace(/^\/+/, '');
  const url = `${trimSlash(baseUrl)}/${normalizedPath}${query.size ? `?${query.toString()}` : ''}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${operatorId}`,
      'x-user-id': operatorId,
      ...options.headers
    },
    body: options.data ? JSON.stringify(options.data) : undefined,
    signal: options.signal
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `请求失败 (${response.status})`);
  }

  if (payload?.code !== 0) {
    throw new Error(payload?.message || '接口返回异常');
  }

  return payload.data;
}

export function getHealth(signal) {
  return request('health', { signal });
}

export function checkHealth(config) {
  return request('health', { config });
}

export function getAuthOptions(signal) {
  return request('users/auth/options', { signal });
}

export function getDashboard(signal, query) {
  return request('moderation/dashboard', { signal, query });
}

export function getHomeRecommendations(query, config, signal) {
  return request('home/recommendations', { query, config, signal });
}

export function hideTarget(data) {
  return request('moderation/hide', {
    method: 'POST',
    data
  });
}

export function resolveTarget(data) {
  return request('moderation/resolve', {
    method: 'POST',
    data
  });
}

export function restoreTarget(data) {
  return request('moderation/restore', {
    method: 'POST',
    data
  });
}

export function createReport(data) {
  return request('reports', {
    method: 'POST',
    data
  });
}

export function getCommunityIndex() {
  return request('community/index');
}

export function getSpotDetail(spotId) {
  return request(`spots/${spotId}`);
}

export function getAdminOverview(signal) {
  return request('admin/overview', { signal });
}

export function getAdminResource(resource, query, signal) {
  return request(`admin/${resource}`, { query, signal });
}

export function createAdminResource(resource, data) {
  return request(`admin/${resource}`, {
    method: 'POST',
    data
  });
}

export function updateAdminResource(resource, id, data) {
  return request(`admin/${resource}/${id}`, {
    method: 'PATCH',
    data
  });
}

export function deleteAdminResource(resource, id) {
  return request(`admin/${resource}/${id}`, {
    method: 'DELETE'
  });
}

export async function getRiskTargetPreview(item) {
  if (!item) {
    return null;
  }

  if (item.targetType === 'spot') {
    const detail = await getSpotDetail(item.targetId);
    return {
      kind: 'spot',
      detail
    };
  }

  const community = await getCommunityIndex();
  const contentList = [
    ...(community?.feed?.shares || []),
    ...(community?.feed?.reviews || []),
    ...(community?.feed?.videos || [])
  ];
  const content = contentList.find((entry) => entry.id === item.targetId);

  return {
    kind: 'content',
    detail: content || null
  };
}
