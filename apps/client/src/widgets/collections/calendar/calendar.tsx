import { useEffect, useRef } from "preact/hooks";
import { CalendarOptions, Calendar as FullCalendar, PluginDef } from "@fullcalendar/core";
import { RefObject } from "preact";

interface CalendarProps extends CalendarOptions {
    calendarRef?: RefObject<FullCalendar>;
    tabIndex?: number;
}

export default function Calendar({ tabIndex, calendarRef, ...options }: CalendarProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const calendar = new FullCalendar(containerRef.current, options);
        calendar.render();

        if (calendarRef) {
            calendarRef.current = calendar;
        }

        return () => calendar.destroy();
    }, [ containerRef, options ]);

    return (
        <div ref={containerRef} className="calendar-container" tabIndex={tabIndex} />
    );
}
