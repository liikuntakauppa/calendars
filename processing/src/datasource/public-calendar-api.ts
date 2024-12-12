import { join } from 'path';
import { writeFileSync } from 'fs';

import { mkdir } from '../utils/fs.js';
import { getWeekNumber } from '../utils/dates.js';
import { Service, Location, Resource, Event } from '../types.js'


const rawFilesDir = mkdir('./raw');


/**
 * Returns a list of services available for reservation:
 *
 * {
 *   "result": [
 *     {
 *       "name": "---"
 *     },
 *     {
 *       "service_id": 66,
 *       "name": "Muu toiminta"
 *     },
 *     {
 *       "service_id": 67,
 *       "name": "Aerobic"
 *     }
 *   ]
 * }
 */
export const fetchServices = async (): Promise<Service[]> => {
    const params = [
        'input_format=json',
        'output_format=json',
        '_normalize=true',
        `content=${encodeURIComponent(JSON.stringify([]))}`,
    ]
    const requestBody = params.join('&')
    const response = await fetch("https://liikuntakauppa.hel.fi/helsinginkaupunki/call/asiointi/getreservationservices", {
        "body": requestBody,
        "cache": "default",
        "credentials": "include",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-GB,en;q=0.9",
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded",
            "Pragma": "no-cache",
        },
        "method": "POST",
        "mode": "cors",
        "redirect": "follow",
        "referrer": "https://liikuntakauppa.hel.fi/helsinginkaupunki/ng/shop/public-calendar",
        "referrerPolicy": "origin-when-cross-origin"
    })
    const content = await response.json()
    writeFileSync(join(rawFilesDir, 'services.json'), JSON.stringify(content, null, 2));
    return content.result
        .map((service: any) => ({ id: service.service_id, name: service.name }))
        .filter((service: Service) => typeof(service.id) === 'number')
}

/**
 * Returns a list of locations where the given service is available for reservation:
 *
 * {
 *   "result": {
 *     "locations": [
 *       {
 *         "id": 10,
 *         "itemName": "Töölön kisahalli",
 *         "region_name": "Länsi",
 *         "region_id": 4
 *       }
 *     ],
 *     "regions": [
 *       {
 *         "id": 4,
 *         "itemName": "Länsi",
 *         "location_id": 46
 *       },
 *       {
 *         "id": 3,
 *         "itemName": "Itä",
 *         "location_id": 40
 *       },
 *       {
 *         "id": 2,
 *         "itemName": "Pohjoinen",
 *         "location_id": 61
 *       }
 *     ],
 *     "resources": [
 *       {
 *         "location_id": 10,
 *         "service_id": 73,
 *         "parents": null,
 *         "children": "154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,578,666,667,1014,1015,1016,1017,1018",
 *         "id": 641,
 *         "itemName": "Töölön kisahalli"
 *       },
 *       {
 *         "location_id": 10,
 *         "service_id": 73,
 *         "parents": "641,666",
 *         "children": null,
 *         "id": 158,
 *         "itemName": "Kisahalli A koripallokenttä"
 *       },
 *       {
 *         "location_id": 10,
 *         "service_id": 73,
 *         "parents": "641,667",
 *         "children": null,
 *         "id": 159,
 *         "itemName": "Kisahalli B koripallokenttä"
 *       },
 *     ]
 *   }
 * }
 *
 * @param {string} serviceId The service (e.g. 73 for "Koripallo") to filter by
 */
