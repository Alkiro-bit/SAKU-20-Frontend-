<script setup>
import { computed, onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import AdminSidebar from '@/components/layout/AdminSidebar.vue';
import AdminHeader from '@/components/layout/AdminHeader.vue';
import ProductModal from '@/components/modules/ProductModal.vue';
import DeleteProductModal from '@/components/modules/DeleteProductModal.vue';
import {
  apiClient,
  getApiErrorMessage,
  getApiValidationErrors,
  resolveImageUrl,
} from '@/services/api';

const store = ref(null);
const products = ref([]);
const categories = ref([]);
const searchQuery = ref('');
const loading = ref(true);
const productsError = ref('');
const modalOpen = ref(false);
const selectedProduct = ref(null);
const deleteModalOpen = ref(false);
const productToDelete = ref(null);
const deletingProduct = ref(false);
const productDeleteError = ref('');
const categoriesLoading = ref(false);
const categoriesError = ref('');
const submittingProduct = ref(false);
const productSubmitError = ref('');
const productFieldErrors = ref({});
const isSidebarCollapsed = ref(false);

const visibleProducts = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  if (!query) return products.value;

  return products.value.filter((product) =>
    String(product.name || '').toLocaleLowerCase().includes(query),
  );
});

function formatRupiah(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

async function fetchProducts() {
  const items = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await apiClient.get('/admin/products', {
      params: { page, per_page: 100 },
    });
    const pageItems = response.data?.data;
    if (!Array.isArray(pageItems)) {
      throw new Error('Respons daftar produk tidak berisi data yang valid.');
    }

    items.push(...pageItems);
    const meta = response.data?.meta;

    if (Number.isInteger(meta?.current_page) && Number.isInteger(meta?.last_page)) {
      hasNextPage = meta.current_page < meta.last_page;
      const nextPage = meta.current_page + 1;
      if (hasNextPage && nextPage <= page) {
        throw new Error('Pagination produk tidak maju ke halaman berikutnya.');
      }
      page = nextPage;
    } else if (response.data?.links && Object.hasOwn(response.data.links, 'next')) {
      hasNextPage = Boolean(response.data.links.next);
      page += 1;
    } else {
      hasNextPage = false;
    }
  }

  return items;
}

async function fetchStore() {
  const response = await apiClient.get('/admin/store');
  return response.data?.data || null;
}

async function loadCategories() {
  categoriesLoading.value = true;
  categoriesError.value = '';

  try {
    const response = await apiClient.get('/categories');
    const items = response.data?.data;
    if (!Array.isArray(items)) {
      throw new Error('Respons kategori tidak berisi daftar data yang valid.');
    }
    categories.value = items;
    if (items.length === 0) categoriesError.value = 'No categories are available.';
  } catch (error) {
    categoriesError.value =
      error instanceof Error && !error.response
        ? error.message
        : getApiErrorMessage(error, 'Gagal memuat kategori.');
  } finally {
    categoriesLoading.value = false;
  }
}

async function loadData() {
  loading.value = true;
  productsError.value = '';

  const [productsResult, storeResult] = await Promise.allSettled([
    fetchProducts(),
    fetchStore(),
  ]);

  if (productsResult.status === 'fulfilled') {
    products.value = productsResult.value;
  } else {
    productsError.value =
      productsResult.reason instanceof Error && !productsResult.reason.response
        ? productsResult.reason.message
        : getApiErrorMessage(productsResult.reason, 'Gagal memuat daftar produk.');
  }

  if (storeResult.status === 'fulfilled') {
    store.value = storeResult.value;
  }

  loading.value = false;
}

async function refreshProducts() {
  loading.value = true;
  productsError.value = '';

  try {
    products.value = await fetchProducts();
  } catch (error) {
    productsError.value =
      error instanceof Error && !error.response
        ? error.message
        : getApiErrorMessage(error, 'Gagal memuat daftar produk.');
  } finally {
    loading.value = false;
  }
}

async function openAddProductModal() {
  selectedProduct.value = null;
  modalOpen.value = true;
  productSubmitError.value = '';
  productFieldErrors.value = {};
  if (!categories.value.length && !categoriesLoading.value) {
    await loadCategories();
  }
}

