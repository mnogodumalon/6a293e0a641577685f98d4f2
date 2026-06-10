/**
 * CalendarWidget — pre-generated calendar widget set (Archetype B).
 *
 * @version 2.5.1
 * @since 2026-06-10  (2.5.1: span-bar polish. The bar TITLE now renders on
 *                     EVERY week segment (Google-style) — a bar continuing
 *                     from last week/month is never nameless; the squared-off
 *                     edge still signals the continuation. And when a week has
 *                     NO timed events (no hour grid below), the all-day strip
 *                     IS the view — its lanes grow to roomy two-line bars
 *                     (title + subtitle) instead of 20px ribbons.
 *                     2.5.0: three reference-calendar staples. (1) DRAG-TO-
 *                     CREATE: dragging across empty month cells or down an
 *                     empty hour column paints a range; `onRangeCreate(start,
 *                     end, group?)` fires on release — OFF until passed, the
 *                     plain `onEmptyClick` tap keeps working unchanged.
 *                     (2) NOW LINE: the week hour grid marks the current time
 *                     on today's column, self-updating. (3) `weekDays: 5 | 7`:
 *                     the WEEK view can hide Sat+Sun (working week) — month/
 *                     agenda/year are unaffected.)
 * @since 2026-06-10  (2.4.0: shared mechanics extracted to ./primitives (M4) —
 *                     date helpers, tone class-maps and the pointer-drag FSM
 *                     core now live there ONCE for the widget family. The drag
 *                     core gained edge AUTO-SCROLL (dragging near the edge of a
 *                     scrollable container/window scrolls it and re-targets)
 *                     and a touch LONG-PRESS (300 ms): a quick swipe on a chip
 *                     scrolls the page, holding still arms the drag. Public
 *                     API unchanged.)
 * @since 2026-06-09  (2.3.2: new `renderDayBackground(date)` slot — ADDS a
 *                     non-interactive layer BEHIND the events in each day cell
 *                     (month + week-board), e.g. a per-day utilization bar. Additive
 *                     like `renderDayBadge` (absolute / pointer-events-none / -z-10):
 *                     no layout shift, no stolen clicks — closes the documented
 *                     "no renderDayContent" gap without a footgun.
 *                     2.3.1: the built-in toolbar now renders INSIDE the card as a
 *                     framed header bar (border-b border-input + bg-secondary),
 *                     exactly like ResourceTimeline — so the widget is self-framing
 *                     and never depends on the consumer's padding to look right in a
 *                     dashboard.
 *                     2.3.0: the navigation toolbar (prev/next/today + view switch)
 *                     is now BUILT IN by default — like ResourceTimeline. The widget
 *                     self-manages cursor/view, so you no longer wire `useCalendar` +
 *                     `<CalendarToolbar>` to get navigation. `toolbar={false}` hides
 *                     it; `onCursorChange` steers it when the cursor is controlled.
 *                     2.2.0: `renderDayHeader` (full-replace) removed — the widget
 *                     now ALWAYS renders the day number itself; the new
 *                     `renderDayBadge(date)` only ADDS a node into the header slot,
 *                     so a consumer can no longer drop the date or shift the
 *                     multi-day bars by changing the header height.
 *                     2.1.0: Week-board day columns use a content-sized floor
 *                     `min-h-[140px]` (was 440px) — sparse rosters/boards no longer
 *                     leave a tall empty gap; dense days still grow past the floor.)
 * @since 2026-06-03  (Breaking: the empty-slot callback was renamed to the
 *                     family-wide `onEmptyClick(date, group?)`; PackedEvent is
 *                     now minute/duration-based, not pixel-based.)
 *
 * A time-oriented collection surface. You feed it a lean `CalendarEvent[]` and
 * behaviour callbacks; it owns the grid maths, day-bucketing, multi-day bars,
 * overflow and drag&drop. Compose; never reimplement.
 *
 * ─── HARD RULES (read first) ───────────────────────────────────────────
 *  1. A clicked event MUST open a <RecordOverlay> (from RecordView) — the
 *     calendar owns NO detail layer. Wire `onEventClick`; never render your
 *     own event-detail modal.
 *  2. Never edit this file (nor ./primitives.ts — the family's shared
 *     mechanics). If a slot is missing: unblock via children/render-prop
 *     + // TODO(widget-gap). Never fork, never leave the build red.
 *  3. The widget is data-agnostic: it never sees a Living-Apps field name. The
 *     consumer parses `record.fields.<x>` into `CalendarEvent.start` before
 *     passing the array. No `dateField` prop, no field knowledge here.
 *  4. Empty collection renders the empty grid IN-PLACE (or "no events" in the
 *     agenda) — never a centered "not found" box. That idiom is RecordView's.
 *  5. `start`/`end` are ISO strings: `YYYY-MM-DD` (all-day) or
 *     `YYYY-MM-DDTHH:MM` (timed, NO seconds — the Living-Apps norm). Parsing is
 *     timezone-safe (date-fns `parseISO`, local time) — never `new Date(str)`.
 *
 * ─── API at a glance (exact prop names — NEVER guess) ──────────────────
 *
 *  <CalendarWidget
 *     events                 CalendarEvent[]  — { id: string, start: string, end?: string, allDay?: boolean, title: ReactNode, subtitle?: ReactNode, tone? }
 *     view?                  'month' | 'agenda' | 'day' | 'week' | 'year'   (controlled; else self-managed)
 *     defaultView?           'month' | 'agenda' | 'day' | 'week' | 'year'   (uncontrolled seed; default 'month')
 *     referenceDate?         Date    (controlled cursor; else self-managed)
 *     defaultDate?           Date    (uncontrolled seed; default = today)
 *     weekStartsOn?          0 | 1   (default 1 = Monday)
 *     weekDays?              5 | 7   (WEEK view only: 5 = working week, Sat+Sun hidden — office
 *                                     schedules, content plans. Month/agenda/year always show all
 *                                     days; events on hidden days simply don't render. Default 7)
 *     locale?                date-fns Locale  (pass `de` for German weekday/month names)
 *     maxEventsPerDay?       number  (month overflow threshold; default 3)
 *     dayStartHour?          number  (week grid; default 7)
 *     dayEndHour?            number  (week grid; default 21)
 *     weekLayout?            'auto' | 'hours' | 'board'  (default 'auto' = day-cards when no timed events, else hour grid)
 *     heatmap?               boolean  (year view ONLY: true = density tint per day, else event-dot marker; default false)
 *     dragSnapMinutes?       number  (hour-grid time snap for click/drag/resize; default 15. ONE scalar — no dragConfig)
 *     toolbar?               boolean  (default true — built-in prev/next/today + view switch; `false` hides it)
 *     views?                 CalendarView[]  (which buttons the built-in toolbar shows; default month/week/day/agenda)
 *     onViewChange?          (view: CalendarView) => void
 *     onRangeChange?         (from: Date, to: Date) => void   — fires when the visible range changes (lazy-load hook)
 *     onCursorChange?        (cursor: Date) => void   — controlled-cursor steering: the built-in nav calls this (pair with referenceDate)
 *     onEventClick?          (event: CalendarEvent) => void   — open a <RecordOverlay>
 *     onEmptyClick?          (date: Date, group?: string) => void  — empty-slot tap. `group` is the family-wide signature
 *                                                              (ResourceTimeline supplies the resource row); HERE `group` is
 *                                                              ALWAYS undefined — the calendar has no second axis. In the hour
 *                                                              grid the Date carries the clicked CLOCK TIME (Y → snapped minute);
 *                                                              in month/board it is midnight (day only).
 *     onEventDrop?           (eventId: string, newStart: string, newEnd?: string) => void  — reschedule; DRAG IS OFF until you
 *                                                              pass this (consumer PATCHes + re-fetches). In the hour grid newStart
 *                                                              carries the dropped clock time; month/board stay day-granular.
 *                                                              newEnd is fired ONLY when the dragged `ev.end` exists (no end field →
 *                                                              newEnd stays undefined — patch only the start field).
 *     onEventResize?         (eventId: string, newStart: string, newEnd: string) => void  — change duration; RESIZE HANDLES ARE
 *                                                              OFF until you pass this. Only fires for events that HAVE an `ev.end`.
 *     onRangeCreate?         (start: Date, end: Date, group?: string) => void  — DRAG-TO-CREATE on empty space; OFF until you
 *                                                              pass this (a plain tap still fires onEmptyClick). Month: drag across
 *                                                              cells → day range, midnights, end day INCLUSIVE (like an all-day
 *                                                              event). Hour grid: drag vertically → clock times, snapped to
 *                                                              dragSnapMinutes, min one snap step. Fires DATES (like onEmptyClick),
 *                                                              NOT ISO strings (unlike onEventDrop) — format onto your field type.
 *                                                              `group` is the family-wide signature; HERE it is ALWAYS undefined.
 *     renderEvent?           (event: CalendarEvent, meta: EventSegmentMeta) => ReactNode  — full control of one event chip
 *     renderDayBadge?        (date: Date) => ReactNode        — ADDS a node into the day-cell header (e.g. holiday badge);
 *                                                              the widget keeps rendering the day number itself
 *     renderDayBackground?   (date: Date) => ReactNode        — ADDS a non-interactive layer BEHIND the events in each day
 *                                                              cell (month + week-board) — e.g. a per-day utilization bar
 *     dayClassName?          (date: Date) => string           — a CSS CLASS only (tint weekend/today); NOT content
 *     className?             string                           — appended to the shell
 *     children?              ReactNode                        — toolbar/filter/legend slot above the grid
 *  >
 *
 *  tone (CalendarEvent.tone, default 'default'): 'default' | 'primary' | 'success' | 'warning' | 'destructive'
 *    Exported as `CALENDAR_TONES` (const array) and `CalendarTone` (union type) — reference, don't transcribe.
 *  view / defaultView: 'month' | 'agenda' | 'day' | 'week' | 'year'
 *    Exported as `CALENDAR_VIEWS` (const array) and `CalendarView` (union type).
 *
 *  `renderEvent(ev, meta)` — `meta: { isStart, isEnd, isContinuation }` tells you
 *  whether this chip is the start/end of a multi-day span (round the matching
 *  edge). For a single-day event all three resolve to `{true,true,false}`.
 *  `dayClassName` returns a CSS class ONLY. `renderDayBadge` ADDS a node into the
 *  header next to the widget's own day number — it never replaces the date, so it
 *  cannot break the header height the multi-day bars are aligned to.
 *  `renderDayBackground` ADDS a layer behind the cell's events (absolute,
 *  pointer-events-none, -z-10) in the month + week-board layouts — it never affects
 *  layout or interaction. Compute the value from your data; the widget owns the cell.
 *
 *  useCalendar({ initialDate?, initialView?, weekStartsOn? }) ->
 *    { view, setView, cursor, setCursor, next, prev, today, range: { from, to } }
 *    For CONTROLLED nav ONLY (drive/steer cursor+view from outside). The toolbar is
 *    built into the widget by default — you do NOT need this to get navigation.
 *
 *  <CalendarToolbar calendar={useCalendar(...)} locale? />   — the SAME toolbar the widget renders
 *    by default. Compose it yourself ONLY to place it elsewhere — then set `toolbar={false}`.
 *  <CalendarSkeleton />                                      — loading grid placeholder
 *  <CalendarError error onRetry? />                          — load failure
 *
 * ─── ❌ COMMON MISTAKES (every one was a real build failure) ────────────
 *  • `tone: 'danger'` — does NOT exist. The closest is `'destructive'`. Use the
 *    exported `CALENDAR_TONES` array; anything richer than a colour belongs in renderEvent.
 *  • `parseId(ev.id)` — there is NO `parseId` helper anywhere in the repo. Build
 *    the id with a template literal (`` `buchung:${b.record_id}` ``) and read it
 *    back with `ev.id.split(':')` — exactly as the example.tsx does.
 *  • `onEmptyClick` ≠ ResourceTimeline's. There the second arg `group` is a real
 *    resource id; HERE `group` is ALWAYS undefined (no second axis). Wiring it as
 *    `(date, group) => bookForResource(group)` silently books for `undefined`.
 *  • raw `new Date('2026-06-03')` for an all-day date — parses as UTC midnight and
 *    drifts a day in negative offsets. The widget uses `parseISO`; so must you.
 *  • expecting `newEnd` in `onEventDrop` when the event has no `ev.end` — it stays
 *    undefined. Patch the end field only with `...(newEnd ? { bis: newEnd } : {})`.
 *  • treating `onRangeCreate`'s args like onEventDrop's — they are DATES, not ISO
 *    strings. Format them yourself (`format(start, 'yyyy-MM-dd')` for date/date,
 *    ISO_T-style for datetimeminute); writing the Date object raw fails the API.
 *
 * ─── When to use ──────────────────────────────────────────────────────
 *
 * Any time records carry a date and the user benefits from a time layout:
 * bookings, shifts, tasks, appointments, deadlines. There is NO routed calendar
 * page — YOU embed <CalendarWidget> directly in the dashboard and wire the
 * Living-Apps fields yourself: map records into CalendarEvent[], pass
 * onEventDrop/onEventResize that PATCH + re-fetch, open a <RecordOverlay> on
 * click. The widget is data-agnostic; the field names live in your consumer.
 *
 * Full compiling example: ./CalendarWidget.example.tsx
 *
 * Recurrence (RRULE) is intentionally NOT a widget concept — Living-Apps stores
 * single dates only. If a series ever exists, the consumer expands it into flat
 * CalendarEvent[] before passing it here; the widget never knows "recurrence".
 *
 * Year overview is a built-in `view: 'year'` (12 mini-months; `heatmap` toggles a
 * density tint). NEVER build a separate year/heatmap grid next to this widget —
 * pass `view="year"` and (optionally) `heatmap`; a day click drills down via
 * `onEmptyClick(date)`. To expose it in the toolbar, pass `views={['month', …, 'year']}`.
 *
 * ─── Tier 2 — exported layout primitives (the legal escape hatch) ──────
 * Need a surface the widget owns but no render-prop covers? Don't fork. Render
 * into `children` (or a render-prop) and lay it out with the exported geometry:
 *   visibleRange(cursor, view, weekStartsOn)  -> { from, to }
 *   packWeekBars(events, weekStart, weekEnd)  -> LaidOutBar[]   (lane / colStart / span — DAY indices, 0–6)
 *   packDayEvents(timed, day, dayStartHour)   -> PackedEvent[]  (minuteOffset / durationMinutes — turn into px in YOUR renderer)
 *   yToTime(day, offsetY, hourPx, dayStartHour, snapMinutes) -> Date
 * All `pack*` are generic over `<T extends { start: string; end?: string; allDay?: boolean }>`,
 * so they layout your own richer event shape, not just CalendarEvent. Exported
 * types are public contract from here on; mark any remaining gap `// TODO(widget-gap)`.
 */
