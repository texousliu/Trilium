import { useEffect, useRef } from "preact/hooks";
import { Calendar as FullCalendar, PluginDef } from "@fullcalendar/core";

interface CalendarProps {
    view: string;
    tabIndex?: number;
    plugins: PluginDef[];
}

export default function Calendar({ tabIndex, view, plugins }: CalendarProps) {
    const calendarRef = useRef<FullCalendar>();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const calendar = new FullCalendar(containerRef.current, {
            initialView: view,
            plugins: plugins
        });
        calendar.render();

        return () => calendar.destroy();
    }, [ containerRef ]);

    return (
        <div ref={containerRef} className="calendar-container" tabIndex={tabIndex} />
    );
}
