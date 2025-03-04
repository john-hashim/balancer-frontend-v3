'use client'

import { captureError } from '@/lib/shared/utils/errors'
import {
  SentryMetadata,
  captureSentryError,
  shouldIgnoreError,
} from '@/lib/shared/utils/query-errors'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Global handler for every react-query error
    onError: (error, query) => {
      if (shouldIgnoreError(error)) return
      console.log('Sentry capturing error: ', {
        meta: query?.meta,
        error,
        queryKey: query.queryKey,
      })

      if (query?.meta) return captureSentryError(error, query?.meta as SentryMetadata)

      // Unexpected error in query (as expected errors should have query.meta)
      captureError(error, { extra: { queryKey: query.queryKey } })
    },
  }),
})

export function ReactQueryClientProvider({ children }: { children: ReactNode | ReactNode[] }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
