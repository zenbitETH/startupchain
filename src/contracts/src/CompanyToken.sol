// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract CompanyToken is IERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Role-based access control
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;
    address public immutable startupChainRegistry;
    uint256 public immutable companyId;

    // Transfer restrictions
    bool public transfersEnabled;
    mapping(address => bool) public transferWhitelist;

    // Vesting support
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 released;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 duration;
        bool revocable;
        bool revoked;
    }

    mapping(address => VestingSchedule) public vestingSchedules;

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event TransfersEnabled();
    event TransfersDisabled();
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);

    modifier onlyRole(bytes32 role) {
        require(_roles[role][msg.sender], "Caller does not have required role");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _companyId,
        address _startupChainRegistry,
        uint256 _initialSupply,
        address _admin
    ) {
        name = _name;
        symbol = _symbol;
        companyId = _companyId;
        startupChainRegistry = _startupChainRegistry;

        _roles[ADMIN_ROLE][_admin] = true;
        _roles[MINTER_ROLE][_admin] = true;
        _roles[BURNER_ROLE][_admin] = true;

        if (_initialSupply > 0) {
            _mint(_admin, _initialSupply);
        }

        transfersEnabled = false;
    }

    // ERC20 Implementation
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }

        return true;
    }

    // Role Management
    function grantRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        require(!_roles[role][account], "Role already granted");
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    function revokeRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        require(_roles[role][account], "Role not granted");
        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    // Minting and Burning
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }

    // Transfer Control
    function enableTransfers() external onlyRole(ADMIN_ROLE) {
        require(!transfersEnabled, "Transfers already enabled");
        transfersEnabled = true;
        emit TransfersEnabled();
    }

    function disableTransfers() external onlyRole(ADMIN_ROLE) {
        require(transfersEnabled, "Transfers already disabled");
        transfersEnabled = false;
        emit TransfersDisabled();
    }

    function addToWhitelist(address account) external onlyRole(ADMIN_ROLE) {
        require(!transferWhitelist[account], "Already whitelisted");
        transferWhitelist[account] = true;
        emit AddressWhitelisted(account);
    }

    function removeFromWhitelist(address account) external onlyRole(ADMIN_ROLE) {
        require(transferWhitelist[account], "Not whitelisted");
        transferWhitelist[account] = false;
        emit AddressRemovedFromWhitelist(account);
    }

    // Vesting Functions
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 duration,
        bool revocable
    ) external onlyRole(ADMIN_ROLE) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(vestingSchedules[beneficiary].totalAmount == 0, "Vesting schedule already exists");

        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            released: 0,
            startTime: startTime,
            cliffDuration: cliffDuration,
            duration: duration,
            revocable: revocable,
            revoked: false
        });

        _mint(address(this), amount);

        emit VestingScheduleCreated(beneficiary, amount, duration);
    }

    function releaseVestedTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Vesting revoked");

        uint256 releasable = _computeReleasableAmount(schedule);
        require(releasable > 0, "No tokens to release");

        schedule.released += releasable;
        _balances[address(this)] -= releasable;
        _balances[msg.sender] += releasable;

        emit Transfer(address(this), msg.sender, releasable);
        emit TokensReleased(msg.sender, releasable);
    }

    function revokeVesting(address beneficiary) external onlyRole(ADMIN_ROLE) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(schedule.revocable, "Vesting not revocable");
        require(!schedule.revoked, "Already revoked");

        uint256 releasable = _computeReleasableAmount(schedule);
        uint256 refund = schedule.totalAmount - schedule.released - releasable;

        schedule.revoked = true;

        if (refund > 0) {
            _balances[address(this)] -= refund;
            _totalSupply -= refund;
        }
    }

    function getVestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        return _computeReleasableAmount(schedule);
    }

    // Internal Functions
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "Transfer from zero address");
        require(recipient != address(0), "Transfer to zero address");
        require(_balances[sender] >= amount, "Transfer amount exceeds balance");

        // Check transfer restrictions
        require(
            transfersEnabled || transferWhitelist[sender] || transferWhitelist[recipient],
            "Transfers are disabled"
        );

        unchecked {
            _balances[sender] -= amount;
            _balances[recipient] += amount;
        }

        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "Mint to zero address");

        _totalSupply += amount;
        unchecked {
            _balances[account] += amount;
        }

        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "Burn from zero address");
        require(_balances[account] >= amount, "Burn amount exceeds balance");

        unchecked {
            _balances[account] -= amount;
            _totalSupply -= amount;
        }

        emit Transfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "Approve from zero address");
        require(spender != address(0), "Approve to zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _computeReleasableAmount(VestingSchedule storage schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount - schedule.released;
        }

        uint256 timeFromStart = block.timestamp - schedule.startTime;
        uint256 vestedAmount = (schedule.totalAmount * timeFromStart) / schedule.duration;

        return vestedAmount - schedule.released;
    }
}
