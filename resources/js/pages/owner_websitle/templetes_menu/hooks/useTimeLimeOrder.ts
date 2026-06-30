import { useMemo } from 'react';
import { nullOrRequest } from '../nullOrRequest';

export interface TimelineStep {
    title: string;
    desc: string;
}

/**
 * Hook to resolve the current active status step index and configurations for the order timeline.
 */
export const useTimeLimeOrder = (status: string | undefined) => {
    const activeStep = useMemo(() => {
        const resolvedStatus = nullOrRequest(status);
        if (!resolvedStatus) return 0;
        const s = String(resolvedStatus).toLowerCase();
        if (s.includes('complete') || s.includes('deliver') || s.includes('complete')) return 3;
        if (s.includes('process')) return 2;
        if (s.includes('confirm') || s.includes('confirmed')) return 1;
        return 0; // default / pending
    }, [status]);

    const steps = useMemo<TimelineStep[]>(() => [
        { title: 'Order Placed', desc: 'Received & pending' },
        { title: 'Confirmed', desc: 'Order confirmed' },
        { title: 'Processing', desc: 'Preparing your items' },
        { title: 'Delivered', desc: 'Package received' }
    ], []);

    const isCanceled = useMemo(() => {
        const resolvedStatus = nullOrRequest(status);
        if (!resolvedStatus) return false;
        return String(resolvedStatus).toLowerCase().includes('cancel');
    }, [status]);

    return {
        activeStep,
        steps,
        isCanceled,
    };
};
