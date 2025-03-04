import { PoolList } from '@/lib/modules/pool/PoolList/PoolList'
import FadeInOnView from '@/lib/shared/components/containers/FadeInOnView'
import { GqlPoolType } from '@/lib/shared/services/api/generated/graphql'
import { Skeleton } from '@chakra-ui/react'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { CowFooter } from './CowFooter'
import { DefaultPageContainer } from '@/lib/shared/components/containers/DefaultPageContainer'
import { CowHeader } from './CowHeader'

export const metadata: Metadata = {
  title: `CoW AMM DeFi Liquidity Pools`,
  description: `
    CoW AMM protects LPs from LVR so they can provide liquidity
    with less risk and more return.
  `,
}

export default function PoolsPage() {
  return (
    <>
      <DefaultPageContainer>
        <CowHeader />
        <FadeInOnView animateOnce={false}>
          <Suspense fallback={<Skeleton w="full" h="500px" />}>
            <PoolList fixedPoolTypes={[GqlPoolType.CowAmm]} />
          </Suspense>
        </FadeInOnView>
      </DefaultPageContainer>

      <CowFooter />
    </>
  )
}
