import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SafeProposalServiceNotice } from './safe-proposal-service-notice'

describe('SafeProposalServiceNotice', () => {
  it('renders generic persistent Safe service copy', () => {
    const html = renderToStaticMarkup(<SafeProposalServiceNotice />)

    expect(html).toContain('Safe proposal service unavailable.')
    expect(html).toContain(
      'Proposal actions are disabled until server access to the Safe Transaction Service is restored.'
    )
  })
})