import { type ReactNode, type ComponentType, type MutableRefObject, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Locale } from 'date-fns';
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval,
  isSameDay, isSameMonth, isToday, addMonths, addWeeks, addYears,
  addDays, startOfDay, differenceInCalendarDays, getHours, getMinutes,
  differenceInMinutes, addMinutes, set as setTime, max as maxDate, min as minDate, isValid,
} from 'date-fns';
import {
  IconChevronLeft, IconChevronRight, IconCalendarOff, IconAlertCircle, IconRefresh, IconPlus,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
// Shared widget MECHANICS (M4) — date math, tone class-maps, drag-FSM core.
// Sister widgets never import each other; BOTH import './primitives'.
import {
  TONE_DOT, TONE_BAR, TONE_ACCENT,
  isAllDay, eventStart, eventEnd, isMultiDay, occursOn, eventOrder,
  usePointerDrag, type DragGesture, type DragMode, type TimeSpan,
} from './primitives';

// Closed enums — exported as const arrays so consumers reference instead of
// transcribe (a mistyped 'danger' was a real build failure). The union types are
// derived from the arrays, so the two can never drift apart.
export const CALENDAR_VIEWS = ['month', 'agenda', 'day', 'week', 'year'] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];
export const CALENDAR_TONES = ['default', 'primary', 'success', 'warning', 'destructive'] as const;
export type CalendarTone = (typeof CALENDAR_TONES)[number];

export type CalendarEvent = {
  id: string;
  /** ISO 'YYYY-MM-DD' (all-day) or 'YYYY-MM-DDTHH:MM' (timed). */
  start: string;
  /** ISO end. Set → multi-day / time-span. For all-day spans the end day is inclusive. */
  end?: string;
  /** Explicit all-day flag. The consumer knows the LA field type and sets it. */
  allDay?: boolean;
  title: ReactNode;
  /** Optional secondary line under the title in board/list cards (e.g. "Frühschicht · Kasse 1"). */
  subtitle?: ReactNode;
  tone?: CalendarTone;
};

/** Passed to renderEvent so a multi-day chip can round only its real edges. */
export type EventSegmentMeta = { isStart: boolean; isEnd: boolean; isContinuation: boolean };

const FULL_META: EventSegmentMeta = { isStart: true, isEnd: true, isContinuation: false };

// Tone class-maps (TONE_DOT/TONE_BAR/TONE_ACCENT) and the date helpers
// (isAllDay/eventStart/eventEnd/isMultiDay/occursOn/eventOrder) are shared
// family MECHANICS — imported from './primitives' (M4), defined once there.

// ── TimeSpan — re-exported: part of THIS widget's public contract ────────
// The pack* primitives (§6) are generic over
// `<T extends { start: string; end?: string; allDay?: boolean }>` — consumers
// import `TimeSpan` from this widget, the shared definition lives in
// './primitives'. CalendarEvent extends it.
export type { TimeSpan } from './primitives';

// ── useCalendar — navigation/state for a controlled widget + toolbar ────

export type UseCalendarOptions = { initialDate?: Date; initialView?: CalendarView; weekStartsOn?: 0 | 1 };
export type CalendarController = {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  cursor: Date;
  setCursor: (d: Date) => void;
  next: () => void;
  prev: () => void;
  today: () => void;
  range: { from: Date; to: Date };
};

export function useCalendar(opts: UseCalendarOptions = {}): CalendarController {
  const { initialView = 'month', weekStartsOn = 1 } = opts;
  const [view, setView] = useState<CalendarView>(initialView);
  const [cursor, setCursor] = useState<Date>(() => opts.initialDate ?? new Date());

  const range = useMemo(() => visibleRange(cursor, view, weekStartsOn), [cursor, view, weekStartsOn]);

  const step = useCallback((dir: 1 | -1) => {
    setCursor(c => {
      if (view === 'year') return addYears(c, dir);
      if (view === 'month' || view === 'agenda') return addMonths(c, dir);
      if (view === 'week') return addWeeks(c, dir);
      return addDays(c, dir); // 'day'
    });
  }, [view]);

  return {
    view, setView, cursor, setCursor,
    next: () => step(1),
    prev: () => step(-1),
    today: () => setCursor(new Date()),
    range,
  };
}

/** The visible window for a (cursor, view) — the lazy-load range a consumer can
 *  reuse to scope its own fetch. Exported Tier-2 primitive (§6). */
export function visibleRange(cursor: Date, view: CalendarView, weekStartsOn: 0 | 1): { from: Date; to: Date } {
  if (view === 'year') {
    // Whole year, snapped to the mini-month grid edges so the lazy-load range
    // covers every rendered day (first week-start of Jan → last week-end of Dec).
    return {
      from: startOfWeek(startOfYear(cursor), { weekStartsOn }),
      to: endOfWeek(endOfYear(cursor), { weekStartsOn }),
    };
  }
  if (view === 'month' || view === 'agenda') {
    return {
      from: startOfWeek(startOfMonth(cursor), { weekStartsOn }),
      to: endOfWeek(endOfMonth(cursor), { weekStartsOn }),
    };
  }
  if (view === 'week') {
    return { from: startOfWeek(cursor, { weekStartsOn }), to: endOfWeek(cursor, { weekStartsOn }) };
  }
  return { from: startOfDay(cursor), to: startOfDay(cursor) }; // 'day'
}

// ── Toolbar ─────────────────────────────────────────────────────────────

const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Monat', week: 'Woche', day: 'Tag', agenda: 'Agenda', year: 'Jahr',
};

type CalendarToolbarProps = {
  calendar: CalendarController;
  locale?: Locale;
  views?: CalendarView[];
  className?: string;
};

