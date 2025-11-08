This is plan made by SEO, it need technical refinement and discussion.
This document should be used to work on  exclusive and full technical MVP plan in /docs/mvp-plan-technical.md

Let's work step by step, refine every piece of technical implementation and decision by them. User should decide and approve specific technology and feature implementation. Don't use this information from pitch as a strict plan, a lot of topics and steps should be discussed


# Pitch plan
***
# 0. Purpose

Startupchain is a decentralized application (dApp) providing Onchain Company Services (OCS) for establishing and managing startups and small businesses. The MVP focuses on foundational features that let early adopters create “onchain companies” with proper company domain, minimal governance for funds management, tokenization, attestations, and basic DeFi interactions. The purpose is to reduce fragmentation in onchain services, lower the barrier for small businesses to adopt onchain tools, and bootstrap a platform that can incubate and accelerate companies while connecting them with stakeholders worldwide.

It integrates five fragmented onchain technologies into a cohesive service:

1. Human-readable name (ENS)
2. Company accounts (EOA management + Safe creation and management)
3. DeFi management (transfers, basic lending/borrowing)
4. Company attestations (EAS)
5. Company tokenization (ERC-20 shares with customizable tokenomics)

---

# 1. Scope

The development scope is to build a Web/mobile dApp with core features ready to scale up while balancing decentralization, security, and interoperability around user experience.

## **1.1 In-Scope (MVP)**

### **General:**

- Web/mobile dApp built with OSS libraries and frameworks.
- Dashboard to manage company and founder operations.
- **(If tokenization is Post-MVP)** Company profiles and activity; leaderboards with creation date and activity **(token stats and buy button hidden until Beta)**.
- AI Chatbot as a process companion.
- Default content in English with multilingual versions.
- **RainbowKit** as default wallet connection (MetaMask, Coinbase Wallet, WalletConnect).
- **Privy** as an **optional/secondary** login for non-crypto-native users (to be discussed)

### Networks:

- ENS registration on Ethereum mainnet for primary company domains
- OP Mainnet: preferred for withdrawals (cost efficiency in MX) and subdomain issuance.
- Use of Superchain interoperability frameworks.

### **Human-readable company name with Ethereum Name Service:**

- ENS main domain registration and management for company identity
- Subdomains registration and management for founders and members.
- UI to create/manage the main domain and subdomains, accessible from the company dashboard.

### **Company accounts:**

- EOA connection (connect button) for main domain assignment and interoperability with external dApps (e.g., Mirror, Zora).
- Multichain Safe creation and management (same address across multiple chains) for company treasury and minimal DAO-style governance. UI accessible from the company dashboard.

### **DeFi Management:**

