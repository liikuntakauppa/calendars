import { join, resolve } from 'path';

import { Location, Service, Resource } from "../types.js";
import { mkdir } from '../utils/fs.js';
import { fetchServices, fetchLocationsAndResourcesByService, fetchReservationEvents } from "../datasource/public-calendar-api.js";
import { generateIcsFile } from "../calendar/calendar.js";


type RelevantServicesAndLocations = { [name:string]: string[] }
type AggregatedServicesAndLocations = { [name:string]: RelevantServicesAndLocations }


const relevantLocationNamesForIceHockey: string[] = [
    'Brahenkenttä',
    'Jätkäsaaren liikuntapuisto',
    'Oulunkylän liikuntapuisto',
    'Käpylän liikuntapuisto',
    'Lauttasaaren liikuntapuisto',
]

const relevantLocationNamesForSoccer: string[] = [
    'Töölön pallokenttä'
]

const relevantLocationNamesForBasketball: string[] = [
    'Töölön kisahalli'
]

const relevance: RelevantServicesAndLocations = {
    'Jalkapallo': relevantLocationNamesForSoccer,
    'Koripallo': relevantLocationNamesForBasketball,
    'Jääkiekko': relevantLocationNamesForIceHockey,
    'Jääpallo': relevantLocationNamesForIceHockey,
    'Taitoluistelu': relevantLocationNamesForIceHockey,
}

const collections: AggregatedServicesAndLocations = {
    'Jääkiekko': {
        'Jääkiekko': relevantLocationNamesForIceHockey,
        'Jääpallo': relevantLocationNamesForIceHockey,
        'Taitoluistelu': relevantLocationNamesForIceHockey,
    },
    'Jalkapallo': {
        'Jalkapallo': relevantLocationNamesForSoccer,
    },
    'Koripallo': {
        'Koripallo': relevantLocationNamesForBasketball,
    }
}

const generateCalendar = async (name: string, config: RelevantServicesAndLocations) => {
    const services = await fetchServices();
    console.log(`Fetched ${services.length} services...`)
    const relevantServices = services.filter((service: Service) => Object.keys(config).includes(service.name))
    const relevantEvents = await Promise.all(relevantServices.map(async (service: Service) => {
        console.log(`Found relevant service: ${service.name}`)
        const { locations, resources } = await fetchLocationsAndResourcesByService(service.id)
        const relevantLocations = locations.filter((loc: Location) => relevance[service.name].includes(loc.name))
        const relevantLocationIds = relevantLocations.map(loc => loc.id)
        const relevantResources = resources.filter((res: Resource) => relevantLocationIds.includes(res.location))
        console.log(`Fetched ${relevantLocations.length} relevant locations and ${relevantResources.length} resources for ${service.name}...`)
        console.log("Fetching events...")
        const events = await fetchReservationEvents(service.id, relevantLocationIds, relevantResources.map(res => res.id))
        return { events, locations: relevantLocations, resources: relevantResources }
    }))

    const events = relevantEvents.flatMap(entry => entry.events)
    const resources = relevantEvents.flatMap(entry => entry.resources)
    const locations = relevantEvents.flatMap(entry => entry.locations)

    const fileName = `calendar-${name.toLowerCase().replace(/ä|å/g, 'a').replace(/ö/g, 'o')}.ics`
    const filePath = join(mkdir('public', 'calendars'), fileName)
    console.log(`Generating an ICS file for ${JSON.stringify(name)} from ${events.length} events at ${JSON.stringify(resolve(filePath))}...`)
    generateIcsFile(filePath, events, resources, locations)
}


const run = async () => {
    Object.keys(collections).forEach(async (name) => {
        await generateCalendar(name, collections[name])
    })
}

run();
