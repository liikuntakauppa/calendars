import { createHash } from 'crypto';

/**
 * Hashes a string using md5
 *
 * @param {string} str
 * @returns {string}
 */
export const md5 = (str: string) => createHash('md5').update(str).digest('hex')

/**
 * Hashes a string using SHA-1
 *
 * @param {string} str
 * @returns {string}
 */
export const sha1 = (str: string) => createHash('sha1').update(str).digest('hex')