- Company dashboard displaying accounts, balances, history, and charts
- Basic transactions for EOA and Safe accounts (receive/send).
- **Evaluate** lending/borrowing integrations (e.g., Aave, Morpho, Moonwell) for a minimal, safe initial flow (enable users to generate yield from deposited funds (savings account) and use them as collateral to borrow funds (credit account).

### **Company Attestations:**

- Onchain attestations (EAS) plus optional offchain attestations for timestamping company activities.
- Minimal governance using EAS attestations combined with Safe signing.
- UI to create and view company attestations, accessible from the dashboard.

## **1.2 Out-of-Scope (Future iterations):**

- ERC-20 bootstrapping with tokenomics customization: founder/stakeholder/liquidity distributions, tracking founder deposits into the Safe, stakeholder registry UI, and a minimal buy/sell interface
- Superchain subdomain issuance for promotional or community purposes
- Advanced governance (delegated voting, quadratic voting).
- Complex DeFi strategies beyond transfers/lending/borrowing.
- Multi-chain deployments and advanced scaling.
- Revenue streaming, or staking mechanisms.

## 1.3 Intended Audience

### 1.3.1 Users

**Founders & startups**

Founders and startups are developing products or services and need transparent onchain infrastructure to manage their day-to-day operations.

- *Benefits***:** Transparency, global accessibility, and decentralization that help them avoid the high costs of traditional company formation, bypass complex legal processes and bureaucracy, raise capital globally without geographic restrictions, manage multi-signature wallets for enhanced security, distribute equity transparently through tokens, and create verifiable records of their company's progress through attestations.
- *Obstacles***:** Technical barriers to entry and lack of onchain skills. The existing ecosystem has poor usability, making it difficult for non-developers to access these tools without significant learning investment.

**Small businesses**

Micro and small enterprises with traditional business models who want to access the potential benefits of Ethereum infrastructure, looking for practical improvements in their operations through cost reduction, enhanced transparency, and new financial services.

- *Benefits***:** Transparency, global accessibility, and decentralization that enable them to raise capital globally through alternative channels, manage multi-signature wallets for secure treasury operations, distribute equity or revenue shares transparently through tokens, create transparent financial records that build trust with stakeholders.
- *Obstacles***:** Technical barriers to entry and complete lack of onchain skills. The existing ecosystem has poor usability, needing solutions that feel familiar without significant learning investment.

**Organizations or clusters**

Accelerators, incubators, DAOs, industry associations, and business clusters that coordinate multiple companies or projects under shared infrastructure.

- *Benefits***:** Transparency, global accessibility, decentralization, and coordination tools that reduce administrative overhead. Also, manage multi-signature wallets across multiple entities, distribute equity or tokens with standardized processes, create transparent financial records for reporting, access alternative business credit, deploy unified tools across portfolio companies, track standardized performance metrics, aggregate data efficiently, compare performance across projects, and demonstrate impact to stakeholders.
- *Obstacles***:** Technical barriers to entry and lack of onchain skills across their organization.

### 1.3.2 Key actors (Company Tokenization)

**Stakeholders**

Individuals or entities who provide capital to companies by purchasing company tokens, supplying liquidity, investment capital and market validation.

- *Contribution***:** Capital, liquidity provision, market validation, and strategic guidance.
- *Benefits***:** Governance participation rights, liquidity provider fees, financial returns, early-stage access, and portfolio diversification.

**Contributors / Supporters**

Individuals or entities who contribute work, services, or resources to companies and receive tokens as compensation, providing validation of company legitimacy through their participation.

- *Contribution***:** Build products, provide services, create content, deliver technical expertise, invest time, offer professional services, and build community.
- *Benefits***:** Token compensation, valuable experience, and professional networks.

## 1.4 Definitions and Acronyms

**dApp:** Decentralized application that runs on a blockchain network rather than a centralized server. Its backend logic is executed by smart contracts, ensuring transparency, security, and resistance to single points of failure.

**Onchain:** Data, transactions, contracts, activities, or processes recorded directly on a blockchain network like Ethereum, rather than external systems or traditional databases.

**Ethereum:** Global computer that anyone can use to create and run programs on a distributed digital ledger. In **Startupchain**, all Onchain Company Services are built on Ethereum networks and technologies, leveraging its standards and infrastructure to provide identity, governance, tokenization, and attestations in a transparent and verifiable way.

**DAO:** Decentralized Autonomous Organization.

**DeFi:** Decentralized Finance, financial services (lending, borrowing, trading, etc.) built on blockchain networks without traditional intermediaries.

**EAS:** Ethereum Attestation Service.

**ENS:** Ethereum Name Service.

**EOA:** Externally Owned Account, a standard Ethereum account controlled by a private key (as opposed to a smart contract account).

**ERC-20:** Fungible token standard on Ethereum.

**L2:** Layer 2 scaling solution derived from Ethereum.

**Lending/borrowing protocols:** Basic ****Decentralized Finance services built with smart contracts.

**Mirror (Now Paragraph):** A publishing platform for web3 creators. Mirror migrated its brand and product to **Paragraph**, a crypto-enabled newsletter and publishing stack.

**OP Mainnet:** The main Layer 2 network of the Optimism ecosystem, built on the OP Stack.

**OSS:** Open Source Software, software whose code is publicly available and can be freely used, modified, and distributed.

**Privy:** Web2 login provider for crypto onboarding.

**RainbowKit:** A wallet connection toolkit for Ethereum dApps; used as Startupchain’s primary wallet onboarding (supports MetaMask, Coinbase Wallet, WalletConnect).

**Safe:** Multisig smart account infrastructure.

**Superchain:** A collective of blockchains built on the OP Stack that interoperate under shared governance and standards.

**Web2:** The second generation of the internet, dominated by centralized platforms, applications, and databases, in contrast to decentralized Web3 systems.

**Zora:** A protocol and marketplace stack for creating and trading content and creator coins, with minting tools and onchain media primitives.

---

# 2. Project Vision and Goals

Startupchain’s vision is to become the default **Onchain Company Services (OCS) platform** for startups and small businesses, enabling them to launch, manage, and scale transparently within the Ethereum ecosystem. The project aims to reduce complexity by integrating identity, governance, DeFi, tokenization, and attestations into a single, cohesive framework.

## 2.1 Project Goals and Objectives

### MVP

1. **Launch a secure MVP** with foundational features deployed on Ethereum testnets and OP Mainnet.
2. **Provide human-readable company identities** through ENS domains and subdomains.
3. **Enable transparent fund management** with multichain Safe accounts and minimal DAO governance.
4. **Support company financing and treasury operations** with basic DeFi services (transfers, lending, and borrowing).
5. Create a verifiable company history by integrating onchain and offchain attestations using EAS.
    1. **Onchain:** store compact numeric/status codes and hashes for **gas efficiency**.
    2. **Offchain:** store detailed documents/proofs (IPFS/Arweave), referenced by onchain hashes.

### Beta

1. **Introduce equity/revenue distribution tools** via ERC-20 token bootstrapping with customizable tokenomics.
2. **Lay the groundwork for scaling into the Superchain**, leveraging interoperability frameworks for future expansion.

## 2.2 Success Metrics

Success will be measured through adoption, reliability, and community engagement. The key performance indicators (KPIs) for the MVP and beyond include:

- **Company Creation & Adoption:**
    - Companies registered with ENS via Startupchain.
    - Subdomains assigned to founders and members.
    - Volume of funds managed (transfers, lending, and borrowing).
    - Badges earned in the Onchain Incubation program.
- **Governance & Treasury Activity:**
    - Safe accounts created and actively used.
    - Proposals created, voted on, and executed
- **Transparency & Attestations:**
    - Attestations created (onchain/off-chain).
    - Attestations referenced in decisions or reports.
- **User Experience & Accessibility**
    - Companies onboarded via RainbowKit (primary) and Privy (secondary).
    - Multilingual user sessions.
- **Community & OSS Engagement**
    - Active contributors on GitHub.
    - Issues resolved, PRs merged, forks.
    - Governance participation in early community forums.
- **Tokenization (Beta+)**
    - ERC-20 tokens issued for company shares.
    - Token distributions executed (linked to founder deposits).
    - Market capitalization of token pools.
    - Total value locked in liquidity programs.
    - Total trading volume.

---

# **3. Functional Requirements**

The MVP centers on **company creation + ENS identity + minimal governance rails**, with tokenization staged for **Beta**. Requirements below reflect the **current StartupChain contract** and **ENS interfaces** you’ve implemented, while leaving clear extension points for CompanyToken and Zora Coins SDK–powered UX.

## **3.1 Smart Contract Requirements**

### **3.1.1 StartupChain (Core Registry & ENS Integration)**

Registers a company, mints its **ENS name** via the registrar, sets the resolver address for the name, stores founders, and indexes companies by id / owner / ENS.

**Key Storage & Mappings**

- nextCompanyId (auto-increment)
- companies[companyId] → Company { id, companyAddress, ensName, creationDate, founders[] }
- addressToCompanyId[owner] → companyId
- ensNameToCompanyId[name] → companyId

**Events**

- CompanyRegistered(companyId, companyAddress, ensName, creationDate, founders[])
- ENSTransferred(companyId, ensName, from, to)

**Primary Functions (current)**

- registerCompany(string ensName, address[] founders) → companyId
    - Validates founders, name uniqueness, and **ENS label availability** via IENSRegistrar.available(label).
    - Calls ensRegistrar.register(label, msg.sender) and sets the resolver addr for the node.
    - Creates and stores the Company struct, indexes mappings, emits CompanyRegistered.
- transferENS(uint256 companyId, address newOwner)
    - Updates ENS owner and resolver addr, re-indexes address mapping, emits ENSTransferred.
- Read helpers: getCompany*, getCompanyFounders, getTotalCompanies.

**Pre-/Post-Conditions & Constraints**

- **ENS Funding:** Registration requires the registrar’s fee paid by the caller (EOA or Safe) on mainnet.
- **Namehash/Resolver Correctness (Implementation Note):** The node computation must follow **ENS namehash** for the **registered FQDN** (e.g., namehash("myco.eth")), not just the label; ensure compatibility with .eth base registrar and the **public resolver** for forward resolution (A/ADDR).
- **Access Control:** Only companyAddress can transferENS.
- **Founders:** Non-zero addresses; at least one founder.

**Security Considerations**

- Guard against label squatting / front-running (surface fee/UI checks).
- Ensure resolver set is a trusted resolver (public resolver or specified).
- Reentrancy not expected, but keep functions non-payable and minimal.

### **3.1.2 Governance (Safe-First, Minimal Wrapper) — MVP**

Use **Safe** for treasury control. Provide a thin onchain proposal/vote wrapper (or off-chain snapshot + Safe execution) with **1 member = 1 vote** in MVP.

**Functions (if onchain wrapper)**

- proposeTransaction(bytes txData)
- vote(uint256 proposalId, bool support)
- execute(uint256 proposalId)

**Events**

- ProposalCreated, VoteCast, ProposalExecuted

**Pre-/Post-Conditions**

- Only company members can propose/vote.
- Quorum and threshold configured on creation.
- Execution triggers **Safe** transaction.

**Security**

- Prevent double-execution; verify Safe tx hash; store executed flag.
- All proposal calldata must be deterministic and signed off in UI.

### **3.1.3 Attestations ( EAS) — MVP**

Record verifiable **company events** (founder deposits, milestones, hires, grants) as **onchain attestations**, with optional off-chain payloads referenced by hash.

**Functions**

- createAttestation(company, eventType, metadataHash)
- revokeAttestation(attestationId)

**Conventions**

- **onchain:** compact codes & hashes for gas efficiency.
- **Off-chain:** IPFS/Arweave documents; hash stored onchain for integrity.

**Security**

- Only authorized company roles can attest; schema follows **EAS** standards.

### **3.1.4 CompanyToken (ERC-20) — Beta**

**Description**

Fungible token representing **equity / revenue-share** units for a company. Mint/burn controlled by company governance (or an authorized Safe module).

**Required Interface**

- Standard ERC-20 (OpenZeppelin) with **role-gated mint/burn**.
- Optional: **EIP-2612 permit** for gas-efficient UX.

**Functions**

- mint(address to, uint256 amount) — only governance / Safe.
- burn(address from, uint256 amount) — only governance / Safe.
- Standard ERC-20: transfer, approve, allowance, balanceOf, totalSupply.

**Events**

- Minted(to, amount), Burned(from, amount), plus ERC-20 standard.

**Pre-/Post-Conditions**

- **Issuance Policy:** Define caps or schedules in company config.
- **Distribution Logic:** Initial allocation policies (founders, contributors, LP/treasury) live off-chain as policy + onchain as batched mint transactions.

**Security Considerations**

- Strict minter role; no hidden inflation.
- Optional timelock for large mints.
- Unit/fuzz tests on rounding, edge cases.

## **3.2 Frontend / dApp Requirements**

**UI Surfaces**

- **Onboarding:** Create / join company.
- **ENS Registration:** Search, register, set resolver, and confirm mapped address.
- **Dashboard:** Company identity, founders, treasury (Safe + EOA), activity.
- **Governance:** Propose, sign, execute Safe transactions; simple vote flows if wrapper is used.
- **Attestations:** Create/view company attestations; link to off-chain docs.

**Wallet & Auth**

- **RainbowKit (Primary):** MetaMask, Coinbase Wallet, WalletConnect.
- **Privy (Secondary, Optional):** Email/social for non-crypto-native onboarding.

**Data & Indexing**

- **The Graph** subgraphs for: company registry, ENS events, governance proposals, attestations.
- Realtime UI hinting post-tx; optimistic updates with onchain reconciliation.

**DeFi (MVP UX)**

- **Safe & EOA transfers** with clear fee/network prompts.
- “Connect DeFi” placeholder panel (Aave/Morpho/Moonwell) gated behind **feature flag** while flows are designed and audited.

---

## **3.3 Protocol / Off-Chain Requirements**

**Indexing**

- Subgraphs for: CompanyRegistered, ENSTransferred, proposal life-cycle, attestations.

**Storage**

- **IPFS/Arweave** for off-chain docs; store **content hash** onchain.

**Relayers (Optional)**

- Meta-tx relayer for subsidized onboarding (cap + allowlist).

**Zora Coins SDK (Token UX & Integrations) — Beta**

While CompanyToken provides the **canonical ERC-20**, Startupchain can leverage **Zora’s Coins SDK** to:

- Provide **creator/content coin** style UX patterns for discovery, pricing, and trading UI.
- Generate **server-assisted calldata** for coin creation / content association where appropriate.
- Query market/activity data for company token experiences (when aligned with your token design).

    References: Zora **Coins SDK** docs & changelog and monorepo packages.


**Implementation note:** Zora’s SDK currently exposes create/manage/query flows and relies on **viem**; onchain writes require proper client setup and API key configuration. Startupchain should treat this as an **optional Beta integration** to enhance token UX rather than a hard dependency of the MVP.

---

# **4. Non-Functional Requirements**

## **4.1 Performance**

- **Tx confirmation:** Typical flows (register company ENS, set resolver, Safe exec) confirm in **≤ 5 blocks** on OP Mainnet.
- **Indexing latency:** Subgraph data appears in UI within **≤ 10s**.
- **UI responsiveness:** Dashboard interactions **≤ 200 ms** after data availability.

## **4.2 Security**

- **Standards:** OpenZeppelin; follow SWC/ConsenSys best practices.
- **Tests:**
    - Unit tests ≥ **90%** coverage on core (StartupChain, CompanyToken).
    - Integration tests for ENS→Resolver→Dashboard and Safe proposal→execute.
    - Fuzz tests on token math and governance edge cases.
- **Audit:** External audit prior to mainnet feature unlocks.
- **Bug Bounty:** Public, scoped post-audit.

## **4.3 Scalability**

- **Networks:** Sepolia (test), **OP Mainnet (primary)**; architecture compatible with Superchain expansion.
- **Data strategy:** onchain minimal codes + hashes; heavy docs off-chain.

## **4.4 Documentation**

- **Code:** Solidity NatSpec; inline comments at resolver/namehash touch-points.
- **Developers:** Contract specs, sequence diagrams, subgraph schema.
- **Users:** Onboarding (RainbowKit primary), ENS setup, Safe basics, attestations.

## **4.5 Licensing**

- **MIT** across repos unless dependency constraints dictate otherwise.

---

# **5. Assumptions and Constraints**

## **5.1 Assumptions**

- .eth labels are available and affordable for target users.
- Public Resolver and Registrar addresses are stable / configurable per network.
- Safe infra and EAS endpoints are reliable.
- Users can fund network fees (or receive limited subsidies during onboarding trials).

## **5.2 Constraints**

- Contract deployment budget target: **≤ 0.3 ETH** per network.
- No custodial key management.
- No reliance on proprietary services for critical write paths.
- **Tokenization** gated to **Beta** pending risk review and audit.

---

# **6. Development and Governance**

## **6.1 Technology Stack**

- **Smart Contracts:** Solidity, OpenZeppelin; Foundry/Hardhat.
- **Frontend:** Next.js + React, **RainbowKit** + wagmi + viem.
- **Indexing:** The Graph; fallback polling for critical UI.
- **Storage:** IPFS/Arweave.
- **Zora Integrations (Beta):** @zoralabs/coins-sdk + **viem** (API key + server-assisted calldata).
- **Optional Onboarding:** Privy (secondary).

## **6.2 Contribution Model**

- GitHub issues/labels/boards; PR review by maintainers; semantic versioning + CHANGELOG.
- Public roadmap in GitHub Discussions; progressive decentralization to a community governance model.
- Channels: GitHub, Discord, X.

---

## **Appendix A — ENS Implementation Notes (for Devs)**

- **Label vs Namehash:** Ensure you compute **namehash(ensName)** for resolver/addr updates on the fully-qualified name (e.g., myco.eth), not just the label, and route registration via the correct **.eth base registrar**.
- **Resolver Address:** Use the **Public Resolver** (or a configurable resolver) and set both **addr** and any required text records (e.g., org.safe) in future iterations.
- **Subdomains:** Add a future function to **setSubnodeOwner** for member subdomains (setSubnodeOwner(node, label, owner)), consistent with IENS.
- **Reverse Records (Optional):** For UX, set reverse records so addresses resolve to ENS names in wallets.

---

### **How the Zora Coins SDK fits (Beta)**

- **Purpose:** Enrich token UX (discovery, creation flows for content/creator coins, market data queries) and **server-assisted calldata** generation for writes.
- **Limit:** As of current changelog, **creator coins** are created via Zora app; SDK creates **content coins** paired with an existing creator coin. Treat as **optional UX module** until policies stabilize.

****


