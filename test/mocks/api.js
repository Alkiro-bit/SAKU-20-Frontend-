export const apiClient = {
  get: async () => ({ data: { data: null } }),
  post: async () => ({ data: { data: null } }),
  patch: async () => ({ data: { data: null } }),
  delete: async () => ({ data: { data: null } }),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};

export function resolveImageUrl(pathOrUrl, fallback = 'https://placehold.co/300x300?text=Produk') {
  if (!pathOrUrl) return fallback;
  return pathOrUrl;
}

export async function getStore(storeId) {
  return { id: storeId, name: `Toko #${storeId}` };
}

export function getApiErrorMessage(error, fallback = 'Terjadi kesalahan. Coba lagi.') {
  const message = error?.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  const status = error?.response?.status;
  if (status === 401) return 'Sesi Anda telah berakhir. Silakan login kembali.';
  if (status === 409) return 'Terjadi konflik data (stok habis, toko tutup, atau pesanan sudah diproses).';
  if (status === 422) return 'Data yang dikirim tidak valid. Periksa kembali pesanan Anda.';
  return fallback;
}
