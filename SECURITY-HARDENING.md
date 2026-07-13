# StartupChain security hardening

> Author: Lucia (Zenbit) · Branch: `hardening/contract-and-eas-security` · **Sepolia only — no mainnet
> moves.** This PR applies the transferable hardening patterns from the AxoloDAO best-of-4 review to
> StartupChain. The two products stay fully decoupled (no shared code); only the *patterns* transfer.

Each fix ships with a test that proves the fix. `forge test` = **61 passing** (13 new StartupChain tests,
2 new AttestationModule tests, existing suites unchanged). TS-layer typecheck clean.

## Contract fixes

| # | Sev | Fix | Test |
|---|-----|-----|------|
| 1 | HIGH | **`recordCompany` caller auth.** The caller must be an owner of the target Safe (`ISafe.isOwner`), and the Safe must be deployed. Closes the `ensNameToCompanyId` squat / front-run vector (previously anyone could register any name/Safe). | `test_recordCompany_squatByNonOwnerReverts`, `test_recordCompany_nonContractSafeReverts` |
| 2 | HIGH | **Admin → `Ownable2Step` + timelock.** Ownership is 2-step (`transferOwnership` → `acceptOwnership`); deploy the owner as a **2/3 Safe**. `setFeeRecipient` is now `proposeFeeRecipient` → (2-day timelock) → `executeFeeRecipient`. | `test_ownershipIsTwoStep`, `test_setFeeRecipientIsTimelocked`, `test_withdrawOnlyOwner` |
| 3 | HIGH | **CEI + reentrancy in `recordCompany`.** All state is written before the fee `.call`, and the function is `nonReentrant` (the fee transfer previously executed before state writes). A reverting fee recipient reverts the whole tx and persists nothing. | `test_recordCompany_revertingFeeRecipientRevertsWholeTx`, `test_recordCompany_feePaidToTreasury` |
| 4 | HIGH | **Harden `AttestationModule` before it ships.** `onlyCompanyMember` now enforces real membership via the StartupChain registry (`isFounder`); the six schema-config setters are owner-gated (were permissionless one-time, i.e. first-caller-pins). | `testOnlyCompanyMemberCanAttest`, `testSchemaSetterIsOwnerGated` |
| 5 | MED | **Correct `.eth` namehash.** `transferENS` / `createSubdomain` / `revokeSubdomain` now parent labels under `namehash("eth")` instead of the ENS root (the old code treated the label as a TLD). Unblocks the dashboard subdomain / resolution issues (#43/#44/#33). | `test_namehash_isEthParentedNotRoot` |
| 6 | MED | **Bounded founder loops + reverse index.** `MAX_FOUNDERS = 50` caps every founder loop; a `founder → companyId[]` index (`getCompaniesByFounder`) replaces the off-chain O(n) full-registry scan; `isFounder` backs the #4 membership check. | `test_maxFoundersEnforced`, `test_founderReverseIndex` |

## Off-chain fixes

| # | Sev | Fix | File |
|---|-----|-----|------|
| 7 | MED | **Bind payment to the registration.** `checkPaymentStatusAction` now requires the payment tx to originate from a founder wallet of the registration (`allowedFrom`), closing the cross-user / cross-registration replay by non-participants, plus an optional per-registration `expectedCommitment` (tx `input`) hook that binds one payment to one (user, ENS) once the client sends it. | `payment-actions.ts`, `actions.ts` |
| 8 | MED | **De-risk the hot relayer key.** The treasury is no longer the signer address by default: `STARTUPCHAIN_TREASURY_ADDRESS` sets a distinct treasury (ideally a Safe), separating the least-privilege gas payer from fee custody. Falls back to the signer with a loud warning for dev. | `startupchain-client.ts` |

**#7 residual (flagged, not fully closed):** true single-use (one payment ⇒ at most one registration)
needs either a persisted consumed-tx set or moving the fee on-chain into `recordCompany`'s `msg.value`.
This repo has no server-side store yet; the founder binding closes the replay-by-non-participant vector
and the commitment hook closes cross-ENS reuse when the client adopts it. Tracked as follow-up.

## Tradeoffs surfaced

- **Solo companies get a 1/1 Safe.** `recordCompany` allows `threshold == founders.length == 1`. A 1/1
  Safe has no multisig protection, but enforcing a 2-of-N floor would block legitimate solo founders. We
  **allow it and document it** rather than enforce a floor. `test_soloFounderOneOfOneSafeAllowed`.
- **Subdomain ENS ownership model.** The correct namehash (#5) is necessary but not sufficient: the Safe
  owns the 2LD, so `createSubdomain`/`revokeSubdomain` require the StartupChain contract to be an approved
  operator of the company node (`ensRegistry.setApprovalForAll(startupChain, true)` from the Safe) or the
  subdomain logic to move into a Safe module. This PR fixes the node math and documents the operator
  requirement; the module refactor is out of scope.
- **Founder reverse-index is append-only.** `getCompaniesByFounder` may list a company a founder has since
  left (after `updateFounders`); callers confirm current membership with `isFounder`. This avoids O(n²)
  removal bookkeeping.

## Not in this PR (item #9 — separate, larger PR)

Moving the cap-table detail off contract storage to a permanent Arweave snapshot + an EAS
`CompanyFormed`/`CapTableAttested` anchor (per the AxoloDAO ADR-001 storage-tier rule) is a larger
refactor with its own parity + squat/replay regression tests. Left as a follow-up so this PR stays a
focused, reviewable hardening set.

## Deploy notes (Sepolia)

Constructors changed: `StartupChain(ensRegistry, ensResolver, feeRecipient, initialOwner)` and
`AttestationModule(eas, startupChainRegistry, initialOwner)`. Set `STARTUPCHAIN_OWNER` (the 2/3 Safe),
`FEE_RECIPIENT` / `STARTUPCHAIN_TREASURY_ADDRESS` (a treasury distinct from the signer). External audit
precedes any mainnet deploy.
