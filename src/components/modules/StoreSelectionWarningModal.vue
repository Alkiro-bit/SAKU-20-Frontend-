<script setup>
const emit = defineEmits(['close']);

function close() {
  emit('close');
}
</script>

<template>
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="selection-warning-title"
    aria-describedby="selection-warning-description"
    @click.self="close"
  >
    <div class="modal-card">
      <div class="modal-top">
        <button type="button" class="modal-close-btn" @click="close" aria-label="Close dialog">
          <img src="/assets/modal-close.svg" alt="" width="24" height="24" />
        </button>
        <img class="warning-icon" src="/assets/modal-warning.svg" alt="" width="52.2316" height="52.2316" />
      </div>
      <div class="modal-content">
        <div class="modal-heading">
          <h2 id="selection-warning-title" class="modal-title">Warning</h2>
          <p class="modal-subtitle">Items from different stores</p>
        </div>
        <p id="selection-warning-description" class="modal-warning">
          You can only check out items from one store at a time. Complete checkout for this store first, then select items from another store.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
}

.modal-card {
  background-color: var(--color-surface);
  border-radius: 6.6px;
  width: 100%;
  max-width: 330px;
  min-height: 176px;
  padding: 20px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.modal-top {
  display: flex;
  align-items: flex-start;
  gap: 66px;
  width: 100%;
}

.modal-close-btn {
  position: relative;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--color-text);
}

.modal-close-btn img {
  position: absolute;
  top: 0;
  left: 0;
}

.modal-close-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.warning-icon {
  flex: 0 0 auto;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  text-align: center;
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.modal-heading {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.modal-title {
  font-family: var(--font-family-brand);
  font-weight: 600;
  font-size: 22px;
  line-height: normal;
  margin-bottom: -4px;
  white-space: nowrap;
}

.modal-subtitle {
  font-family: var(--font-family-base);
  font-weight: 600;
  font-size: 10.56px;
  line-height: 11.88px;
  letter-spacing: -0.4224px;
}

.modal-warning {
  font-family: var(--font-family-base);
  font-weight: 400;
  font-size: 10.56px;
  line-height: 11.88px;
  letter-spacing: -0.4224px;
}
</style>
