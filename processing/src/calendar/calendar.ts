import * as ics from 'ics'
import { EventAttributes, HeaderAttributes } from 'ics'
import { writeFileSync } from "fs"
import { Event, Resource, Location, Service } from "../types.js"

const mapInternalEventToIcsEvent = (event: Event, context: { resources: Resource[], locations: Location[] }): EventAttributes => {
    const durationInMinutes = (event.end.getTime() - event.start.getTime()) / 1000 / 60
    const hours = Math.floor(durationInMinutes / 60)
    const minutes = Math.floor(durationInMinutes % 60)

    const location = [
        context.resources.find(res => res.id === event.resource_id)?.name,
        context.locations.find(loc => loc.id === event.location_id)?.name,
    ].filter(s => !!s).join(', ')

    return {
        title: event.title,
        location,
        start: [event.start.getFullYear(), event.start.getMonth() + 1, event.start.getDate(), event.start.getHours(), event.start.getMinutes()],
        duration: { hours, minutes },
    }
}

export const generateIcsFile = (filePath: string, events: Event[], resources: Resource[], locations: Location[]) => {
    const context: { resources: Resource[], locations: Location[] } = { resources, locations }
    const headerAttributes: HeaderAttributes = {
        calName: 'Töölön Kisahalli / Koripallo',
    }
    const relevantEvents = events.filter(e => e.available)
    const { error, value } = ics.createEvents(relevantEvents.map(e => mapInternalEventToIcsEvent(e, context)), headerAttributes)
    if (error) {
        throw error
    } else if (value) {
        writeFileSync(filePath, value, { encoding: 'utf-8' })
    } else {
        throw new Error(`Unknown error while creating ICS file. Error: ${JSON.stringify(error)}. Value: ${JSON.stringify(value)}`)
    }
}
