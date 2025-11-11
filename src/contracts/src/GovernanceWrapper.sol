// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IGnosisSafe {
    function getOwners() external view returns (address[] memory);
    function getThreshold() external view returns (uint256);
    function isOwner(address owner) external view returns (bool);
    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures
    ) external payable returns (bool success);
}

contract GovernanceWrapper {
    struct Proposal {
        uint256 id;
        uint256 companyId;
        address proposer;
        string description;
        address target;
        uint256 value;
        bytes data;
        uint256 createdAt;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 executionTime;
        bool executed;
        bool cancelled;
        ProposalState state;
    }

    enum ProposalState {
        Pending,
        Active,
        Passed,
        Failed,
        Executed,
        Cancelled
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    uint256 private nextProposalId = 1;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant EXECUTION_DELAY = 1 days;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => VoteType)) public votes;
    mapping(uint256 => uint256[]) public companyProposals;

    address public immutable startupChainRegistry;
    mapping(uint256 => address) public companySafes;

    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed companyId,
        address indexed proposer,
        string description,
        address target,
        uint256 value
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType,
        uint256 weight
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        uint256 indexed companyId
    );

    event ProposalCancelled(
        uint256 indexed proposalId,
        uint256 indexed companyId
    );

    modifier onlySafeMember(uint256 _companyId) {
        address safeAddress = companySafes[_companyId];
        require(safeAddress != address(0), "Safe not configured");
        require(IGnosisSafe(safeAddress).isOwner(msg.sender), "Not a Safe member");
        _;
    }

    constructor(address _startupChainRegistry) {
        startupChainRegistry = _startupChainRegistry;
    }

    function initializeCompanySafe(uint256 _companyId, address _safeAddress) external {
        require(_safeAddress != address(0), "Invalid Safe address");
        require(companySafes[_companyId] == address(0), "Safe already initialized");

        companySafes[_companyId] = _safeAddress;
    }

    function createProposal(
        uint256 _companyId,
        string memory _description,
        address _target,
        uint256 _value,
        bytes memory _data
    ) external onlySafeMember(_companyId) returns (uint256) {
        require(bytes(_description).length > 0, "Description required");
        require(_target != address(0), "Invalid target address");

        uint256 proposalId = nextProposalId++;

        proposals[proposalId] = Proposal({
            id: proposalId,
            companyId: _companyId,
            proposer: msg.sender,
            description: _description,
            target: _target,
            value: _value,
            data: _data,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            executionTime: 0,
            executed: false,
            cancelled: false,
            state: ProposalState.Active
        });

        companyProposals[_companyId].push(proposalId);

        emit ProposalCreated(
            proposalId,
            _companyId,
            msg.sender,
            _description,
            _target,
            _value
        );

        return proposalId;
    }

    function castVote(uint256 _proposalId, VoteType _voteType) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.state == ProposalState.Active, "Proposal not active");
        require(!proposal.cancelled, "Proposal cancelled");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        address safeAddress = companySafes[proposal.companyId];
        require(IGnosisSafe(safeAddress).isOwner(msg.sender), "Not a Safe member");

        require(block.timestamp < proposal.createdAt + VOTING_PERIOD, "Voting period ended");

        hasVoted[_proposalId][msg.sender] = true;
        votes[_proposalId][msg.sender] = _voteType;

        // 1 member = 1 vote (MVP requirement)
        uint256 weight = 1;

        if (_voteType == VoteType.For) {
            proposal.votesFor += weight;
        } else if (_voteType == VoteType.Against) {
            proposal.votesAgainst += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _voteType, weight);

        // Update proposal state if voting period has ended
        if (block.timestamp >= proposal.createdAt + VOTING_PERIOD) {
            _updateProposalState(_proposalId);
        }
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal cancelled");

        // Update state if needed
        _updateProposalState(_proposalId);

        require(proposal.state == ProposalState.Passed, "Proposal not passed");
        require(
            block.timestamp >= proposal.executionTime,
            "Execution delay not met"
        );

        address safeAddress = companySafes[proposal.companyId];
        require(IGnosisSafe(safeAddress).isOwner(msg.sender), "Not a Safe member");

        proposal.executed = true;
        proposal.state = ProposalState.Executed;

        // Execute the transaction through the Safe
        // Note: In production, this would need proper signature collection
        // For MVP, we'll emit event for manual execution
        emit ProposalExecuted(_proposalId, proposal.companyId);
    }

    function cancelProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal already cancelled");
        require(proposal.proposer == msg.sender, "Only proposer can cancel");

        proposal.cancelled = true;
        proposal.state = ProposalState.Cancelled;

        emit ProposalCancelled(_proposalId, proposal.companyId);
    }

    function _updateProposalState(uint256 _proposalId) internal {
        Proposal storage proposal = proposals[_proposalId];

        if (block.timestamp < proposal.createdAt + VOTING_PERIOD) {
            return; // Still in voting period
        }

        address safeAddress = companySafes[proposal.companyId];
        uint256 totalMembers = IGnosisSafe(safeAddress).getOwners().length;

        // Simple majority for MVP (>50% of votes)
        if (proposal.votesFor > proposal.votesAgainst && proposal.votesFor > totalMembers / 2) {
            proposal.state = ProposalState.Passed;
            proposal.executionTime = block.timestamp + EXECUTION_DELAY;
        } else {
            proposal.state = ProposalState.Failed;
        }
    }

    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        uint256 companyId,
        address proposer,
        string memory description,
        address target,
        uint256 value,
        uint256 createdAt,
        uint256 votesFor,
        uint256 votesAgainst,
        ProposalState state,
        bool executed,
        bool cancelled
    ) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");

        return (
            proposal.id,
            proposal.companyId,
            proposal.proposer,
            proposal.description,
            proposal.target,
            proposal.value,
            proposal.createdAt,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.state,
            proposal.executed,
            proposal.cancelled
        );
    }

    function getProposalState(uint256 _proposalId) external view returns (ProposalState) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");

        if (proposal.cancelled) return ProposalState.Cancelled;
        if (proposal.executed) return ProposalState.Executed;

        // Check if voting period has ended
        if (block.timestamp < proposal.createdAt + VOTING_PERIOD) {
            return ProposalState.Active;
        }

        // Calculate if passed
        address safeAddress = companySafes[proposal.companyId];
        uint256 totalMembers = IGnosisSafe(safeAddress).getOwners().length;

        if (proposal.votesFor > proposal.votesAgainst && proposal.votesFor > totalMembers / 2) {
            return ProposalState.Passed;
        }

        return ProposalState.Failed;
    }

    function getCompanyProposals(uint256 _companyId) external view returns (uint256[] memory) {
        return companyProposals[_companyId];
    }

    function hasVotedOnProposal(uint256 _proposalId, address _voter) external view returns (bool) {
        return hasVoted[_proposalId][_voter];
    }

    function getVote(uint256 _proposalId, address _voter) external view returns (VoteType) {
        require(hasVoted[_proposalId][_voter], "Voter has not voted");
        return votes[_proposalId][_voter];
    }
}
