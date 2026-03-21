export function SafeProposalServiceNotice() {
  return (
    <div className="mt-4 rounded-xl border border-dashed px-3 py-3 text-sm">
      <p className="font-medium">Safe proposal service unavailable.</p>
      <p className="text-muted-foreground mt-1">
        Proposal actions are disabled until server access to the Safe
        Transaction Service is restored.
      </p>
    </div>
  )
}
