import { useBreakpoints } from '@/lib/shared/hooks/useBreakpoints'
import { Card, HStack, Text } from '@chakra-ui/react'
import { SwapTokenRow } from '../../tokens/TokenRow/SwapTokenRow'
import { MobileStepTracker } from '../../transactions/transaction-steps/step-tracker/MobileStepTracker'
import { SwapDetails } from '../SwapDetails'
import { SwapRate } from '../SwapRate'
import { useSwap } from '../SwapProvider'
import { useSwapReceipt } from '../../transactions/transaction-steps/useTransactionLogsQuery'
import { useUserAccount } from '../../web3/UserAccountProvider'
import { BalAlert } from '@/lib/shared/components/alerts/BalAlert'
import { HumanAmount } from '@balancer/sdk'
import { slippageDiffLabel } from '@/lib/shared/utils/slippage'
import { AnimateHeightChange } from '@/lib/shared/components/modals/AnimatedModalBody'
import { CardPopAnim } from '@/lib/shared/components/animations/CardPopAnim'

export function SwapSummary() {
  const { isMobile } = useBreakpoints()
  const { userAddress, isLoading: isUserAddressLoading } = useUserAccount()
  const {
    tokenIn,
    tokenOut,
    transactionSteps,
    selectedChain,
    isWrap,
    swapTxHash,
    swapTxConfirmed,
    simulationQuery,
  } = useSwap()

  const {
    isLoading: isLoadingReceipt,
    error,
    sentToken,
    receivedToken,
  } = useSwapReceipt({
    txHash: swapTxHash,
    userAddress,
    chain: selectedChain,
  })

  const expectedTokenOut = simulationQuery?.data?.returnAmount as HumanAmount

  if (!isUserAddressLoading && !userAddress) {
    return <BalAlert status="warning" content="User is not connected" />
  }
  if (swapTxHash && error) {
    return <BalAlert status="warning" content="We were unable to find this transaction hash" />
  }
  if (swapTxHash && !isLoadingReceipt && (!receivedToken || !sentToken)) {
    return (
      <BalAlert
        status="warning"
        content="We were unable to find logs for this transaction hash and the connected account"
      />
    )
  }

  const shouldShowReceipt =
    !isWrap && !!swapTxHash && !isLoadingReceipt && !!receivedToken && !!sentToken
  const isWrapComplete = isWrap && swapTxHash && swapTxConfirmed

  function tokenOutLabel() {
    if (shouldShowReceipt || isWrapComplete) return 'You got'
    if (isWrap) return "You'll get"
    return "You'll get (if no slippage)"
  }

  return (
    <AnimateHeightChange spacing="sm" w="full">
      {isMobile && <MobileStepTracker transactionSteps={transactionSteps} chain={selectedChain} />}

      <Card variant="modalSubSection">
        <SwapTokenRow
          label={shouldShowReceipt || isWrapComplete ? 'You paid' : 'You pay'}
          chain={selectedChain}
          tokenAmount={shouldShowReceipt ? sentToken.humanAmount : tokenIn.amount}
          tokenAddress={shouldShowReceipt ? sentToken.tokenAddress : tokenIn.address}
        />
      </Card>

      <Card variant="modalSubSection">
        <SwapTokenRow
          label={tokenOutLabel()}
          rightLabel={
            shouldShowReceipt
              ? slippageDiffLabel(receivedToken.humanAmount || '0', expectedTokenOut)
              : undefined
          }
          chain={selectedChain}
          tokenAmount={shouldShowReceipt ? receivedToken.humanAmount : tokenOut.amount}
          tokenAddress={shouldShowReceipt ? receivedToken.tokenAddress : tokenOut.address}
        />
      </Card>

      {!shouldShowReceipt && !isWrapComplete && (
        <>
          <CardPopAnim key="swap-details">
            {!swapTxHash && (
              <Card variant="modalSubSection">
                <SwapDetails />
              </Card>
            )}
          </CardPopAnim>
          <CardPopAnim key="exchange-rate">
            <Card variant="modalSubSection" fontSize="sm">
              <HStack justify="space-between" w="full">
                <Text color="grayText">Exchange rate</Text>
                <SwapRate />
              </HStack>
            </Card>
          </CardPopAnim>
        </>
      )}
    </AnimateHeightChange>
  )
}
