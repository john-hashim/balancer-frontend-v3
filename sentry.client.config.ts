// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { sentryDSN } from './sentry.config'
import { isProd } from './lib/config/app.config'
import { shouldIgnoreError } from './lib/shared/utils/query-errors'

Sentry.init({
  // Change this value only if you need to debug in development (we have a custom developmentSentryDSN for that)
  enabled: isProd,
  dsn: sentryDSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 0,

  replaysSessionSampleRate: 0,

  // disable all default integrations to debug
  // defaultIntegrations: false

  integrations: function (integrations) {
    // Filter out the default GlobalHandlers integration that we will customize later
    const filteredIntegrations = integrations.filter(() => true)

    /*
    Example of custom integration (updating GlobalHandlers integration)

    import { globalHandlersIntegration } from '@sentry/nextjs'

    filteredIntegrations.push(
       globalHandlersIntegration({
         onerror: false,
         onunhandledrejection: false,
       })
     )
     console.log(
       'Active sentry integrations: ',
       filteredIntegrations.map(i => i.name)
     )
     */
    return filteredIntegrations
  },

  beforeSend(event) {
    /*
      Ensure that we capture all possible errors, including the ones that NextJS/React Error boundaries can't properly catch.
      If the error comes from a flow url, we tag it as fatal and add custom exception type for better traceability/grouping.
      More info:
        Error boundaries:
          https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
          https://nextjs.org/docs/app/building-your-application/routing/error-handling
        Sentry integrations:
          https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/
    */
    const criticalFlowPaths = [
      'add-liquidity',
      'remove-liquidity',
      'stake',
      'unstake',
      'migrate-stake',
      'swap',
    ]
    const criticalFlowPath = criticalFlowPaths.find(path => event.request?.url?.includes(path))
    if (!criticalFlowPath) return event
    return handleFatalError(event, criticalFlowPath)
  },
})

function handleFatalError(
  event: Sentry.ErrorEvent,
  criticalFlowPath: string
): Sentry.ErrorEvent | null {
  event.level = 'fatal'

  if (event?.exception?.values?.length) {
    const firstValue = event.exception.values[0]

    if (shouldIgnoreError(new Error(firstValue.value))) return null

    const flowType = uppercaseSegment(criticalFlowPath)
    firstValue.value = `Unexpected error in ${flowType} flow.
    Cause: ${firstValue.type}: ${firstValue.value}`

    firstValue.type = flowType + 'Error'
    event.exception.values[0] = firstValue
  }

  return event
}

function uppercaseSegment(path: string): string {
  return path
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}
