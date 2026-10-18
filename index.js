import { mkdir, realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createTimestampedDirectory } from './timestamp.js'

/** Exact HTTP route used by the Client half to ensure the shared bucket workspace. */
const ENSURE_ROUTE = '/no-need-workspace/ensure-bucket'
/** Custom header that keeps cross-site form/fetch requests away from the route. */
const REQUEST_HEADER = 'x-no-need-workspace'
/** Shared bucket directory name; its sessions receive one timestamped subfolder each. */
const BUCKET_DIRECTORY = 'workspaces'

/**
 * The Harness data home: the configured `$DSH_HOME`, else `~/.dsh`. A
 * profile-linked bundle cannot import the in-box `dsh-home-paths` helper
 * because its real path sits outside the profile's module-resolution tree, so
 * the same precedence is applied here.
 * @returns {string} absolute Harness home.
 */
function resolveDataHome() {
  const configured = process.env.DSH_HOME
  if (typeof configured === 'string' && configured.trim() !== '') return configured
  return join(homedir(), '.dsh')
}

/**
 * Whether the TCP peer is the local machine.
 * @param {import('node:http').IncomingMessage} request - incoming request.
 * @returns {boolean} true for a loopback peer address.
 */
function isLoopback(request) {
  const address = request.socket?.remoteAddress ?? ''
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

/**
 * Whether a browser request names this same origin. Requests without an Origin
 * header (same-origin navigations, non-browser callers) are left to the caller.
 * @param {import('node:http').IncomingMessage} request - incoming request.
 * @returns {boolean} true when no Origin is present or it matches the Host.
 */
function isSameOrigin(request) {
  const origin = request.headers.origin
  const host = request.headers.host
  if (origin === undefined || host === undefined) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/**
 * Write one JSON response.
 * @param {import('node:http').ServerResponse} response - response to finish.
 * @param {number} status - HTTP status code.
 * @param {Record<string, unknown>} payload - JSON body.
 * @param {Record<string, string>} [headers] - extra response headers.
 */
function respondJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  })
  response.end(JSON.stringify(payload))
}

/**
 * Resolve the canonical spelling of the bucket path once, so comparisons
 * against the session header and the working-directory projection agree on
 * symlinked homes. A missing bucket keeps the configured spelling.
 * @param {string} bucketPath - configured absolute bucket path.
 * @returns {() => Promise<string>} lazy resolver.
 */
function createBucketResolver(bucketPath) {
  let resolved
  return async () => {
    if (resolved !== undefined) return resolved
    try {
      resolved = await realpath(bucketPath)
      return resolved
    } catch {
      return bucketPath
    }
  }
}

/**
 * Allocate one timestamped working directory for a bucket session on its first
 * user message. Exported so the fold can be exercised without a live Host.
 *
 * The session header keeps pointing at the bucket workspace, so the sidebar
 * groups every such session under that one parent; only the effective working
 * directory moves to the new folder.
 * @param {object} options - fold inputs.
 * @param {{ agent: { id: string }, messages: readonly unknown[], signal?: AbortSignal }} options.payload - `agent/pre-step` payload.
 * @param {{ get(id: string): { header?: { cwd?: string } } | undefined }} options.sessions - Host session store.
 * @param {{ get(session: object): string, set(agent: object, path: string, signal?: AbortSignal): Promise<string> }} options.workingDirectory - Host working-directory service.
 * @param {string} options.bucket - canonical bucket path.
 * @param {Set<string>} [options.inFlight] - per-session re-entry guard.
 * @param {Date} [options.now] - clock override.
 * @param {(baseDir: string, date?: Date) => Promise<string>} [options.createDirectory] - directory allocator override.
 * @returns {Promise<string | undefined>} the assigned directory, or undefined when this step is not the first message of a bucket session.
 */
export async function assignAutoWorkspace(options) {
  const {
    payload,
    sessions,
    workingDirectory,
    bucket,
    inFlight,
    now = new Date(),
    createDirectory = createTimestampedDirectory,
  } = options
  const { agent, messages, signal } = payload
  if (agent === undefined || !Array.isArray(messages) || messages.length === 0) return undefined
  if (inFlight !== undefined && inFlight.has(agent.id)) return undefined
  const session = sessions.get(agent.id)
  if (session === undefined) return undefined
  if (session.header?.cwd !== bucket) return undefined
  if (workingDirectory.get(session) !== bucket) return undefined
  inFlight?.add(agent.id)
  try {
    const directory = await createDirectory(bucket, now)
    await workingDirectory.set(agent, directory, signal)
    return directory
  } finally {
    inFlight?.delete(agent.id)
  }
}

/**
 * Host half of the auto-workspace bundle: ensure the shared bucket workspace
 * directory and give each bucket session its own folder on the first message.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 */
export function apply(ctx) {
  const bucketPath = join(resolveDataHome(), BUCKET_DIRECTORY)
  const resolveBucket = createBucketResolver(bucketPath)

  const webServer = ctx.get('webServer')
  if (webServer !== undefined) {
    const handler = async (request, response) => {
      if (request.method !== 'POST') {
        respondJson(response, 405, { error: 'method not allowed' }, { allow: 'POST' })
        return
      }
      if (request.headers[REQUEST_HEADER] !== '1') {
        respondJson(response, 403, { error: 'missing request header' })
        return
      }
      if (!isLoopback(request)) {
        respondJson(response, 403, { error: 'loopback requests only' })
        return
      }
      if (!isSameOrigin(request)) {
        respondJson(response, 403, { error: 'cross-origin request' })
        return
      }
      try {
        await mkdir(bucketPath, { recursive: true })
        respondJson(response, 200, { path: bucketPath })
      } catch (error) {
        ctx.logger?.warn?.(`no-need-workspace: could not ensure the bucket directory: ${String(error)}`)
        respondJson(response, 500, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    ctx.effect(() => webServer.register({ kind: 'exact', path: ENSURE_ROUTE, handler }))
  }

  const sessions = ctx.get('sessions')
  const workingDirectory = ctx.get('workingDirectory')
  if (sessions === undefined || workingDirectory === undefined) return

  const inFlight = new Set()
  ctx.on('agent/pre-step', async (payload, next) => {
    try {
      const bucket = await resolveBucket()
      await assignAutoWorkspace({ payload, sessions, workingDirectory, bucket, inFlight })
    } catch (error) {
      ctx.logger?.warn?.(`no-need-workspace: could not assign the session directory: ${String(error)}`)
    }
    return next()
  })
}
