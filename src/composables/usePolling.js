import { onUnmounted } from 'vue';

export function usePolling(callback, intervalMs = 5000, options = {}) {
  let timer = null;
  let started = false;
  const { pauseWhenHidden = false, runImmediately = true } = options;

  function isDocumentHidden() {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden';
  }

  function schedule() {
    if (!started || (pauseWhenHidden && isDocumentHidden())) return;
    timer = setInterval(callback, intervalMs);
  }

  function handleVisibilityChange() {
    if (!pauseWhenHidden || !started) return;

    if (isDocumentHidden()) {
      clearInterval(timer);
      timer = null;
      return;
    }

    if (!timer) {
      callback();
      schedule();
    }
  }

  function start() {
    stop();
    started = true;
    if (runImmediately && (!pauseWhenHidden || !isDocumentHidden())) {
      callback();
    }
    schedule();
  }

  function stop() {
    started = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  if (pauseWhenHidden && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  onUnmounted(stop);
  onUnmounted(() => {
    if (pauseWhenHidden && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  return { start, stop };
}