export function CalendarToolbar({ calendar, locale, views = ['month', 'week', 'day', 'agenda'], className }: CalendarToolbarProps) {
  const { view, cursor } = calendar;
  const title =
    view === 'year' ? format(cursor, 'yyyy', { locale })
    : view === 'day' ? format(cursor, 'EEEE, d. MMMM yyyy', { locale })
    : view === 'week' ? `${format(calendar.range.from, 'd. MMM', { locale })} – ${format(calendar.range.to, 'd. MMM yyyy', { locale })}`
    : format(cursor, 'MMMM yyyy', { locale });
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3${className ? ` ${className}` : ''}`}>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={calendar.prev} aria-label="Zurück">
          <IconChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={calendar.today}>Heute</Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={calendar.next} aria-label="Weiter">
          <IconChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="ml-1 text-base font-semibold text-foreground capitalize">{title}</h2>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-muted p-1">
        {views.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => calendar.setView(v)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────

type CalendarWidgetProps = {
  events: CalendarEvent[];
  view?: CalendarView;
  defaultView?: CalendarView;
  referenceDate?: Date;
  defaultDate?: Date;
  weekStartsOn?: 0 | 1;
  /** WEEK view only: 5 = working week (Sat+Sun hidden). Default 7. */
  weekDays?: 5 | 7;
  locale?: Locale;
  maxEventsPerDay?: number;
  dayStartHour?: number;
  dayEndHour?: number;
  weekLayout?: 'auto' | 'hours' | 'board';
  heatmap?: boolean;
  dragSnapMinutes?: number;
  toolbar?: boolean;
  views?: CalendarView[];
  onViewChange?: (view: CalendarView) => void;
  onRangeChange?: (from: Date, to: Date) => void;
  onCursorChange?: (cursor: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEmptyClick?: (date: Date, group?: string) => void;
  onEventDrop?: (eventId: string, newStart: string, newEnd?: string) => void;
  onEventResize?: (eventId: string, newStart: string, newEnd: string) => void;
  onRangeCreate?: (start: Date, end: Date, group?: string) => void;
  renderEvent?: (event: CalendarEvent, meta: EventSegmentMeta) => ReactNode;
  renderDayBadge?: (date: Date) => ReactNode;
  renderDayBackground?: (date: Date) => ReactNode;
  dayClassName?: (date: Date) => string;
  className?: string;
  children?: ReactNode;
};

export function CalendarWidget(props: CalendarWidgetProps) {
  const {
    events, weekStartsOn = 1, weekDays = 7, locale, maxEventsPerDay = 3,
    dayStartHour = 7, dayEndHour = 21, weekLayout = 'auto', heatmap = false,
    dragSnapMinutes = 15, toolbar = true, views,
    onViewChange, onRangeChange, onCursorChange, onEventClick, onEmptyClick, onEventDrop, onEventResize, onRangeCreate,
    renderEvent, renderDayBadge, renderDayBackground, dayClassName, className, children,
  } = props;

  // Controlled (props) vs self-managed (internal state).
  const [internalView, setInternalView] = useState<CalendarView>(props.defaultView ?? 'month');
  const [internalCursor, setInternalCursor] = useState<Date>(() => props.defaultDate ?? new Date());
  const view = props.view ?? internalView;
  const cursor = props.referenceDate ?? internalCursor;
  const setView = useCallback((v: CalendarView) => { setInternalView(v); onViewChange?.(v); }, [onViewChange]);
  // Self-managed cursor moves (e.g. drilling from a month "+N more" into that
  // day). A no-op when controlled via referenceDate — cursor reads the prop
  // first — exactly like setView vs internalView.
  const setCursor = useCallback((d: Date) => { setInternalCursor(d); onCursorChange?.(d); }, [onCursorChange]);

  // Guard malformed/empty date strings: parseISO returns Invalid Date (never
  // throws), which would crash format(...) downstream. Filter once here.
  const safeEvents = useMemo(() => events.filter(e => !!e.start && isValid(parseISO(e.start))), [events]);

  const range = useMemo(() => visibleRange(cursor, view, weekStartsOn), [cursor, view, weekStartsOn]);

  // onRangeChange fires whenever the visible window changes (lazy-load hook).
  const fromKey = range.from.getTime();
  const toKey = range.to.getTime();
  useEffect(() => { onRangeChange?.(new Date(fromKey), new Date(toKey)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [fromKey, toKey]);

  // Built-in navigation — the toolbar is part of the widget (like ResourceTimeline),
  // so a consumer can never ship a stuck, un-navigable calendar. Self-managed when
  // uncontrolled; prev/next/today route through setCursor (→ onCursorChange when the
  // cursor is controlled), the view-switch through setView (→ onViewChange).
  const stepCursor = useCallback((dir: 1 | -1) => {
    if (view === 'year') return setCursor(addYears(cursor, dir));
    if (view === 'month' || view === 'agenda') return setCursor(addMonths(cursor, dir));
    if (view === 'week') return setCursor(addWeeks(cursor, dir));
    return setCursor(addDays(cursor, dir));
  }, [view, cursor, setCursor]);
  const builtInCalendar = {
    view, setView, cursor, setCursor,
    next: () => stepCursor(1), prev: () => stepCursor(-1), today: () => setCursor(new Date()),
    range,
  };

  const ctx: ViewContext = {
    events: safeEvents, cursor, weekStartsOn, weekDays, locale, maxEventsPerDay, dayStartHour, dayEndHour, weekLayout, heatmap, dragSnapMinutes,
    onEventClick, onEmptyClick, onEventDrop, onEventResize, onRangeCreate, renderEvent, renderDayBadge, renderDayBackground, dayClassName, setView, setCursor,
  };

  return (
    <div className={`flex flex-col gap-4${className ? ` ${className}` : ''}`}>
      {children}
      <div className="rounded-[27px] bg-card shadow-lg overflow-hidden">
        {toolbar !== false && (
          <div className="border-b border-input bg-secondary px-4 py-2.5">
            <CalendarToolbar calendar={builtInCalendar} locale={locale} views={views} />
          </div>
        )}
        {view === 'month' && <MonthView {...ctx} />}
        {view === 'week' && <WeekView {...ctx} />}
        {view === 'day' && <DayView {...ctx} />}
        {view === 'agenda' && <AgendaView {...ctx} />}
        {view === 'year' && <YearView {...ctx} />}
      </div>
    </div>
  );
}

type ViewContext = {
  events: CalendarEvent[];
  cursor: Date;
  weekStartsOn: 0 | 1;
  weekDays: 5 | 7;
  locale?: Locale;
  maxEventsPerDay: number;
  dayStartHour: number;
  dayEndHour: number;
  weekLayout: 'auto' | 'hours' | 'board';
  heatmap: boolean;
  dragSnapMinutes: number;
  onEventClick?: (event: CalendarEvent) => void;
  onEmptyClick?: (date: Date, group?: string) => void;
  onEventDrop?: (eventId: string, newStart: string, newEnd?: string) => void;
  onEventResize?: (eventId: string, newStart: string, newEnd: string) => void;
  onRangeCreate?: (start: Date, end: Date, group?: string) => void;
  renderEvent?: (event: CalendarEvent, meta: EventSegmentMeta) => ReactNode;
  renderDayBadge?: (date: Date) => ReactNode;
  renderDayBackground?: (date: Date) => ReactNode;
  dayClassName?: (date: Date) => string;
  setView: (v: CalendarView) => void;
  setCursor: (d: Date) => void;
};

// ── Drag&Drop — widget geometry + commit over the shared FSM core (M4) ──
// The gesture LIFECYCLE (window listeners with one teardown path, the move
// threshold, touch long-press, Escape cancel, edge auto-scroll) lives in
// `usePointerDrag` (./primitives), once for the family. THIS widget supplies
// the parts only it knows:
//
//  • GEOMETRY hit-test, not elementFromPoint. At gesture start the active view
//    hands the core a `Geometry` snapshot built from its live cell rects. On
//    move, `resolve` turns the cursor into the target day (and, in the hour
//    grid, the snapped clock minute) with pure math — so the absolutely-
//    positioned month bars can never swallow the hit-test, and targeting stays
//    smooth across bars and empty space alike.
//  • LIVE PREVIEW. `resolve` snaps a preview {start,end,…} to the target
//    day/time; resize grows/shrinks the dragged edge in real time. Views read
//    `dnd.preview` to paint a translucent ghost at the destination (month bar,
//    hour block) and a size/time label — the user sees WHERE/HOW BIG before
//    releasing.
//  • COMMIT semantics. The no-op guards, the ISO formatting and the exact
//    callback contract (`newEnd` fires ONLY when the event HAS an `ev.end`)
//    live here, next to the API they implement.

// Layout snapshot captured by the active view at gesture start. `dayAt`
// translates an absolute client point into the target day cell (resolved from
// the view's live cell rects — month weeks wrap naturally because each cell is
// its own rect). `minuteAt` is set on the hour grid only (Y → clock minute of
// the cursor day, snapped); null in month/board so those stay day-granular.
type Geometry = {
  /** Resolve the day under the client point from the view's cell rects. */
  dayAt: (clientX: number, clientY: number) => Date | null;
  /** Hour grid only: snapped clock minute-of-day under client Y; null elsewhere. */
  minuteAt: ((clientY: number) => number) | null;
};

// What resolve() produces and the views render as a live preview. `start`/`end`
// are the snapped destination dates; `mode` lets the view pick the right overlay
// (a moved chip/bar vs. a stretched edge).
type DragPreview = {
  id: string;
  start: Date;
  end: Date;
  allDay: boolean;
  mode: DragMode;
};

const ISO_T = "yyyy-MM-dd'T'HH:mm";

// The phantom-event id of a drag-to-create gesture (the anchor lives in the
// phantom's `start`; no real event carries this id — `safeEvents` come from the
// consumer's records).
const CREATE_ID = '__create__';

function useEventDrag(
  onEventDrop?: ViewContext['onEventDrop'],
  onEventResize?: ViewContext['onEventResize'],
  onRangeCreate?: ViewContext['onRangeCreate'],
  dragSnapMinutes = 15,
) {
  // Resolve the live preview from the cursor. Pure geometry + date math; sets no
  // app state — only the local preview/highlight the views paint. Returns the
  // snapped {start,end} or null when the cursor is off any cell. (A plain
  // function, not useCallback: the core reads the freshest options via its
  // optsRef, so this closes over the current dragSnapMinutes.)
  const resolve = (g: DragGesture<CalendarEvent, Geometry>, clientX: number, clientY: number): DragPreview | null => {
    const day = g.geom.dayAt(clientX, clientY);
    if (!day) return null;
    const ev = g.ev;
    const allDay = isAllDay(ev);
    const minute = g.geom.minuteAt ? g.geom.minuteAt(clientY) : null;

    if (g.mode === 'create') {
      // Drag-to-create: the phantom event's `start` is the ANCHOR (where the
      // gesture began); the cursor sets the other edge. Hour grid → clock
      // times (min one snap step); month → day range (end day inclusive).
      const anchor = eventStart(ev);
      if (minute != null) {
        const cur = setMinutesOfDay(startOfDay(day), minute);
        const lo = minDate([anchor, cur]);
        let hi = maxDate([anchor, cur]);
        const snap = Math.max(1, dragSnapMinutes);
        if (differenceInMinutes(hi, lo) < snap) hi = addMinutes(lo, snap);
        return { id: CREATE_ID, start: lo, end: hi, allDay: false, mode: g.mode };
      }
      const a = startOfDay(anchor), d = startOfDay(day);
      return { id: CREATE_ID, start: minDate([a, d]), end: maxDate([a, d]), allDay: true, mode: g.mode };
    }

    if (g.mode !== 'move') {
      // Resize the dragged edge, keep the opposite one. Hour grid (minute != null):
      // snap to the clock time. All-day strip span bar (minute == null): snap to the
      // target DAY, keep the opposite edge's clock time. Min 1 minute / 1 day.
      if (!ev.end) return null;
      const curStart = eventStart(ev), curEnd = eventEnd(ev);
      let ns = curStart, ne = curEnd;
      if (minute != null) {
        const dropTime = setMinutesOfDay(startOfDay(day), minute);
        if (g.mode === 'resize-end') ne = maxDate([dropTime, addMinutes(curStart, 1)]);
        else ns = minDate([dropTime, addMinutes(curEnd, -1)]);
      } else if (g.mode === 'resize-end') {
        const d = maxDate([startOfDay(day), startOfDay(curStart)]);
        ne = allDay ? d : setTime(d, { hours: getHours(curEnd), minutes: getMinutes(curEnd) });
      } else {
        const d = minDate([startOfDay(day), startOfDay(curEnd)]);
        ns = allDay ? d : setTime(d, { hours: getHours(curStart), minutes: getMinutes(curStart) });
      }
      return { id: ev.id, start: ns, end: ne, allDay, mode: g.mode };
    }

    // Move: shift the whole booking by the grab-relative day delta (dropDay −
    // grabDay), NOT by snapping the start under the cursor — otherwise a
    // multi-day bar grabbed in the middle jumps so it *starts* under the cursor.
    // In the hour grid (minute != null) the start follows the cursor minute.
    if (minute != null) {
      const start = setMinutesOfDay(startOfDay(day), minute);
      const end = ev.end ? addMinutes(start, differenceInMinutes(eventEnd(ev), eventStart(ev))) : start;
      return { id: ev.id, start, end, allDay, mode: g.mode };
    }
    const deltaDays = g.grabDay ? differenceInCalendarDays(startOfDay(day), startOfDay(g.grabDay)) : 0;
    const movedStart = addDays(eventStart(ev), deltaDays);
    const start = allDay ? startOfDay(movedStart) : movedStart;   // day move keeps the original clock time
    let end = start;
    if (ev.end) {
      end = allDay
        ? addDays(start, g.days)
        : setTime(addDays(start, g.days), { hours: getHours(eventEnd(ev)), minutes: getMinutes(eventEnd(ev)) });
    }
    return { id: ev.id, start, end, allDay, mode: g.mode };
  };

  return usePointerDrag<CalendarEvent, Geometry, DragPreview>({
    moveEnabled: !!onEventDrop,
    resizeEnabled: !!onEventResize,
    createEnabled: !!onRangeCreate,
    grabDayAt: (geom, clientX, clientY) => geom.dayAt(clientX, clientY),
    resolve,
    targetKey: p => format(p.start, 'yyyy-MM-dd'),   // "yyyy-MM-dd" cell to highlight
    // Fire the callback iff the drop is valid AND a real change. No target / no
    // change → clean snap-back (the core already tore the gesture down).
    commit: (g, p) => {
      if (!p) return;
      const ev = g.ev;

      if (g.mode === 'create') {
        // Drag-to-create commits DATES (like onEmptyClick) — the consumer
        // formats onto its field type. `group` stays undefined (no second axis).
        onRangeCreate?.(p.start, p.end);
        return;
      }

      if (g.mode !== 'move') {
        if (!onEventResize) return;
        const fmt = (d: Date) => p.allDay ? format(d, 'yyyy-MM-dd') : format(d, ISO_T);
        const ns = fmt(p.start), ne = fmt(p.end);
        const curS = p.allDay ? format(startOfDay(eventStart(ev)), 'yyyy-MM-dd') : format(eventStart(ev), ISO_T);
        const curE = p.allDay ? format(startOfDay(eventEnd(ev)), 'yyyy-MM-dd') : format(eventEnd(ev), ISO_T);
        if (ns === curS && ne === curE) return;  // no-op
        onEventResize(ev.id, ns, ne);
        return;
      }

      if (!onEventDrop) return;
      const startStr = p.allDay ? format(p.start, 'yyyy-MM-dd') : format(p.start, ISO_T);
      const curStartStr = p.allDay ? format(startOfDay(eventStart(ev)), 'yyyy-MM-dd') : format(eventStart(ev), ISO_T);
      if (startStr === curStartStr) return;   // no-op (same day & same clock time)
      const endStr = ev.end ? (p.allDay ? format(p.end, 'yyyy-MM-dd') : format(p.end, ISO_T)) : undefined;
      onEventDrop(ev.id, startStr, endStr);
    },
  });
}

type EventDrag = ReturnType<typeof useEventDrag>;

// Snap a Date to a given minute-of-day (minute already snapped to the grid).
function setMinutesOfDay(day: Date, minute: number): Date {
  return setTime(startOfDay(day), { hours: Math.floor(minute / 60), minutes: Math.round(minute % 60), seconds: 0, milliseconds: 0 });
}

// ── Month view ───────────────────────────────────────────────────────────

function MonthView(ctx: ViewContext) {
  const { events, cursor, weekStartsOn, locale, maxEventsPerDay } = ctx;
  const dnd = useEventDrag(ctx.onEventDrop, undefined, ctx.onRangeCreate, ctx.dragSnapMinutes);

  const days = useMemo(() => {
    const from = startOfWeek(startOfMonth(cursor), { weekStartsOn });
    const to = endOfWeek(endOfMonth(cursor), { weekStartsOn });
    return eachDayOfInterval({ start: from, end: to });
  }, [cursor, weekStartsOn]);

  const weeks = useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  const weekdayLabels = days.slice(0, 7).map(d => format(d, 'EEEEEE', { locale }));

  // Geometry hit-test: every day cell registers its live rect here (keyed by
  // ISO). dayAt() finds the rect that contains the cursor — month weeks wrap
  // naturally because each cell is its own rect, so the right row resolves on
  // its own. minuteAt is null (month is day-granular). The absolutely-stacked
  // multi-day bars no longer matter — we never read elementFromPoint.
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const geom = useCallback((): Geometry => ({
    dayAt: (clientX, clientY) => {
      for (const [iso, el] of Array.from(cellRefs.current.entries())) {
        const r = el.getBoundingClientRect();
        if (clientX >= r.left && clientX < r.right && clientY >= r.top && clientY < r.bottom) return parseISO(iso);
      }
      return null;
    },
    minuteAt: null,
  }), []);

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 border-b border-input bg-secondary">
        {weekdayLabels.map((w, i) => (
          <div key={i} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground text-center">{w}</div>
        ))}
      </div>
      <div className="flex flex-col">
        {weeks.map((week, wi) => (
          <MonthWeekRow key={wi} week={week} ctx={ctx} dnd={dnd} geom={geom} cellRefs={cellRefs} events={events} maxEventsPerDay={maxEventsPerDay} isLast={wi === weeks.length - 1} />
        ))}
      </div>
    </div>
  );
}

// Result of packWeekBars: a multi-day span clipped to ONE week. Geometry is in
// SEMANTIC units — `lane` is the stacking row, `colStart`/`span` are DAY indices
// (0–6 within the week). No pixels: the renderer turns columns into widths. The
// type is generic over the event shape so a consumer can pack its own events.
export type LaidOutBar<T extends TimeSpan = CalendarEvent> = { ev: T; lane: number; colStart: number; span: number; isStart: boolean; isEnd: boolean };

// Greedy lane packing for the multi-day bars of ONE week (clipped to it). Pulled
// out of the row so the live preview can re-pack the week WITH the dragged event
// at its destination and land it in its true lane (not always lane 0). Exported
// Tier-2 primitive (§6); generic over the event shape (any { start, end?, allDay? }).
export function packWeekBars<T extends TimeSpan>(events: T[], weekStart: Date, weekEnd: Date): LaidOutBar<T>[] {
  const spanning = events
    .filter(ev => isMultiDay(ev) && eventEnd(ev) >= weekStart && eventStart(ev) <= weekEnd)
    .sort(eventOrder);
  const laneEnds: number[] = []; // lane → last occupied column index
  const out: LaidOutBar<T>[] = [];
  for (const ev of spanning) {
    const segStart = maxDate([startOfDay(eventStart(ev)), weekStart]);
    const segEnd = minDate([startOfDay(eventEnd(ev)), weekEnd]);
    const colStart = differenceInCalendarDays(segStart, weekStart);
    const span = differenceInCalendarDays(segEnd, segStart) + 1;
    let lane = laneEnds.findIndex(end => end < colStart);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(colStart + span - 1); }
    else laneEnds[lane] = colStart + span - 1;
    out.push({
      ev, lane, colStart, span,
      isStart: isSameDay(startOfDay(eventStart(ev)), segStart),
      isEnd: isSameDay(startOfDay(eventEnd(ev)), segEnd),
    });
  }
  return out;
}

// A CalendarEvent placed at the preview's destination, so a week row can lane-
// pack it WITH the other events and the preview lands in its true lane. Carries
// the source title/tone (found by id). Always multi-day-shaped (start != end is
// possible; for a single-day move it still renders as a 1-col preview chip).
function previewToEvent(p: DragPreview, events: CalendarEvent[]): CalendarEvent {
  const src = events.find(e => e.id === p.id);
  return {
    id: p.id,
    title: src?.title ?? '',
    tone: src?.tone,
    allDay: p.allDay,
    start: format(p.start, p.allDay ? 'yyyy-MM-dd' : ISO_T),
    end: format(p.end, p.allDay ? 'yyyy-MM-dd' : ISO_T),
  };
}

function MonthWeekRow({ week, ctx, dnd, geom, cellRefs, events, maxEventsPerDay, isLast }: {
  week: Date[]; ctx: ViewContext; dnd: EventDrag; geom: () => Geometry; cellRefs: MutableRefObject<Map<string, HTMLElement>>; events: CalendarEvent[]; maxEventsPerDay: number; isLast: boolean;
}) {
  const weekStart = week[0];
  const weekEnd = week[6];
  const { locale, cursor } = ctx;

  // Multi-day events → clipped bar segments with greedy lane packing.
  const bars = useMemo<LaidOutBar[]>(() => packWeekBars(events, weekStart, weekEnd), [events, weekStart, weekEnd]);

  // Live move/resize preview: does the dragged event land in THIS week? Re-pack
  // the week with the dragged event substituted at its destination so the dashed
  // bar lands in its real lane. A single-day move shows as a 1-col preview chip.
  const preview = dnd.preview;
  const previewBar = useMemo<LaidOutBar | null>(() => {
    if (!preview) return null;
    if (startOfDay(preview.end) < weekStart || startOfDay(preview.start) > weekEnd) return null;
    const subbed = [...events.filter(e => e.id !== preview.id), previewToEvent(preview, events)];
    const repacked = packWeekBars(subbed, weekStart, weekEnd);
    // packWeekBars only keeps multi-day events; a single-day move won't be in it —
    // synthesize a 1-col bar in that case so the destination is always visible.
    const found = repacked.find(b => b.ev.id === preview.id);
    if (found) return found;
    const segStart = maxDate([startOfDay(preview.start), weekStart]);
    const segEnd = minDate([startOfDay(preview.end), weekEnd]);
    const colStart = differenceInCalendarDays(segStart, weekStart);
    const span = differenceInCalendarDays(segEnd, segStart) + 1;
    const lane = repacked.reduce((m, b) => Math.max(m, b.lane + 1), 0);
    return { ev: previewToEvent(preview, events), lane, colStart, span, isStart: true, isEnd: true };
  }, [preview, events, weekStart, weekEnd]);
  const previewTone = preview ? (events.find(e => e.id === preview.id)?.tone ?? 'primary') : 'primary';

  return (
    <div className={`relative grid grid-cols-7${isLast ? '' : ' border-b border-border'}`}>
      {/* Day cells (single-day markers + overflow live here) */}
      {week.map((day, di) => {
        const iso = format(day, 'yyyy-MM-dd');
        const single = events
          .filter(ev => !isMultiDay(ev) && occursOn(ev, day))
          .sort(eventOrder);
        const dayBars = bars.filter(b => di >= b.colStart && di < b.colStart + b.span);
        const dayLanes = dayBars.reduce((m, b) => Math.max(m, b.lane + 1), 0);
        const room = Math.max(0, maxEventsPerDay - dayBars.length);
        const shown = single.slice(0, room);
        const overflow = single.length - shown.length;
        const outside = !isSameMonth(day, cursor);
        const extra = ctx.dayClassName?.(day) ?? '';
        const isTarget = dnd.dropTarget === iso;
        return (
          <div
            key={di}
            ref={(el) => { if (el) cellRefs.current.set(iso, el); else cellRefs.current.delete(iso); }}
            onClick={() => { if (dnd.consumeClick()) return; ctx.onEmptyClick?.(day); }}
            // Drag-to-create: pointerdown on the EMPTY cell starts a 'create'
            // gesture (chips/bars stopPropagation, so they never reach here).
            // The phantom event carries the anchor day; a plain click (no drag)
            // still fires onEmptyClick above — the post-drag click is swallowed.
            onPointerDown={dnd.creatable ? (e) => dnd.begin({ id: CREATE_ID, start: iso, allDay: true, title: '' }, e, geom(), 'create') : undefined}
            className={`relative isolate min-h-[112px] border-r border-border last:border-r-0 p-1.5 flex flex-col gap-1 ${outside ? 'bg-muted/30' : ''} ${isTarget ? 'ring-2 ring-inset ring-primary/60' : ''} ${ctx.onEmptyClick ? 'cursor-pointer' : ''} ${extra}`}
          >
            {ctx.renderDayBackground && <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">{ctx.renderDayBackground(day)}</div>}
            <div className="flex items-center justify-between">
              <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium ${isToday(day) ? 'bg-primary text-primary-foreground' : outside ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                {format(day, 'd', { locale })}
              </span>
              {ctx.renderDayBadge?.(day)}
            </div>
            {/* Spacer reserving the lanes used by multi-day bars in this row */}
            {dayLanes > 0 && <div style={{ height: `${dayLanes * 24}px` }} aria-hidden />}
            <div className="flex flex-col gap-1 min-w-0">
              {shown.map(ev => <EventChip key={ev.id} ev={ev} meta={FULL_META} ctx={ctx} dnd={dnd} geom={geom} />)}
              {overflow > 0 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); ctx.setCursor(day); ctx.setView('day'); ctx.onEmptyClick?.(day); }} className="text-left text-xs font-medium text-muted-foreground hover:text-foreground px-1">
                  +{overflow} mehr
                </button>
              )}
            </div>
          </div>
        );
      })}
      {/* Multi-day bars overlaid on the grid (absolute, aligned to columns) */}
      {bars.map((b, i) => (
        <div
          key={`${b.ev.id}-${i}`}
          className="absolute pointer-events-none"
          style={{ top: `${34 + b.lane * 24}px`, left: `calc(${(b.colStart / 7) * 100}% + 4px)`, width: `calc(${(b.span / 7) * 100}% - 8px)`, height: '20px' }}
        >
          <div className="pointer-events-auto h-full">
            <EventBar ev={b.ev} meta={{ isStart: b.isStart, isEnd: b.isEnd, isContinuation: !b.isStart }} ctx={ctx} dnd={dnd} geom={geom} />
          </div>
        </div>
      ))}
      {/* Live destination preview: a translucent dashed bar at the snapped target
          (move = where the booking lands, in its real lane). Painted only in the
          week the destination falls into. */}
      {previewBar && (
        <div
          className="pointer-events-none absolute z-30"
          style={{ top: `${34 + previewBar.lane * 24}px`, left: `calc(${(previewBar.colStart / 7) * 100}% + 4px)`, width: `calc(${(previewBar.span / 7) * 100}% - 8px)`, height: '20px' }}
        >
          <div className={`flex h-full w-full items-center gap-1 overflow-hidden rounded-md border-2 border-dashed border-primary px-1.5 text-xs font-semibold ${TONE_BAR[previewTone]}`}>
            <span className="shrink-0 rounded bg-primary px-1 py-0.5 text-[10px] font-bold leading-none text-primary-foreground tabular-nums">{format(preview!.start, 'd. MMM', { locale })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Event renderers (chip in cells, bar for spans) ──────────────────────

// Only a pointerdown wires per-element now — move/up/cancel are on window. The
// active view supplies the Geometry snapshot so begin() can resolve targets by
// math (the absolutely-stacked month bars can no longer swallow the hit-test).
function dragProps(ev: CalendarEvent, dnd: EventDrag, geom: () => Geometry) {
  if (!dnd.active) return {};
  return {
    onPointerDown: (e: ReactPointerEvent) => { e.stopPropagation(); dnd.begin(ev, e, geom()); },
    // 'manipulation' (not 'none'): a quick touch swipe on a chip stays a native
    // SCROLL; the shared drag core arms the drag via long-press and then blocks
    // panning itself (non-passive touchmove). Mouse drags are unaffected.
    style: { touchAction: 'manipulation' as const, cursor: 'grab' as const },
  };
}

function EventChip({ ev, meta, ctx, dnd, geom, variant = 'chip' }: { ev: CalendarEvent; meta: EventSegmentMeta; ctx: ViewContext; dnd: EventDrag; geom: () => Geometry; variant?: 'chip' | 'card' }) {
  if (ctx.renderEvent) {
    return (
      <div onClick={(e) => { e.stopPropagation(); if (dnd.consumeClick()) return; ctx.onEventClick?.(ev); }} {...dragProps(ev, dnd, geom)}>
        {ctx.renderEvent(ev, meta)}
      </div>
    );
  }
  const tone = ev.tone ?? 'default';
  const time = !isAllDay(ev) ? format(eventStart(ev), 'HH:mm') : null;
  // Roomy 2-line card (board): status accent bar + title + subtitle + time.
  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (dnd.consumeClick()) return; ctx.onEventClick?.(ev); }}
        {...dragProps(ev, dnd, geom)}
        className={`flex flex-col gap-0.5 rounded-md border-l-4 px-2 py-1.5 text-left min-w-0 ${TONE_ACCENT[tone]} ${dnd.draggingId === ev.id ? 'opacity-40' : ''} hover:shadow-sm transition-shadow`}
      >
        <span className="truncate text-xs font-semibold text-foreground">{ev.title}</span>
        {ev.subtitle != null && ev.subtitle !== '' && <span className="truncate text-[11px] text-muted-foreground">{ev.subtitle}</span>}
        {time && <span className="text-[11px] tabular-nums text-muted-foreground">{time}</span>}
      </button>
    );
  }
  // Compact chip (month cells, week all-day strip).
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (dnd.consumeClick()) return; ctx.onEventClick?.(ev); }}
      {...dragProps(ev, dnd, geom)}
      className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-xs min-w-0 ${dnd.draggingId === ev.id ? 'opacity-50' : ''} hover:bg-muted`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
      {time && <span className="shrink-0 tabular-nums text-muted-foreground">{time}</span>}
      <span className="truncate text-foreground">{ev.title}</span>
    </button>
  );
}

