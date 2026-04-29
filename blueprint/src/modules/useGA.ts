type AnalyticsWindow = Window & {
    gtag?: (...args: unknown[]) => void;
    plausible?: (eventName: string, options?: unknown) => void;
};

export function useGA(eventName: string) {
    const analyticsWindow = window as AnalyticsWindow;

    if (typeof analyticsWindow.gtag === 'function') {
        analyticsWindow.gtag('event', eventName);
    }

    if (typeof analyticsWindow.plausible === 'function') {
        analyticsWindow.plausible(eventName);
    }
}
