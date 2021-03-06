import Debug from 'debug'

import { ErrorMiddleware } from '@packages/proxy'
import { NetEventFrames } from '../types'
import { emit } from './util'
import errors from '@packages/server/lib/errors'

const debug = Debug('cypress:net-stubbing:server:intercept-error')

export const InterceptError: ErrorMiddleware = function () {
  const backendRequest = this.netStubbingState.requests[this.req.requestId]

  if (!backendRequest) {
    // either the original request was not intercepted, or there's nothing for the driver to do with this response
    return this.next()
  }

  debug('intercepting error %o', { req: this.req, backendRequest })

  // this may get set back to `true` by another route
  backendRequest.sendResponseToDriver = false
  backendRequest.continueResponse = this.next

  const frame: NetEventFrames.HttpRequestComplete = {
    routeHandlerId: backendRequest.route.handlerId!,
    requestId: backendRequest.requestId,
    error: errors.clone(this.error),
  }

  emit(this.socket, 'http:request:complete', frame)

  this.next()
}
