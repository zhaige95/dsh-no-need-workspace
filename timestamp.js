import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Format one date as the workspace folder name: local date, then local time.
 * The spelling avoids characters that are invalid in Windows file names.
 * @param {Date} date - clock value to render.
 * @returns {string} `YYYY-MM-DD_HH-mm-ss`.
 */
export function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  return `${day}_${time}`
}

/**
 * Create a zero-byte directory named after `date` under `baseDir`, adding a
 * numeric suffix when that exact second already has a directory.
 * @param {string} baseDir - absolute parent directory; created when missing.
 * @param {Date} date - clock value used for the name.
 * @returns {Promise<string>} the created absolute directory.
 */
export async function createTimestampedDirectory(baseDir, date = new Date()) {
  await mkdir(baseDir, { recursive: true })
  const stamp = formatTimestamp(date)
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const name = attempt === 0 ? stamp : `${stamp}-${attempt + 1}`
    const directory = join(baseDir, name)
    try {
      await mkdir(directory)
      return directory
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error
    }
  }
  throw new Error(`could not allocate a unique timestamped directory under ${baseDir}`)
}
