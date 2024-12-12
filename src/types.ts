export type Service = { id: number, name: string }

export type Location = { id: number, name: string }

export type Resource = { id: number, name: string, location: number }

export type Event = {
    reservation_type_id: number,
    reservation_type_name: string,
    reservation_group_name: string,
    resource_id: number,
    title: string,
    service: string,
    service_id: number,
    location_id: number,
    date: string,
    start: Date,
    end: Date,
    starttime: string,
    endtime: string,
    available: boolean,
}
