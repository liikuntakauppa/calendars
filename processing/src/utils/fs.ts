import { join } from 'path'
import { mkdirSync, statSync, existsSync } from 'fs'

/**
 * Creates the given directory path with `fs.mkdirSync` and returns the resulting path.
 *
 * @param pathElements The path elements to join together and subsequently create.
 * @returns The resulting path to the created directory.
 */
export const mkdir = (...pathElements: string[]): string => {
    const outputDir = join(...pathElements)
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true })
        return outputDir
    }
    if (statSync(outputDir).isDirectory()) {
        return outputDir
    } else if (statSync(outputDir).isFile()) {
        throw new Error(`Cannot create directory ${outputDir}: A file with the same name already exists.`)
    } else {
        throw new Error(`${outputDir} exists but isn't neither a directory or a file?`)
    }
}