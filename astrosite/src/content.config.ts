import { defineCollection, z } from 'astro:content';

import { CalendarEventLoader } from './loaders/calendar-event-loader';

const LoadedCalendarSchema = z.object({
    name: z.string(),
    fileName: z.string(),
    events: z.array(z.object({
      title: z.string(),
      description: z.string(),
      date: z.string(),
      starttime: z.string(),
      endtime: z.string(),
      location: z.string(),
      resource: z.string(),
    })),
});

const calendars = defineCollection({
    schema: LoadedCalendarSchema,
    loader: CalendarEventLoader(),
});

// Export a single `collections` object to register the collection(s)
export const collections = { calendars };