async function openEditProductModal(product) {
  selectedProduct.value = product;
  modalOpen.value = true;
  productSubmitError.value = '';
  productFieldErrors.value = {};
  if (!categories.value.length && !categoriesLoading.value) {
    await loadCategories();
  }
}

function closeProductModal() {
  modalOpen.value = false;
  selectedProduct.value = null;
  productSubmitError.value = '';
  productFieldErrors.value = {};
}

function openDeleteProductModal(product) {
  productToDelete.value = product;
  productDeleteError.value = '';
  deleteModalOpen.value = true;
}

function closeDeleteProductModal() {
  if (deletingProduct.value) return;
  deleteModalOpen.value = false;
  productToDelete.value = null;
  productDeleteError.value = '';
}

async function confirmDeleteProduct() {
  if (deletingProduct.value || !productToDelete.value?.id) return;

  deletingProduct.value = true;
  productDeleteError.value = '';

  try {
    await apiClient.delete(`/admin/products/${productToDelete.value.id}`);
    const deletedProductId = productToDelete.value.id;
    products.value = products.value.filter((product) => product.id !== deletedProductId);
    deleteModalOpen.value = false;
    productToDelete.value = null;
  } catch (error) {
    if (error?.response?.status === 409) {
      productDeleteError.value = 'Produk tidak dapat dihapus karena sudah tercatat dalam riwayat pesanan';
    } else if (error?.response?.status === 404) {
      productDeleteError.value = 'Produk tidak ditemukan atau bukan milik toko Anda.';
    } else {
      productDeleteError.value = getApiErrorMessage(error, 'Gagal menghapus produk.');
    }
  } finally {
    deletingProduct.value = false;
  }
}

async function createProduct(product) {
  if (submittingProduct.value) return;

  submittingProduct.value = true;
  productSubmitError.value = '';
  productFieldErrors.value = {};
  const formData = new FormData();
  formData.append('category_id', String(product.category_id));
  formData.append('name', product.name);
  formData.append('description', product.description);
  formData.append('price', String(product.price));
  formData.append('stock', String(product.stock));
  if (product.image) formData.append('image', product.image);

  try {
    await apiClient.post('/admin/products', formData);
    closeProductModal();
    await refreshProducts();
  } catch (error) {
    productFieldErrors.value = getApiValidationErrors(error);
    productSubmitError.value = getApiErrorMessage(error, 'Gagal menambahkan produk.');
  } finally {
    submittingProduct.value = false;
  }
}

async function updateProduct(product) {
  if (submittingProduct.value) return;

  const currentProduct = selectedProduct.value;
  if (!currentProduct || currentProduct.id === undefined || currentProduct.id === null) {
    productSubmitError.value = 'Produk yang akan diperbarui tidak ditemukan.';
    return;
  }

  submittingProduct.value = true;
  productSubmitError.value = '';
  productFieldErrors.value = {};
  const formData = new FormData();
  let hasChanges = false;

  function appendIfChanged(field, value, changed) {
    if (!changed) return;
    formData.append(field, String(value));
    hasChanges = true;
  }

  appendIfChanged('name', product.name, product.name !== String(currentProduct.name ?? ''));
  appendIfChanged(
    'category_id',
    product.category_id,
    String(product.category_id) !== String(currentProduct.category_id ?? ''),
  );
  appendIfChanged('price', product.price, Number(product.price) !== Number(currentProduct.price));
  appendIfChanged('stock', product.stock, Number(product.stock) !== Number(currentProduct.stock));
  appendIfChanged(
    'description',
    product.description,
    product.description !== String(currentProduct.description ?? ''),
  );
  if (product.image) {
    formData.append('image', product.image);
    hasChanges = true;
  }

  if (!hasChanges) {
    closeProductModal();
    submittingProduct.value = false;
    return;
  }

  try {
    await apiClient.patch(`/admin/products/${currentProduct.id}`, formData);
    closeProductModal();
    await refreshProducts();
  } catch (error) {
    productFieldErrors.value = getApiValidationErrors(error);
    productSubmitError.value = getApiErrorMessage(error, 'Gagal memperbarui produk.');
  } finally {
    submittingProduct.value = false;
  }
}

