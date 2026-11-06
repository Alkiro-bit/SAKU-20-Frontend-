<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage, getApiValidationErrors } from '@/services/api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const name = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const isSubmitting = ref(false);
const formError = ref('');
const fieldErrors = ref({});

function getRedirectPath() {
  const redirect = route.query.redirect;
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/';
}

async function handleSubmit() {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  formError.value = '';
  fieldErrors.value = {};

  try {
    await authStore.register({
      email: email.value.trim().toLowerCase(),
      name: name.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });
  } catch (error) {
    fieldErrors.value = getApiValidationErrors(error);
    formError.value = getApiErrorMessage(error, 'Registrasi gagal. Periksa data Anda, lalu coba lagi.');
    isSubmitting.value = false;
    return;
  }

  isSubmitting.value = false;
  await router.replace(getRedirectPath());
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card auth-card--register" aria-labelledby="register-title">
      <header class="auth-heading">
        <div class="auth-title-row">
          <h1 id="register-title">Sign Up</h1>
          <router-link to="/login" class="back-button" aria-label="Kembali ke halaman login">
            <Icon icon="bx:arrow-back" width="24" height="24" />
          </router-link>
        </div>
        <p>Daftar menggunakan email yang valid</p>
      </header>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-fields">
          <div class="auth-field">
            <label for="register-email">Email</label>
            <input
              id="register-email"
              v-model.trim="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="Masukkan email"
              required
            />
            <p v-if="fieldErrors.email" class="auth-error">{{ fieldErrors.email[0] }}</p>
          </div>
          <div class="auth-field">
            <label for="register-name">Nama Lengkap</label>
            <input
              id="register-name"
              v-model.trim="name"
              name="name"
              type="text"
              autocomplete="name"
              placeholder="Masukkan nama lengkap"
              required
            />
            <p v-if="fieldErrors.name" class="auth-error">{{ fieldErrors.name[0] }}</p>
          </div>
          <div class="auth-field">
            <label for="register-password">Password</label>
            <input
              id="register-password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="new-password"
              placeholder="Minimal 8 karakter"
              required
            />
            <p v-if="fieldErrors.password" class="auth-error">{{ fieldErrors.password[0] }}</p>
          </div>
          <div class="auth-field">
            <label for="register-password-confirmation">Konfirmasi Password</label>
            <input
              id="register-password-confirmation"
              v-model="passwordConfirmation"
              name="password_confirmation"
              type="password"
              autocomplete="new-password"
              placeholder="Ulangi password"
              required
            />
          </div>
        </div>

        <div class="auth-actions">
          <p v-if="formError" class="auth-error" role="alert">{{ formError }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Registering…' : 'Register' }}
          </button>
          <p class="auth-switch">
            <span>Sudah punya akun?</span>
            <router-link to="/login">Login di sini</router-link>
          </p>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100svh;
  padding: var(--space-3);
  background-color: var(--color-background);
}

.auth-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-1);
  overflow: hidden;
  border-radius: 10px;
  background-color: var(--color-surface);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.25);
}

.auth-card--register {
  justify-content: space-between;
}

.auth-heading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 60px;
  padding: 0 var(--space-1);
}

.auth-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-1);
}

.auth-heading h1 {
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: 32px;
  font-weight: 600;
  line-height: normal;
}

.back-button {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--color-text);
  transition: background-color var(--transition-fast);
}

.back-button:hover {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.back-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.auth-heading p {
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  line-height: normal;
}

.auth-form,
.auth-fields {
  display: flex;
  flex-direction: column;
}

.auth-form {
  gap: 24px;
}

.auth-fields {
  gap: var(--space-1);
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--space-1);
}

.auth-field label {
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: 16px;
  line-height: normal;
}

.auth-field input {
  width: 100%;
  height: 46px;
  padding: var(--space-1);
  border: 0.5px solid #8a8a8a;
  border-radius: 10px;
  background-color: var(--color-background);
  color: var(--color-text);
  font: inherit;
  font-size: 16px;
}

.auth-field input::placeholder {
  color: #767676;
  opacity: 1;
}

.auth-field input:focus-visible {
  border-color: var(--color-primary);
  outline: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  outline-offset: 1px;
}

.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 var(--space-1);
}

.auth-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 50px;
  padding: var(--space-1);
  border-radius: 10px;
  background-color: var(--color-primary);
  color: var(--color-text-on-accent);
  font-family: var(--font-family-brand);
  font-size: 20px;
  font-weight: 600;
  line-height: normal;
  transition: background-color var(--transition-fast);
}

.auth-submit:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.auth-submit:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.auth-submit:disabled {
  cursor: wait;
  opacity: 0.7;
}

.auth-switch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: normal;
  text-align: center;
}

.auth-switch a {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  text-underline-offset: 2px;
}

.auth-switch a:hover {
  text-decoration: underline;
}

.auth-switch a:focus-visible {
  border-radius: 2px;
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.auth-error {
  color: #b42318;
  font-size: var(--font-size-sm);
  line-height: 1.4;
}
</style>