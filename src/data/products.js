const img = (id) => `https://images.unsplash.com/${id}?w=300`;

// ponytail: single source of truth untuk data dummy. Ganti ke apiClient saat backend siap.
const p = {
  esTeh: { id: 1, storeId: 1, name: 'Es Teh Manis', price: 5000, category: 'Minuman', image: img('photo-1556679343-c7306c1976bc') },
  indomie: { id: 2, storeId: 1, name: 'Indomie Goreng', price: 7000, category: 'Makanan', image: img('photo-1612927601601-6638404737ce') },
  cireng: { id: 3, storeId: 2, name: 'Cireng', price: 6000, category: 'Makanan', image: img('photo-1541592106381-b31e9677c0e5') },
  kapalApi: { id: 4, storeId: 2, name: 'Kapal Api', price: 7000, category: 'Minuman', image: img('photo-1514432324607-a09d9b4aefdd') },
  doritos: { id: 5, storeId: 2, name: 'Doritos', price: 7000, category: 'Makanan', image: img('photo-1566478989037-eec170784d0b') },
  golda: { id: 6, storeId: 2, name: 'Golda', price: 4000, category: 'Minuman', image: img('photo-1514432324607-a09d9b4aefdd') },
  goodDay: { id: 7, storeId: 3, name: 'GoodDay', price: 8000, category: 'Minuman', image: img('photo-1541592106381-b31e9677c0e5') },
  makaroni: { id: 8, storeId: 4, name: 'Makaroni Kongz', price: 6000, category: 'Makanan', image: img('photo-1566478989037-eec170784d0b') },
};

export const products = p;

export const stores = [
  { id: 1, name: 'JungleFood' },
  { id: 2, name: 'MeetUp Cafe' },
  { id: 3, name: 'Bisnis Digital' },
  { id: 4, name: 'Layanan Perbankan Syariah' },
];

export const bestSellers = [p.esTeh, p.cireng, p.kapalApi, p.indomie];

export const newestProducts = [p.esTeh, p.indomie, p.cireng, p.kapalApi];

export const shopNewest = [p.esTeh, p.cireng, p.indomie];

export const allShopProducts = Object.values(p);

export const tefaProducts = [p.esTeh, p.indomie, p.cireng, p.kapalApi];

export const tefaNewest = [p.kapalApi, p.esTeh, p.cireng];

export const categories = [
  'All',
  'Makanan',
  'Minuman',
  'Bahan Masakan',
  'Kesehatan & Kebersihan',
];

export const createCartSeed = () => [
  {
    id: 1,
    name: 'JungleFood',
    items: [{ ...p.indomie, quantity: 1, selected: false }],
  },
  {
    id: 2,
    name: 'MeetUp Cafe',
    items: [
      { ...p.doritos, quantity: 1, selected: false },
      { ...p.golda, quantity: 2, selected: true },
    ],
  },
];

export const orders = [
  { id: 1, storeName: 'JungleFood', status: 'pending', pickupNumber: '168', item: { ...p.indomie, quantity: 1 } },
  { id: 2, storeName: 'TEFA', status: 'ready', pickupNumber: '88', item: { ...p.golda, quantity: 2 } },
  { id: 3, storeName: 'Meetup Cafe', status: 'completed', pickupNumber: '9', item: { ...p.goodDay, quantity: 2 } },
  { id: 4, storeName: 'Bisnis Digital', status: 'canceled', pickupNumber: '67', item: { ...p.makaroni, quantity: 1 } },
];
