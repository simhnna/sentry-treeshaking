import { VERSION } from '@angular/core';
import {
  breadcrumbsIntegration,
  BrowserClient,
  BrowserOptions,
  browserTracingIntegration,
  captureConsoleIntegration,
  dedupeIntegration,
  defaultStackParser,
  getCurrentScope,
  globalHandlersIntegration,
  linkedErrorsIntegration,
  makeFetchTransport,
} from '@sentry/angular';
import { Integration } from '@sentry/types';

export interface SentryDefaultOptions {
  dsn: string;
  release: string;
  enableSessionReplays?: boolean;
  disableConsoleCapture?: boolean;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

function loadConfig(): SentryDefaultOptions | undefined {
  try {
    const data = document.getElementsByTagName('body').item(0)?.dataset[
      'sentryConfig'
    ];
    if (!data) {
      return;
    }
    const config = JSON.parse(data) as SentryDefaultOptions;
    return config;
  } catch (e) {
    console.warn('Failed to parse config attached to <body>', e);
  }
  return undefined;
}

export function initSentry(overrides: BrowserOptions = {}): boolean {
  const config = loadConfig();
  if (!config) {
    return false;
  }
  const integrations: Integration[] = [
    browserTracingIntegration(),
    breadcrumbsIntegration(),
    globalHandlersIntegration(),
    linkedErrorsIntegration(),
    dedupeIntegration(),
  ];

  if (!config.disableConsoleCapture) {
    integrations.push(captureConsoleIntegration({ levels: ['error'] }));
  }
  const client = new BrowserClient({
    dsn: config.dsn,
    release: config.release,
    beforeSend(event, hint) {
      event.tags = { ...event.tags, angular: VERSION.full };
      return event;
    },
    transport: makeFetchTransport,
    stackParser: defaultStackParser as any,
    integrations: integrations as any,
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    replaysSessionSampleRate: config.replaysSessionSampleRate ?? 0,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 1,
    attachStacktrace: true,
    ...overrides,
  });
  if (config.enableSessionReplays) {
    import('@sentry-internal/replay').then(({ replayIntegration }) => {
      client.addIntegration(
        replayIntegration({
          workerUrl: `./assets/sentry/worker.min.js`,
        })
      );
    });
  }

  getCurrentScope().setClient(client);
  client.init();
  return true;
}