export const fetchLocationsAndResourcesByService = async (serviceId: number, locations: number[] = []): Promise<{ locations: Location[], resources: Resource[]}> => {
    if (!serviceId) throw new Error(`'serviceId' is a required parameter for fetchLocationsAndResourcesByService(serviceId) – received ${JSON.stringify(serviceId)}`)
    const response = await fetch("https://liikuntakauppa.hel.fi/helsinginkaupunki/call/asiointi/getcalendarregionlocationresourcebyservice", {
        "body": `input_format=json&output_format=json&_normalize=true&content=${JSON.stringify([{ "service_id": serviceId }])}`,
        "cache": "default",
        "credentials": "include",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-GB,en;q=0.9",
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded",
            "Pragma": "no-cache",
        },
        "method": "POST",
        "mode": "cors",
        "redirect": "follow",
        "referrer": "https://liikuntakauppa.hel.fi/helsinginkaupunki/ng/shop/public-calendar",
        "referrerPolicy": "origin-when-cross-origin"
    })
    const { result } = await response.json()
    writeFileSync(join(mkdir(rawFilesDir, serviceId.toString()), 'locations-and-resources.json'), JSON.stringify(result, null, 2));
    return {
        locations:
            result.locations
                .filter((loc: any) => locations.length === 0 || locations.includes(loc.id))  // we only want relevant locations
                .map((loc: any) => ({ id: loc.id, name: loc.itemName })),                    // we only need the ID and name
        resources:
            result.resources
                .filter((res: any) => locations.length === 0 || locations.includes(res.location_id))  // we only want resources in relevant locations
                .filter((res: any) => res.service_id.toString() === serviceId.toString())             // we only want resources related to the specific service (e.g. basketball)
                .filter((res: any) => res.children === null)                                          // we only want the "leaf" resources (actual courts), not aggregates
                .map((res: any) => ({ id: res.id, name: res.itemName, location: res.location_id })),  // we only need the resource ID, name, and location ID.
    }
}


/**
 * Returns a list of reservation events, including time slots designated as "public courts" (yleisövuorot):
 *
 * {
 *   "result": [
 *     {
 *           "reservation_type_id": 8,
 *           "service_id": 66,
 *           "location_id": 10,
 *           "reservation_type_name": "Käyttökatko ",
 *           "reservation_group_name": "Suljettu",
 *           "resource_ids": [ 641, 159, 158 ],
 *           "resource_id": 641,
 *           "resource_ids_used": 641,
 *           "showtitle": "Suljettu",
 *           "title": "",
 *           "service": "Muu toiminta",
 *           "extra_events": [],
 *           "start": "2024-12-09 00:00:00",
 *           "end": "2024-12-09 07:00:00",
 *           "status": "normal"
 *     },
 *     {
 *           "reservation_type_id": 3,
 *           "service_id": 73,
 *           "location_id": 10,
 *           "reservation_type_name": "Vakiovuoro",
 *           "reservation_group_name": "Aikuiset (yli 20-vuotiaat)",
 *           "resource_ids": [ 158, 666, 641 ],
 *           "resource_id": 641,
 *           "resource_ids_used": 158,
 *           "showtitle": "Aikuiset (yli 20-vuotiaat)",
 *           "title": "Police Basket ry",
 *           "service": "Koripallo",
 *           "extra_events": [],
 *           "start": "2024-12-09 19:00:00",
 *           "end": "2024-12-09 20:30:00",
 *           "status": "blocked"
 *     },
 *     {
 *           "reservation_type_id": 4,
 *           "service_id": 66,
 *           "location_id": 10,
 *           "reservation_type_name": "Yleisövuoro",
 *           "reservation_group_name": "Yleisövuoro",
 *           "resource_ids": [
 *               158,
 *               666,
 *               641
 *           ],
 *           "resource_id": 641,
 *           "resource_ids_used": 158,
 *           "showtitle": "Yleisövuoro",
 *           "title": "",
 *           "service": "Muu toiminta",
 *           "extra_events": [ ... ],
 *           "start": "2024-12-09 07:00:00",
 *           "end": "2024-12-09 16:00:00",
 *           "status": "blocked"
 *      }
 *   ]
 * }
 *
 * @param {*} serviceId Service ID such as "73" for "Koripallo"
 * @param {*} locationId Location ID such as "10" for "Töölön kisahalli"
 * @param {*} resourceId Resource ID such as "158" for Kisahalli A, or "158,159" or ["158","159"] for both Kisahalli A and Kisahalli B
 * @param {*} explicitDateRange Date range such as "2024-W50--2024-W50"
 */