function EventBar({ ev, meta, ctx, dnd, geom, resizable = false, roomy = false }: { ev: CalendarEvent; meta: EventSegmentMeta; ctx: ViewContext; dnd: EventDrag; geom: () => Geometry; resizable?: boolean; roomy?: boolean }) {
  if (ctx.renderEvent) {
    return <div onClick={(e) => { e.stopPropagation(); if (dnd.consumeClick()) return; ctx.onEventClick?.(ev); }} {...dragProps(ev, dnd, geom)}>{ctx.renderEvent(ev, meta)}</div>;
  }
  const tone = ev.tone ?? 'default';
  // Day-granular resize edges (week all-day strip): off until onEventResize is
  // wired AND the caller opts in (month bars call without `resizable` -> inert).
  const showResize = resizable && dnd.resizable && ev.end != null;
  return (
    <div className="relative h-full w-full">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (dnd.consumeClick()) return; ctx.onEventClick?.(ev); }}
        {...dragProps(ev, dnd, geom)}
        className={`flex h-full w-full items-center gap-1.5 px-2 text-left text-xs font-medium ${TONE_BAR[tone]} ${dnd.draggingId === ev.id ? 'opacity-40' : ''} ${meta.isStart ? 'rounded-l-md' : ''} ${meta.isEnd ? 'rounded-r-md' : ''}`}
      >
        {/* The title renders on EVERY week segment (Google-style) — a bar
            continuing from the previous week is never nameless; the squared
            edge still signals the continuation. `roomy` (strip-only week)
            adds the subtitle as a second line. */}
        {roomy ? (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate">{ev.title}</span>
            {ev.subtitle != null && ev.subtitle !== '' && <span className="truncate text-[11px] font-normal opacity-80">{ev.subtitle}</span>}
          </span>
        ) : (
          <span className="truncate">{ev.title}</span>
        )}
      </button>
      {showResize && meta.isStart && <span onPointerDown={(e) => { e.stopPropagation(); dnd.begin(ev, e, geom(), 'resize-start'); }} className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize" style={{ touchAction: 'manipulation' }} aria-hidden />}
      {showResize && meta.isEnd && <span onPointerDown={(e) => { e.stopPropagation(); dnd.begin(ev, e, geom(), 'resize-end'); }} className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize" style={{ touchAction: 'manipulation' }} aria-hidden />}
    </div>
  );
}

