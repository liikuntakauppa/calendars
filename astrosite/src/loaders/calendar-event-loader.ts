import { readFileSync } from 'fs';
import { md5, sha1 } from '../utils/hash';

import type { Loader, LoaderContext } from 'astro/loaders';
import { z } from 'astro:content';


// Typing for the contents of `calendar-events.json`

type AggregatedCalendarEvent = {
  available: boolean,
  title: string,
  start: string,
  end: string,
  date: string,
  starttime: string,
  endtime: string,
  location_id: number,
  resource_id: number,
  service_id: number,
  service: string,
  reservation_type_id: number,
  reservation_type_name: string,
  reservation_group_name: string,
}

type CalendarEventsAggregate = {
  name: string,
  fileName: string,
  events: AggregatedCalendarEvent[]
}

type CalendarEventsJson = Array<CalendarEventsAggregate>

type LoadedCalendar = {
  name: string,
  fileName: string,
  events: Array<{
    title: string,
    description: string,
    date: string,
    starttime: string,
    endtime: string,
    location: number,
    resource: number,
  }>
}

const mapAggregatedEventsToLoadedEvents = (input: CalendarEventsAggregate): LoadedCalendar => {
  // TODO: extract "title" and "description"

  const descriptiveTexts = (e: AggregatedCalendarEvent): string[] => {
    return [
      e.title,
      e.reservation_type_name,
      e.reservation_group_name,
    ].flatMap((s: string, index: number, array: string[]) => {
      return array.indexOf(s) < index ? [] : [s]
    })
  }

  return {
    name: input.name,
    fileName: input.fileName,
    events: input.events.map(e => {
      const [title, description] = descriptiveTexts(e)
      return {
        title: title,
        description: description,
        date: e.date,
        starttime: e.starttime,
        endtime: e.endtime,
        location: e.location_id,
        resource: e.resource_id
      }
    })
  }
}

// Define any options that the loader needs
export function CalendarEventLoader(): Loader {
  return {
    name: "calendar-event-loader",
    /**
     * Called when updating the collection.
     */
    load: async (context: LoaderContext): Promise<void> => {
      const data = JSON.parse(readFileSync('src/data/calendar-events.json', 'utf-8')) as CalendarEventsJson
      data.forEach((aggregate: CalendarEventsAggregate) => {
        const digest = md5(JSON.stringify(aggregate))
        context.store.set({
          id: aggregate.fileName,
          data: mapAggregatedEventsToLoadedEvents(aggregate),
          digest: digest,
          rendered: {
            html: `<div>${aggregate.name}</div>`
          }
        })
      })
    },
    /**
     * Optionally, define the schema of an entry.
     * It will be overridden by user-defined schema.
    */
    schema: async () => z.object({
      foo: z.string(),
    })
  }

};
