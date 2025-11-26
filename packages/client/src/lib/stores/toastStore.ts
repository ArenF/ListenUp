import { writable } from 'svelte/store';

/**
 * Toast 타입 정의
 */
export type ToastType = 'info' | 'warn' | 'error' | 'success';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

/**
 * Toast Store
 * - 화면에 표시될 Toast 알림을 관리
 * - 자동으로 제거되는 타이머 포함
 */
function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);
  let nextId = 0;

  return {
    subscribe,

    /**
     * Toast 표시
     * @param type - Toast 타입 (info, warn, error, success)
     * @param message - 표시할 메시지
     * @param duration - 표시 시간 (밀리초, 기본 3000ms)
     */
    show(type: ToastType, message: string, duration = 3000) {
      const id = nextId++;
      const toast: Toast = { id, type, message, duration };

      // Toast 추가
      update(toasts => [...toasts, toast]);

      // 지정된 시간 후 자동 제거
      setTimeout(() => {
        this.remove(id);
      }, duration);

      return id;
    },

    /**
     * 특정 Toast 제거
     * @param id - 제거할 Toast ID
     */
    remove(id: number) {
      update(toasts => toasts.filter(t => t.id !== id));
    },

    /**
     * 모든 Toast 제거
     */
    clear() {
      update(() => []);
    },

    /**
     * 빠른 접근을 위한 헬퍼 메서드
     */
    info(message: string, duration?: number) {
      return this.show('info', message, duration);
    },

    warn(message: string, duration?: number) {
      return this.show('warn', message, duration);
    },

    error(message: string, duration?: number) {
      return this.show('error', message, duration);
    },

    success(message: string, duration?: number) {
      return this.show('success', message, duration);
    },
  };
}

export const toastStore = createToastStore();