function submitProduct(product) {
  if (selectedProduct.value) {
    return updateProduct(product);
  }
  return createProduct(product);
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

onMounted(loadData);
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar v-model:collapsed="isSidebarCollapsed" />

    <div class="admin-main">
      <AdminHeader
        :store="store"
        fallback-name="Store"
        :show-refresh="false"
        @toggle-sidebar="toggleSidebar"
      />

      <main class="page-content">
        <section class="products-panel" aria-labelledby="products-title" :aria-busy="loading">
          <div class="products-heading">
            <div class="heading-copy">
              <h1 id="products-title">Products &amp; Stock</h1>
              <p>Manage orders based on the order in which they are received.</p>
            </div>

            <label class="search-field">
              <span class="sr-only">Search products</span>
              <Icon icon="mdi:magnify" width="18" height="18" aria-hidden="true" />
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search"
                autocomplete="off"
              />
            </label>
          </div>

          <div v-if="productsError" class="error-state" role="alert">
            <Icon icon="mdi:alert-circle-outline" width="22" height="22" aria-hidden="true" />
            <span>{{ productsError }}</span>
            <button type="button" class="retry-button" @click="loadData">Try again</button>
          </div>

          <div v-else-if="loading" class="product-grid loading-grid" aria-hidden="true">
            <div v-for="index in 3" :key="index" class="loading-card">
              <div class="loading-image"></div>
              <div class="loading-line"></div>
              <div class="loading-line short"></div>
            </div>
          </div>

          <div v-else class="product-grid">
            <button
              type="button"
              class="add-product-card"
              aria-label="Add product"
              @click="openAddProductModal"
            >
              <Icon icon="mdi:plus" width="26" height="26" aria-hidden="true" />
              <span>Add Product</span>
            </button>

            <article v-for="product in visibleProducts" :key="product.id" class="product-card">
              <div class="product-image">
                <img
                  :src="resolveImageUrl(product.image_url || product.image)"
                  :alt="product.name || 'Product image'"
                  loading="lazy"
                />
              </div>

              <div class="product-details">
                <div class="product-copy">
                  <h2 :title="product.name">{{ product.name || 'Untitled product' }}</h2>
                  <p>{{ formatRupiah(product.price) }}</p>
                </div>

                <div class="stock">
                  <span class="stock-label">Stock</span>
                  <span class="stock-value">{{ product.stock ?? '—' }}</span>
                </div>
              </div>

              <div class="product-actions">
                <button
                  type="button"
                  class="edit-button"
                  :title="`Edit ${product.name || 'product'}`"
                  :aria-label="`Edit ${product.name || 'product'}`"
                  @click="openEditProductModal(product)"
                >
                  <Icon icon="mdi:pencil-outline" width="15" height="15" aria-hidden="true" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  class="delete-button"
                  :title="`Delete ${product.name || 'product'}`"
                  :aria-label="`Delete ${product.name || 'product'}`"
                  @click="openDeleteProductModal(product)"
                >
                  <Icon icon="mdi:delete-outline" width="17" height="17" aria-hidden="true" />
                </button>
              </div>
            </article>

            <div v-if="!visibleProducts.length" class="empty-state" role="status">
              <Icon icon="mdi:package-variant-closed" width="32" height="32" aria-hidden="true" />
              <p>{{ searchQuery ? 'No products found.' : 'No products yet.' }}</p>
            </div>
          </div>
        </section>
      </main>
    </div>

    <ProductModal
      v-if="modalOpen"
      :mode="selectedProduct ? 'edit' : 'create'"
      :initial-product="selectedProduct"
      :categories="categories"
      :categories-loading="categoriesLoading"
      :categories-error="categoriesError"
      :submitting="submittingProduct"
      :submit-error="productSubmitError"
      :field-errors="productFieldErrors"
      @close="closeProductModal"
      @submit="submitProduct"
      @retry-categories="loadCategories"
    />

    <DeleteProductModal
      v-if="deleteModalOpen"
      :product="productToDelete"
      :deleting="deletingProduct"
      :error-message="productDeleteError"
      @close="closeDeleteProductModal"
      @confirm="confirmDeleteProduct"
    />
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-admin-bg);
}

.admin-main {
  display: flex;
    flex: 1;
  flex-direction: column;
  min-width: 0;
}

.page-content {
  flex: 1;
  min-width: 0;
  padding: 20px;
}

.products-panel {
  min-height: calc(100vh - 140px);
  padding: 18px 20px 24px;
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
}

