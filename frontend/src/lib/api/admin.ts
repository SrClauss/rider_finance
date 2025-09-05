import axios from "axios";

export async function getAdminOverview() {
  const res = await axios.get('/api/admin/dashboard', { withCredentials: true });
  const d = res.data || {};
  // Backend returns keys in PT-BR (ex: novos_30dias, nao_renovaram).
  // Normalize to the frontend shape for compatibility.
  return {
    new_users_30d: d.new_users_30d ?? d.novos_30dias ?? d.novos_30dias,
    not_renewed: d.not_renewed ?? d.nao_renovaram ?? d.nao_renovaram,
    blocked_count: d.blocked_count ?? d.blocked_count ?? undefined,
    renewal_chart: d.renewal_chart ?? d.renewal_chart ?? [],
  };
}

export async function listUsers(params: { page?: number; q?: string; cpf?: string; blocked?: boolean }) {
  const res = await axios.get('/api/admin/users', { params, withCredentials: true });
  return res.data;
}

export async function blockUser(userId: string) {
  const res = await axios.post(`/api/admin/users/${userId}/block`, {}, { withCredentials: true });
  return res.data;
}

export async function unblockUser(userId: string) {
  const res = await axios.post(`/api/admin/users/${userId}/unblock`, {}, { withCredentials: true });
  return res.data;
}

export async function changeAdminPassword(payload: { current_password: string; new_password: string }) {
  const res = await axios.post('/api/admin/change-password', payload, { withCredentials: true });
  return res.data;
}
