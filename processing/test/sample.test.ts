import { describe, it, expect } from "vitest";
import { getWeekNumber } from "../src/utils/dates.js";

describe('getWeekNumber', () => {

    describe('without an explicit date passed in', () => {
        it('should return the current year and week number', () => {
            const [ year, week ] = getWeekNumber()
            expect(year).toBeGreaterThan(2023)
            expect(week).toBeLessThan(54)
        })
    })

    describe('with an explicit date passed in', () => {
        it('should return the current year and week number', () => {
            const date = new Date('2022-12-25')
            const [ year, week ] = getWeekNumber(date)
            expect(year).toStrictEqual(2022)
            expect(week).toStrictEqual(51)
        })
    })
})