.products-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.heading-copy h1 {
  font-family: var(--font-family-base);
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  color: var(--color-text);
}

.heading-copy p {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.search-field {
  display: flex;
  flex: 0 1 360px;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  height: 40px;
  padding: 0 12px;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.search-field:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgb(0 149 255 / 18%);
}

.search-field input {
  width: 100%;
  min-width: 0;
  padding: 0;
  color: var(--color-text);
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: var(--font-size-sm);
}

.search-field input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 220px));
  align-items: start;
  gap: 16px;
}

.add-product-card,
.product-card {
  box-sizing: border-box;
  height: 290px;
}

.add-product-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #777777;
  border: 2px dashed #c7c7c7;
  border-radius: var(--radius-md);
  background-color: #f0f0f0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
}

.add-product-card:disabled,
.edit-button:disabled,
.delete-button:disabled {
  cursor: not-allowed;
}

.product-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e3e3e3;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: 0 3px 8px rgb(0 0 0 / 16%);
}

.product-image {
  width: 100%;
  aspect-ratio: 1.22 / 1;
  overflow: hidden;
  background-color: #f0f2f5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 62px;
  padding: 8px 10px;
  border-top: 1px solid #e2e2e2;
}

.product-copy {
  min-width: 0;
}

.product-copy h2 {
  overflow: hidden;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-copy p {
  margin-top: 2px;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: 1.3;
}

.stock {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  font-family: var(--font-family-base);
  font-size: 10px;
}

.stock-label {
  color: var(--color-text-muted);
}

.stock-value {
  display: grid;
  min-width: 24px;
  min-height: 24px;
  place-items: center;
  padding: 0 4px;
  color: var(--color-text-on-accent);
  border-radius: 5px;
  background-color: var(--color-primary);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
}

.product-actions {
  display: flex;
  gap: 6px;
  padding: 0 8px 8px;
}

.edit-button,
.delete-button {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--color-text-muted);
  border: 1px solid #d5d5d5;
  border-radius: 5px;
  background-color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
}

.edit-button {
  flex: 1;
}

.edit-button:hover:not(:disabled) {
  border-color: #b0b0b0;
  background-color: #f7f7f7;
}

.delete-button {
  width: 34px;
  color: var(--color-danger);
  border-color: #efb8b8;
  background-color: #fff1f1;
}

.delete-button:hover:not(:disabled) {
  background-color: #ffe5e5;
  border-color: #ea9999;
}

.add-product-card:focus-visible,
.edit-button:focus-visible,
.delete-button:focus-visible,
.retry-button:focus-visible {
  outline: 3px solid rgb(0 149 255 / 45%);
  outline-offset: 2px;
}

.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 180px;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  text-align: center;
}

.error-state {
  flex-wrap: wrap;
  color: var(--color-danger-dark);
}

.retry-button {
  padding: 6px 10px;
  color: var(--color-text-on-accent);
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
}

.empty-state {
  grid-column: 1 / -1;
  flex-direction: column;
  color: var(--color-text-muted);
}

.loading-card {
  display: flex;
  min-height: 290px;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-md);
  background-color: #f7f7f7;
}

.loading-image,
.loading-line {
  border-radius: 4px;
  background: linear-gradient(90deg, #eeeeee 25%, #f6f6f6 50%, #eeeeee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.loading-image {
  aspect-ratio: 1 / 1;
}

.loading-line {
  width: 75%;
  height: 12px;
}

.loading-line.short {
  width: 45%;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 700px) {
  .page-content {
    padding: 12px;
  }

  .products-panel {
    min-height: calc(100vh - 104px);
    padding: 16px;
  }

  .products-heading {
    flex-direction: column;
    gap: 14px;
  }

  .search-field {
    flex-basis: auto;
    width: 100%;
    min-width: 0;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .add-product-card {
    min-height: auto;
    aspect-ratio: 1 / 1;
    padding: 12px;
  }
}

@media (max-width: 380px) {
  .heading-copy h1 {
    font-size: 24px;
  }

  .product-grid {
    gap: 9px;
  }

  .product-details {
    gap: 5px;
    padding: 7px;
  }

  .product-copy h2 {
    font-size: var(--font-size-xs);
  }

  .product-actions {
    gap: 5px;
    padding: 0 6px 6px;
  }
}
</style>
