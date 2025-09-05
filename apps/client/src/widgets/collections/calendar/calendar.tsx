import { useEffect, useRef } from "preact/hooks";
import { CalendarOptions, Calendar as FullCalendar, PluginDef } from "@fullcalendar/core";

interface CalendarProps extends CalendarOptions {
    tabIndex?: number;
}

export default function Calendar({ tabIndex, ...options }: CalendarProps) {
    const calendarRef = useRef<FullCalendar>();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const calendar = new FullCalendar(containerRef.current, options);
        calendar.render();

        return () => calendar.destroy();
    }, [ containerRef, options ]);

    return (
        <div ref={containerRef} className="calendar-container" tabIndex={tabIndex} />
    );
}