// ── Week view (hour grid + all-day strip + column packing) ──────────────

const HOUR_PX = 48;

// Self-updating "now" for the current-time line (1-min tick; mounted only
// while the week view is rendered).
function useNow(): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

// The classic red current-time line on today's hour column. Pure presentation:
// minutes since dayStartHour → pixels; hidden outside the visible hour window.
function NowLine({ now, dayStartHour, hoursCount, hourPx }: { now: Date; dayStartHour: number; hoursCount: number; hourPx: number }) {
  const minutes = (getHours(now) - dayStartHour) * 60 + getMinutes(now);
  if (minutes < 0 || minutes > hoursCount * 60) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: (minutes / 60) * hourPx }} aria-hidden>
      <div className="relative h-px bg-destructive">
        <span className="absolute -left-1 -top-[3px] h-[7px] w-[7px] rounded-full bg-destructive" />
      </div>
    </div>
  );
}

function WeekView(ctx: ViewContext) {
  const { events, cursor, weekStartsOn, locale, dayStartHour, dayEndHour } = ctx;
  // One window-FSM hook for the whole week. The geometry captured at gesture
  // start decides the resolution: all-day strip chips capture a day-granular
  // geometry (minuteAt null); hour-grid events capture a time-aware geometry
  // (Y → snapped minute). Both coexist without touching each other.
  const dnd = useEventDrag(ctx.onEventDrop, ctx.onEventResize, ctx.onRangeCreate, ctx.dragSnapMinutes);
  const days = useMemo(() => {
    const all = eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn }), end: endOfWeek(cursor, { weekStartsOn }) });
    // weekDays=5: working week — Sat+Sun hidden (independent of weekStartsOn).
    // The remaining Mo–Fr stay CONTIGUOUS, so all span/lane math keeps working
    // on a plain 5-day window; weekend events simply don't render here.
    return ctx.weekDays === 5 ? all.filter(d => d.getDay() !== 0 && d.getDay() !== 6) : all;
  }, [cursor, weekStartsOn, ctx.weekDays]);
  const hours = useMemo(() => Array.from({ length: dayEndHour - dayStartHour }, (_, i) => dayStartHour + i), [dayStartHour, dayEndHour]);
  const now = useNow();

  // Geometry refs: the all-day strip cells (day-granular) and the hour-grid day
  // columns (day + minute). dayAt iterates whichever rect holds the cursor X;
  // minuteAt reads the hour-grid body top → snapped clock minute. No DOM probing.
  const alldayRefs = useRef<Map<string, HTMLElement>>(new Map());
  const colRefs = useRef<Map<string, HTMLElement>>(new Map());
  const alldayGeom = useCallback((): Geometry => ({
    dayAt: (clientX) => dayFromRects(alldayRefs.current, clientX),
    minuteAt: null,
  }), []);
  const hourGeom = useCallback((): Geometry => ({
    dayAt: (clientX) => dayFromRects(colRefs.current, clientX),
    minuteAt: (clientY) => {
      // Resolve Y inside whichever column is currently registered (they share a
      // top), snapped to dragSnapMinutes; clamp to the visible hour window.
      const any = colRefs.current.values().next().value as HTMLElement | undefined;
      const top = any?.getBoundingClientRect().top ?? 0;
      const raw = (Math.max(0, clientY - top) / HOUR_PX) * 60;
      const snap = Math.max(1, ctx.dragSnapMinutes);
      return Math.round(raw / snap) * snap + dayStartHour * 60;
    },
  }), [ctx.dragSnapMinutes, dayStartHour]);

  // Adaptive: an all-day-only week renders as day-column cards (a week planner),
  // not an empty hour grid; a week with any timed event uses the hour grid.
  // `weekLayout` forces it ('board' | 'hours').
  const weekStart = days[0];
  const weekEnd = days[days.length - 1];
  const hasSingleTimed = events.some(ev => !isAllDay(ev) && !isMultiDay(ev));
  // Multi-day events are NEVER routed to the board (per-day cards = the "only one
  // day" bug) — they render as span bars in the strip below. Board only when
  // nothing needs the hour grid OR the span strip.
  const useBoard = ctx.weekLayout === 'board' || (ctx.weekLayout !== 'hours' && !hasSingleTimed && !events.some(isMultiDay));
  if (useBoard) return <WeekBoard days={days} ctx={ctx} dnd={dnd} />;

  const preview = dnd.preview;
  // Multi-day events (timed OR all-day) → continuous span bars across their day
  // columns in the all-day strip (lane-packed, week-clipped) — like the month view.
  const weekBars = packWeekBars(events, weekStart, weekEnd);
  const stripPreviewBar = (() => {
    if (!preview) return null;
    const pev = previewToEvent(preview, events);
    if (!preview.allDay && !isMultiDay(pev)) return null;   // single-day timed → hour grid
    if (startOfDay(preview.end) < weekStart || startOfDay(preview.start) > weekEnd) return null;
    const subbed = [...events.filter(e => e.id !== preview.id), pev];
    const repacked = packWeekBars(subbed, weekStart, weekEnd);
    const found = repacked.find(b => b.ev.id === preview.id);
    if (found) return found;
    const segStart = maxDate([startOfDay(preview.start), weekStart]);
    const segEnd = minDate([startOfDay(preview.end), weekEnd]);
    return { ev: pev, lane: repacked.reduce((m, b) => Math.max(m, b.lane + 1), 0), colStart: differenceInCalendarDays(segStart, weekStart), span: differenceInCalendarDays(segEnd, segStart) + 1, isStart: true, isEnd: true };
  })();
  const previewTone = preview ? (events.find(e => e.id === preview.id)?.tone ?? 'primary') : 'primary';
  const stripLanes = Math.max(weekBars.reduce((m, b) => Math.max(m, b.lane + 1), 0), stripPreviewBar ? stripPreviewBar.lane + 1 : 0);

  // Strip-only week: no timed events → no hour grid below, so the all-day span
  // strip IS the entire view. Its lanes grow to roomy two-line bars (title +
  // subtitle) instead of 20px ribbons — a span week (bookings, vacations) reads
  // like a real week plan, not a clipped header. With an hour grid below, the
  // strip stays compact as before.
  const stripOnly = !hasSingleTimed;
  const stripLanePx = stripOnly ? 40 : 24;
  const stripBarPx = stripOnly ? 36 : 20;

  return (
    <div className="select-none">
      {/* Header row */}
      <div className="grid border-b border-input bg-secondary" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((day, i) => (
          <div key={i} className="px-2 py-2 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">{format(day, 'EEEEEE', { locale })}</div>
            <div className={`mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm font-medium ${isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>{format(day, 'd', { locale })}</div>
          </div>
        ))}
      </div>
      {/* All-day + multi-day span strip: single-day all-day chips per cell, with
          multi-day events overlaid as continuous span bars across columns. */}
      <div className="flex border-b border-border">
        <div className="w-14 shrink-0 px-1 py-1 text-right text-[10px] uppercase text-muted-foreground">Ganztags</div>
        <div className="relative grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day, i) => {
            const iso = format(day, 'yyyy-MM-dd');
            const single = events.filter(ev => isAllDay(ev) && !isMultiDay(ev) && occursOn(ev, day)).sort(eventOrder);
            return (
              <div
                key={i}
                ref={(el) => { if (el) alldayRefs.current.set(iso, el); else alldayRefs.current.delete(iso); }}
                onClick={() => { if (dnd.consumeClick()) return; ctx.onEmptyClick?.(day); }}
                className={`min-h-[28px] border-l border-border first:border-l-0 p-1 flex flex-col gap-1 ${ctx.onEmptyClick ? 'cursor-pointer' : ''} ${dnd.dropTarget === iso && stripPreviewBar != null ? 'ring-2 ring-inset ring-primary/60' : ''}`}
              >
                {stripLanes > 0 && <div style={{ height: `${stripLanes * stripLanePx}px` }} aria-hidden />}
                {single.map(ev => <EventChip key={ev.id} ev={ev} meta={FULL_META} ctx={ctx} dnd={dnd} geom={alldayGeom} />)}
              </div>
            );
          })}
          {weekBars.map((b, i) => (
            <div key={`${b.ev.id}-${i}`} className="absolute pointer-events-none" style={{ top: `${4 + b.lane * stripLanePx}px`, left: `calc(${(b.colStart / days.length) * 100}% + 2px)`, width: `calc(${(b.span / days.length) * 100}% - 4px)`, height: `${stripBarPx}px` }}>
              <div className="pointer-events-auto h-full">
                <EventBar ev={b.ev} meta={{ isStart: b.isStart, isEnd: b.isEnd, isContinuation: !b.isStart }} ctx={ctx} dnd={dnd} geom={alldayGeom} resizable roomy={stripOnly} />
              </div>
            </div>
          ))}
          {stripPreviewBar && (
            <div className="pointer-events-none absolute z-30" style={{ top: `${4 + stripPreviewBar.lane * stripLanePx}px`, left: `calc(${(stripPreviewBar.colStart / days.length) * 100}% + 2px)`, width: `calc(${(stripPreviewBar.span / days.length) * 100}% - 4px)`, height: `${stripBarPx}px` }}>
              <div className={`flex h-full w-full items-center gap-1 overflow-hidden rounded-md border-2 border-dashed border-primary px-1.5 text-xs font-semibold ${TONE_BAR[previewTone]}`}>
                <span className="shrink-0 rounded bg-primary px-1 py-0.5 text-[10px] font-bold leading-none text-primary-foreground tabular-nums">{format(preview!.start, 'd. MMM', { locale })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Hour grid — only single-day timed events (multi-day live in the strip above) */}
      {hasSingleTimed && (
      <div className="grid overflow-y-auto max-h-[640px]" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        {/* Hour labels */}
        <div className="flex flex-col">
          {hours.map(h => <div key={h} className="h-12 pr-2 text-right text-[11px] tabular-nums text-muted-foreground" style={{ height: HOUR_PX }}>{String(h).padStart(2, '0')}:00</div>)}
        </div>
        {days.map((day, i) => (
          <WeekDayColumn key={i} day={day} events={events} ctx={ctx} dnd={dnd} geom={hourGeom} colRefs={colRefs} hours={hours} hourPx={HOUR_PX} dayStartHour={dayStartHour} now={now} />
        ))}
      </div>
      )}
    </div>
  );
}

// Find the day whose registered cell rect holds the cursor X. The bars/chips
// can't intercept this — it reads the view's own cell rects, not the DOM at the
// point. Returns null when the cursor is off every column.
function dayFromRects(rects: Map<string, HTMLElement>, clientX: number): Date | null {
  for (const [iso, el] of Array.from(rects.entries())) {
    const r = el.getBoundingClientRect();
    if (clientX >= r.left && clientX < r.right) return parseISO(iso);
  }
  return null;
}

// Week board: 7 day-columns of stacked all-day cards (no hour axis). Used by
// WeekView when the week has no timed events — the natural layout for all-day
// data (shifts, bookings, tasks), which is the Living-Apps norm.
function WeekBoard({ days, ctx, dnd }: { days: Date[]; ctx: ViewContext; dnd: EventDrag }) {
  const { events, locale } = ctx;
  // Day-granular geometry: each column registers its rect; the dragged card
  // resolves its target day from whichever rect holds the cursor X.
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const geom = useCallback((): Geometry => ({
    dayAt: (clientX) => dayFromRects(cellRefs.current, clientX),
    minuteAt: null,
  }), []);
  return (
    <div className="select-none overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`, minWidth: days.length * 102 }}>
        {days.map((day, i) => {
          const iso = format(day, 'yyyy-MM-dd');
          const items = events.filter(ev => occursOn(ev, day)).sort(eventOrder);
          const today = isToday(day);
          const isTarget = dnd.dropTarget === iso;
          const extra = ctx.dayClassName?.(day) ?? '';
          return (
            <div
              key={i}
              ref={(el) => { if (el) cellRefs.current.set(iso, el); else cellRefs.current.delete(iso); }}
              onClick={() => { if (dnd.consumeClick()) return; ctx.onEmptyClick?.(day); }}
              className={`flex flex-col min-h-[140px] border-r border-border last:border-r-0 ${today ? 'bg-primary/5' : ''} ${isTarget ? 'ring-2 ring-inset ring-primary/60' : ''} ${ctx.onEmptyClick ? 'cursor-pointer' : ''} ${extra}`}
            >
              <div className={`px-2 py-2 text-center border-b border-input ${today ? 'bg-secondary' : 'bg-secondary/60'}`}>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-secondary-foreground">{format(day, 'EEE', { locale })}</div>
                <div className={`mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-semibold ${today ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>{format(day, 'd', { locale })}</div>
                {ctx.renderDayBadge && <div className="mt-1">{ctx.renderDayBadge(day)}</div>}
              </div>
              <div className="relative isolate flex-1 p-1.5 flex flex-col gap-1.5 min-w-0">
                {ctx.renderDayBackground && <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">{ctx.renderDayBackground(day)}</div>}
                {items.map(ev => <EventChip key={ev.id} ev={ev} meta={FULL_META} ctx={ctx} dnd={dnd} geom={geom} variant="card" />)}
                {ctx.onEmptyClick && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); ctx.onEmptyClick!(day); }}
                    className="mt-auto flex items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <IconPlus className="h-3.5 w-3.5" />Hinzufügen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inverse of packDayEvents' minute offset: a vertical pixel offset inside an
// hour column → a Date carrying the clock time, snapped to `snapMinutes`. Shared
// by the timed empty-slot click (Fall 4) and the time-drag drop (Fall 5).
// Exported Tier-2 primitive (§6).
export function yToTime(day: Date, offsetY: number, hourPx: number, dayStartHour: number, snapMinutes: number): Date {
  const dayStart = setTime(startOfDay(day), { hours: dayStartHour, minutes: 0, seconds: 0, milliseconds: 0 });
  const rawMinutes = (Math.max(0, offsetY) / hourPx) * 60;
  const snap = Math.max(1, snapMinutes);
  return addMinutes(dayStart, Math.round(rawMinutes / snap) * snap);
}

// One packed timed event in an hour column. SEMANTIC geometry: `minuteOffset` =
// minutes from the day's start hour, `durationMinutes` = length in minutes; `col`
// of `cols` is the overlap-column position. No pixels — the renderer multiplies
// by HOUR_PX/60. Exported public contract; generic over the event shape.
export type PackedEvent<T extends TimeSpan = CalendarEvent> = { ev: T; minuteOffset: number; durationMinutes: number; col: number; cols: number };

function WeekDayColumn({ day, events, ctx, dnd, geom, colRefs, hours, hourPx, dayStartHour, now }: {
  day: Date; events: CalendarEvent[]; ctx: ViewContext; dnd: EventDrag; geom: () => Geometry; colRefs: MutableRefObject<Map<string, HTMLElement>>; hours: number[]; hourPx: number; dayStartHour: number; now: Date;
}) {
  const iso = format(day, 'yyyy-MM-dd');
  const timed = useMemo(() => events.filter(ev => !isAllDay(ev) && !isMultiDay(ev) && occursOn(ev, day)).sort(eventOrder), [events, day]);
  const packed = useMemo(() => packDayEvents(timed, day, dayStartHour), [timed, day, dayStartHour]);
  // Minute → pixel for this renderer (the pack output is HOUR_PX-agnostic).
  const minuteToPx = (minutes: number) => (minutes / 60) * hourPx;

  // Empty-slot click in the hour grid carries the clock time (Fall 4): the
  // vertical click offset inside this column → snapped Date. The time lives in
  // the Date, not a new param; `group` (2nd arg) is unused here — no second axis.
  const handleSlotClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (dnd.consumeClick()) return;
    if (!ctx.onEmptyClick) return;
    const offsetY = e.clientY - e.currentTarget.getBoundingClientRect().top;
    ctx.onEmptyClick(yToTime(day, offsetY, hourPx, dayStartHour, ctx.dragSnapMinutes));
  };

  // Live preview for THIS day: the snapped destination block (move) or the
  // stretched extent (resize) + a time label, so the user sees where/how big.
  const preview = dnd.preview;
  const showPreview = !!preview && !preview.allDay && isSameDay(preview.start, day);
  const dayStart = setTime(startOfDay(day), { hours: dayStartHour });
  const previewTop = preview ? (differenceInMinutes(preview.start, dayStart) / 60) * hourPx : 0;
  const previewHeight = preview ? Math.max(18, (differenceInMinutes(preview.end, preview.start) / 60) * hourPx) : 18;
  const previewLabel = preview
    ? (preview.mode === 'move' ? format(preview.start, 'HH:mm') : `${format(preview.start, 'HH:mm')}–${format(preview.end, 'HH:mm')}`)
    : '';

  return (
    <div
      ref={(el) => { if (el) colRefs.current.set(iso, el); else colRefs.current.delete(iso); }}
      onClick={handleSlotClick}
      // Drag-to-create: pointerdown on EMPTY column space starts a 'create'
      // gesture anchored at the snapped clock time under the pointer (chips and
      // resize handles stopPropagation, so they never reach here). A plain
      // click still fires handleSlotClick; the post-drag click is swallowed.
      onPointerDown={dnd.creatable ? (e) => {
        const minute = geom().minuteAt!(e.clientY);
        dnd.begin({ id: CREATE_ID, start: format(setMinutesOfDay(day, minute), ISO_T), title: '' }, e, geom(), 'create');
      } : undefined}
      className={`relative border-l border-border ${dnd.dropTarget === iso && (!preview || !preview.allDay) ? 'ring-2 ring-inset ring-primary/60' : ''} ${ctx.onEmptyClick ? 'cursor-pointer' : ''}`}
      style={{ height: hours.length * hourPx }}
    >
      {hours.map(h => <div key={h} className="border-b border-border/60" style={{ height: hourPx }} aria-hidden />)}
      {isToday(day) && <NowLine now={now} dayStartHour={dayStartHour} hoursCount={hours.length} hourPx={hourPx} />}
      {packed.map(p => {
        const tone = p.ev.tone ?? 'default';
        // Resize is opt-in: handles only render when onEventResize is wired
        // (the onEventDrop "OFF until passed" idiom). A ~6px edge zone resizes;
        // the body still drags. Both go through begin() → the window FSM.
        const resizable = ctx.onEventResize != null;
        return (
          <button
            key={p.ev.id}
            type="button"
            onClick={(e) => { e.stopPropagation(); if (dnd.consumeClick()) return; ctx.onEventClick?.(p.ev); }}
            {...dragProps(p.ev, dnd, geom)}
            className={`absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left text-xs ${TONE_BAR[tone]} ${dnd.draggingId === p.ev.id ? 'opacity-50' : ''}`}
            style={{ top: minuteToPx(p.minuteOffset), height: Math.max(18, minuteToPx(p.durationMinutes)), left: `calc(${(p.col / p.cols) * 100}% + 2px)`, width: `calc(${(1 / p.cols) * 100}% - 4px)` }}
          >
            {ctx.renderEvent ? ctx.renderEvent(p.ev, FULL_META) : <><span className="block truncate font-medium">{p.ev.title}</span><span className="block tabular-nums opacity-80">{format(eventStart(p.ev), 'HH:mm')}</span></>}
            {resizable && (
              <>
                <span
                  onPointerDown={(e) => { e.stopPropagation(); dnd.begin(p.ev, e, geom(), 'resize-start'); }}
                  className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize" style={{ touchAction: 'manipulation' }} aria-hidden
                />
                <span
                  onPointerDown={(e) => { e.stopPropagation(); dnd.begin(p.ev, e, geom(), 'resize-end'); }}
                  className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize" style={{ touchAction: 'manipulation' }} aria-hidden
                />
              </>
            )}
          </button>
        );
      })}
      {showPreview && (
        <div
          className="pointer-events-none absolute inset-x-1 z-30 flex items-start overflow-hidden rounded-md border-2 border-dashed border-primary bg-primary/15 px-1.5 py-0.5"
          style={{ top: Math.max(0, previewTop), height: previewHeight }}
        >
          <span className="rounded bg-primary px-1 py-0.5 text-[10px] font-bold leading-none text-primary-foreground tabular-nums">{previewLabel}</span>
        </div>
      )}
    </div>
  );
}

/** Greedy interval-partitioning: assign each timed event a column within its
 *  overlap cluster. Output is SEMANTIC (minuteOffset/durationMinutes from the
 *  day's start hour) — the renderer multiplies by its own HOUR_PX. Exported
 *  Tier-2 primitive (§6); generic over the event shape. */
export function packDayEvents<T extends TimeSpan>(timed: T[], day: Date, dayStartHour: number): PackedEvent<T>[] {
  const dayStart = setTime(startOfDay(day), { hours: dayStartHour });
  // Minutes from the day's start hour; clipped to this day for spans crossing midnight.
  const offsetOf = (ev: T) => {
    const s = eventStart(ev);
    return isSameDay(s, day) ? differenceInMinutes(s, dayStart) : 0;
  };
  const durationOf = (ev: T) => {
    const s = isSameDay(eventStart(ev), day) ? eventStart(ev) : dayStart;
    const e = isSameDay(eventEnd(ev), day) ? eventEnd(ev) : addMinutes(s, 60);
    return Math.max(1, differenceInMinutes(e, s));
  };
  // Cluster overlapping events, assign columns greedily.
  const out: PackedEvent<T>[] = [];
  let cluster: T[] = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    const colEnds: number[] = [];
    const assigned = cluster.map(ev => {
      const minuteOffset = offsetOf(ev);
      const durationMinutes = durationOf(ev);
      let col = colEnds.findIndex(end => end <= minuteOffset);
      if (col === -1) { col = colEnds.length; colEnds.push(minuteOffset + durationMinutes); }
      else colEnds[col] = minuteOffset + durationMinutes;
      return { ev, minuteOffset, durationMinutes, col };
    });
    const cols = colEnds.length || 1;
    assigned.forEach(a => out.push({ ...a, cols }));
    cluster = [];
    clusterEnd = -Infinity;
  };
  for (const ev of timed) {
    const offset = offsetOf(ev);
    if (cluster.length && offset >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, offset + durationOf(ev));
  }
  if (cluster.length) flush();
  return out;
}

// ── Agenda + Day views (chronological list — fork-safe, mobile-friendly) ─

// ── Year view (12 mini-months; optional density heatmap) ────────────────
// Aggregates events to a per-local-day count (data-agnostic: no field names,
// just "how many on this day"). heatmap=true tints each day by count (GitHub
// contribution style); otherwise a faint dot marks days that carry events.
// Clicking a day fires onEmptyClick(date) for a free drill-down.

// Static class steps so Tailwind keeps them (no dynamic class assembly).
const HEAT_STEPS = ['', 'bg-primary/20', 'bg-primary/40', 'bg-primary/65', 'bg-primary/90'] as const;
function heatStep(count: number): string {
  if (count <= 0) return HEAT_STEPS[0];
  if (count === 1) return HEAT_STEPS[1];
  if (count === 2) return HEAT_STEPS[2];
  if (count <= 4) return HEAT_STEPS[3];
  return HEAT_STEPS[4];
}

function YearView(ctx: ViewContext) {
  const { events, cursor, weekStartsOn, locale, heatmap } = ctx;

  // count per local day, keyed by yyyy-MM-dd. Built once per events/cursor.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    const from = startOfWeek(startOfYear(cursor), { weekStartsOn });
    const to = endOfWeek(endOfYear(cursor), { weekStartsOn });
    for (const day of eachDayOfInterval({ start: from, end: to })) {
      const n = events.reduce((acc, ev) => acc + (occursOn(ev, day) ? 1 : 0), 0);
      if (n > 0) m.set(format(day, 'yyyy-MM-dd'), n);
    }
    return m;
  }, [events, cursor, weekStartsOn]);

  const months = useMemo(
    () => eachMonthOfInterval({ start: startOfYear(cursor), end: endOfYear(cursor) }),
    [cursor],
  );
  const weekdayLabels = useMemo(() => {
    const ref = startOfWeek(cursor, { weekStartsOn });
    return eachDayOfInterval({ start: ref, end: addDays(ref, 6) }).map(d => format(d, 'EEEEE', { locale }));
  }, [cursor, weekStartsOn, locale]);

  return (
    <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map(month => {
        const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn });
        const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn });
        const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
        return (
          <div key={format(month, 'yyyy-MM')} className="flex flex-col gap-2">
            <div className="text-sm font-semibold capitalize text-foreground">{format(month, 'MMMM', { locale })}</div>
            <div className="grid grid-cols-7 gap-0.5">
              {weekdayLabels.map((w, i) => (
                <div key={`h-${i}`} className="text-center text-[10px] font-medium uppercase text-muted-foreground">{w}</div>
              ))}
              {days.map(day => {
                const iso = format(day, 'yyyy-MM-dd');
                const count = counts.get(iso) ?? 0;
                const outside = !isSameMonth(day, month);
                const tint = heatmap ? heatStep(count) : '';
                const heated = heatmap && count > 0;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => ctx.onEmptyClick?.(day)}
                    title={count > 0 ? `${format(day, 'd. MMM', { locale })} · ${count}` : format(day, 'd. MMM', { locale })}
                    className={`relative aspect-square rounded text-[11px] leading-none flex items-center justify-center transition-colors ${tint} ${outside ? 'text-muted-foreground/40' : heated ? 'font-medium text-primary-foreground' : 'text-foreground'} ${isToday(day) ? 'ring-1 ring-inset ring-primary' : ''} ${ctx.onEmptyClick ? 'cursor-pointer hover:bg-muted' : ''}`}
                  >
                    {format(day, 'd', { locale })}
                    {!heatmap && !outside && count > 0 && (
                      <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgendaView(ctx: ViewContext) {
  const { cursor, weekStartsOn } = ctx;
  const range = visibleRange(cursor, 'agenda', weekStartsOn);
  return <EventList ctx={ctx} from={range.from} to={range.to} emptyLabel="Keine Termine in diesem Zeitraum." />;
}

function DayView(ctx: ViewContext) {
  const { cursor } = ctx;
  return <EventList ctx={ctx} from={startOfDay(cursor)} to={startOfDay(cursor)} emptyLabel="Keine Termine an diesem Tag." />;
}

function EventList({ ctx, from, to, emptyLabel }: { ctx: ViewContext; from: Date; to: Date; emptyLabel: string }) {
  const { events, locale } = ctx;
  const days = eachDayOfInterval({ start: from, end: to });
  const groups = days
    .map(day => ({ day, items: events.filter(ev => occursOn(ev, day)).sort(eventOrder) }))
    .filter(g => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground"><IconCalendarOff size={22} stroke={1.75} /></div>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {groups.map(({ day, items }) => (
        <div key={format(day, 'yyyy-MM-dd')} className="flex gap-4 px-6 py-4">
          <div className="w-16 shrink-0 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{format(day, 'EEE', { locale })}</div>
            <div className={`text-2xl font-semibold ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd', { locale })}</div>
            <div className="text-xs text-muted-foreground">{format(day, 'MMM', { locale })}</div>
          </div>
          <div className="flex flex-1 flex-col gap-2 min-w-0">
            {items.map(ev => {
              const tone = ev.tone ?? 'default';
              if (ctx.renderEvent) return <div key={ev.id} onClick={() => ctx.onEventClick?.(ev)}>{ctx.renderEvent(ev, FULL_META)}</div>;
              return (
                <button key={ev.id} type="button" onClick={() => ctx.onEventClick?.(ev)} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2 text-left hover:bg-muted min-w-0">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
                  <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {isAllDay(ev) ? 'Ganztags' : `${format(eventStart(ev), 'HH:mm')}${ev.end ? `–${format(eventEnd(ev), 'HH:mm')}` : ''}`}
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="truncate font-medium text-foreground">{ev.title}</span>
                    {ev.subtitle != null && ev.subtitle !== '' && <span className="truncate text-xs text-muted-foreground">{ev.subtitle}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── State wrappers ─────────────────────────────────────────────────────

export function CalendarSkeleton() {
  return (
    <div className="rounded-[27px] bg-card shadow-lg overflow-hidden animate-pulse" aria-busy="true">
      <div className="grid grid-cols-7 border-b border-input bg-secondary">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="px-3 py-2"><div className="mx-auto h-3 w-6 rounded bg-muted" /></div>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[112px] border-b border-r border-border p-2 last:border-r-0">
            <div className="h-5 w-5 rounded-full bg-muted" />
            {i % 3 === 0 && <div className="mt-2 h-4 w-full rounded bg-muted" />}
          </div>
        ))}
      </div>
    </div>
  );
}

type CalendarErrorProps = {
  error: Error | string;
  title?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ComponentType<{ size?: number | string; stroke?: number | string }>;
  className?: string;
};

export function CalendarError({ error, title = 'Kalender konnte nicht geladen werden', onRetry, retryLabel = 'Erneut versuchen', icon: Icon = IconAlertCircle, className }: CalendarErrorProps) {
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div className={`flex flex-col items-center justify-center gap-4 rounded-[27px] bg-card shadow-lg py-24 text-center${className ? ` ${className}` : ''}`}>
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive"><Icon size={22} /></div>
      <div className="flex flex-col gap-1 max-w-md px-6">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground break-words">{message}</p>
      </div>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}><IconRefresh className="h-4 w-4 mr-1.5" />{retryLabel}</Button>}
    </div>
  );
}
