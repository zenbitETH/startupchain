export const COMPANY_REGISTRATION_PENDING_MESSAGE =
  'Company registration transaction already submitted. Waiting for confirmation.'

type RecordCompanySubmitGuardParams = {
  step: string
  isLocked: boolean
  isSigningCompany: boolean
  isConfirmingCompany: boolean
  hasRecordCompanyTxHash: boolean
}

export function shouldBlockRecordCompanySubmit({
  step,
  isLocked,
  isSigningCompany,
  isConfirmingCompany,
  hasRecordCompanyTxHash,
}: RecordCompanySubmitGuardParams): boolean {
  return (
    step !== 'awaiting-signature' ||
    isLocked ||
    isSigningCompany ||
    isConfirmingCompany ||
    hasRecordCompanyTxHash
  )
}