export const fetchReservationEvents = async (serviceId: number, locationId: number|number[]|string, resourceId: number|number[]|string, explicitDateRange?: string): Promise<Event[]> => {
    console.log(`fetchReservationEvents(${JSON.stringify(serviceId)}, ${JSON.stringify(locationId)}, ${JSON.stringify(resourceId)}, ${JSON.stringify(explicitDateRange)})`)
    const [year, week] = getWeekNumber(new Date())
    let sevenDaysLater = (() => {
        let date = new Date()
        date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000)
        return date
    })()
    const [endYear, endWeek] = getWeekNumber(sevenDaysLater)
    const dateRange = explicitDateRange || `${year}-W${week}--${endYear}-W${endWeek}`

    const stringifyIds = (value: string|number|string[]|number[]) => Array.isArray(value) ? value.join(',') : value.toString()

    const query = [
        {
            service_id: serviceId,
            location_id: stringifyIds(locationId),
            resource_id: stringifyIds(resourceId),
            date: dateRange, // e.g. "2024-W50--2024-W51"
            skip_related_events: true
        }
    ]
    console.log(`Fetching events for date range ${dateRange}...`)
    const response = await fetch("https://liikuntakauppa.hel.fi/helsinginkaupunki/call/asiointi/getreservationevents", {
        "body": `input_format=json&output_format=json&_normalize=true&content=${JSON.stringify(query)}`,
        "cache": "default",
        "credentials": "include",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-GB,en;q=0.9",
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded",
            "Pragma": "no-cache",
        },
        "method": "POST",
        "mode": "cors",
        "redirect": "follow",
        "referrer": "https://liikuntakauppa.hel.fi/helsinginkaupunki/ng/shop/public-calendar",
        "referrerPolicy": "origin-when-cross-origin"
    })
    const { result } = await response.json()
    const events = result
        .filter((event: any) => !!event.type && event.reservation_type_name !== "Fake Event")
        .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .map((event: any) => {
            return {
                reservation_type_id: event.reservation_type_id,
                reservation_type_name: event.reservation_type_name.trim(),
                reservation_group_name: event.reservation_group_name.trim(),
                resource_id: event.resource_id,
                title: [event.title, event.showtitle].filter(s => !!s).join(' / '),
                service: event.service,
                service_id: event.service_id,
                location_id: event.location_id,
                date: event.start.split(' ')[0],
                start: new Date(event.start),
                end: new Date(event.end),
                starttime: event.start.split(' ')[1].replace(/:00$/, ''),
                endtime: event.end.split(' ')[1].replace(/:00$/, ''),
                available: (event.reservation_group_name !== 'Suljettu' && event.reservation_group_name !== 'Kunnostus') && (event.reservation_type_id === 4 || event.reservation_type_name === "Yleisövuoro")
            } as Event
        })
        .flatMap((event: Event, index: number, array: Event[]) => {
            if (index === 0) {
                return [event]
            }
            const previous = array[index - 1]
            if (previous.date === event.date && event.start.getTime() - previous.end.getTime() > 1000) {
                const gapEvent: Event = {
                    reservation_type_id: 0,
                    reservation_type_name: 'Vapaa aika',
                    reservation_group_name: 'Vapaa aika',
                    resource_id: event.resource_id,
                    title: '(vapaa aika)',
                    service: 'Muu toiminta',  // TODO: grab these from the "services" endpoint's data
                    service_id: 66,           // TODO: grab these from the "services" endpoint's data
                    location_id: event.location_id,
                    date: event.date,
                    start: previous.end,
                    starttime: previous.endtime,
                    end: event.start,
                    endtime: event.starttime,
                    available: true,
                }
                return [gapEvent, event]
            }
            return [event]
        })
    return events
}
