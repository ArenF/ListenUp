import { toastStore, type ToastType } from '../stores/toastStore';
import { MESSAGES, type MessageCategory, type MessageKey } from './messages';

/**
 * 로그 레벨
 */
type LogLevel = 'info' | 'warn' | 'error' | 'success';

/**
 * Logger 옵션
 */
interface LogOptions {
  /** Toast 표시 여부 (기본: true) */
  showToast?: boolean;
  /** 콘솔 로그 여부 (기본: true) */
  consoleLog?: boolean;
  /** Toast 표시 시간 (밀리초, 기본: 3000) */
  duration?: number;
  /** 추가 상세 정보 (디버깅용) */
  details?: any;
}

/**
 * Logger 클래스
 * - 애플리케이션 전체의 로깅 및 사용자 알림을 관리
 * - alert() 대신 사용하여 일관된 UX 제공
 */
class Logger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * 에러 로그
   * - Toast: 빨간색
   * - 콘솔: console.error
   */
  error<T extends MessageCategory>(
    category: T,
    key: MessageKey<T>,
    options: LogOptions = {}
  ) {
    const message = MESSAGES[category][key] as string;
    this.log('error', message, options);
  }

  /**
   * 경고 로그
   * - Toast: 주황색
   * - 콘솔: console.warn
   */
  warn<T extends MessageCategory>(
    category: T,
    key: MessageKey<T>,
    options: LogOptions = {}
  ) {
    const message = MESSAGES[category][key] as string;
    this.log('warn', message, options);
  }

  /**
   * 정보 로그
   * - Toast: 파란색
   * - 콘솔: console.info
   */
  info<T extends MessageCategory>(
    category: T,
    key: MessageKey<T>,
    options: LogOptions = {}
  ) {
    const message = MESSAGES[category][key] as string;
    this.log('info', message, options);
  }

  /**
   * 성공 로그
   * - Toast: 초록색
   * - 콘솔: console.info
   */
  success<T extends MessageCategory>(
    category: T,
    key: MessageKey<T>,
    options: LogOptions = {}
  ) {
    const message = MESSAGES[category][key] as string;
    this.log('success', message, options);
  }

  /**
   * 커스텀 메시지 로그
   * - 메시지 정의 없이 직접 사용할 때
   * - 동적 메시지 (플레이어 이름 등)에 사용
   */
  custom(level: LogLevel, message: string, options: LogOptions = {}) {
    this.log(level, message, options);
  }

  /**
   * 내부 로그 처리
   */
  private log(level: LogLevel, message: string, options: LogOptions) {
    const {
      showToast = true,
      consoleLog = true,
      duration = 3000,
      details,
    } = options;

    // Toast 표시
    if (showToast) {
      const toastType = level as ToastType;
      toastStore.show(toastType, message, duration);
    }

    // 콘솔 로그 (개발 환경 또는 명시적 요청)
    if (consoleLog && this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      switch (level) {
        case 'error':
          console.error(prefix, message, details || '');
          break;
        case 'warn':
          console.warn(prefix, message, details || '');
          break;
        case 'success':
        case 'info':
          console.info(prefix, message, details || '');
          break;
      }
    }

    // 추후 확장: 서버로 에러 전송 (운영 환경)
    // if (!this.isDevelopment && level === 'error') {
    //   this.sendToServer(message, details);
    // }
  }

  /**
   * 추후 확장: 서버로 에러 로그 전송
   * - 에러 추적 서비스 (Sentry, LogRocket 등) 연동 가능
   */
  private async sendToServer(message: string, details?: any) {
    try {
      // 서버 엔드포인트로 에러 전송
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message, details, timestamp: new Date() })
      // });
    } catch (error) {
      // 에러 전송 실패 시 무시 (무한 루프 방지)
      console.error('Failed to send log to server:', error);
    }
  }
}

/**
 * Logger 싱글톤 인스턴스
 */
export const logger = new Logger();

/**
 * 빠른 접근을 위한 직접 export
 */
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logSuccess = logger.success.bind(logger);
export const logCustom = logger.custom.bind(logger);
