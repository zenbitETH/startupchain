// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title StartupBondingCurve
 * @notice Implements a quadratic bonding curve for startup share trading
 * @dev Uses the formula: price = basePrice + (supply^2 * curveSlope / 1e18)
 */
contract StartupBondingCurve is Ownable, ReentrancyGuard {
    
    // Curve parameters
    uint256 public constant CURVE_SLOPE = 1e15; // Adjustable slope for price curve
    uint256 public constant BASE_PRICE = 1e14; // Starting price in wei
    uint256 public constant MAX_SUPPLY = 1000000; // Maximum shares available
    
    // Trading fee (0.3% = 30 basis points)
    uint256 public constant TRADING_FEE = 30;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Startup details
    struct Startup {
        address sharesToken;
        uint256 totalSupply;
        uint256 reserveBalance;
        uint256 tradingVolume;
        bool isActive;
        string companyName;
        address treasury;
    }
    
    // Mapping from startup ID to startup details
    mapping(uint256 => Startup) public startups;
    mapping(address => uint256) public tokenToStartupId;
    uint256 public nextStartupId = 1;
    
    // Events
    event StartupCreated(
        uint256 indexed startupId,
        address indexed sharesToken,
        string companyName,
        address treasury
    );
    
    event SharesPurchased(
        uint256 indexed startupId,
        address indexed buyer,
        uint256 sharesAmount,
        uint256 ethAmount,
        uint256 newPrice
    );
    
    event SharesSold(
        uint256 indexed startupId,
        address indexed seller,
        uint256 sharesAmount,
        uint256 ethAmount,
        uint256 newPrice
    );
    
    event TradingFeeCollected(
        uint256 indexed startupId,
        uint256 feeAmount
    );
    
    /**
     * @notice Creates a new startup with a bonding curve
     * @param _sharesToken Address of the ERC20 shares token
     * @param _companyName Name of the startup
     * @param _treasury Treasury address for collected fees
     */
    function createStartup(
        address _sharesToken,
        string memory _companyName,
        address _treasury
    ) external returns (uint256 startupId) {
        require(_sharesToken != address(0), "Invalid token address");
        require(_treasury != address(0), "Invalid treasury address");
        require(tokenToStartupId[_sharesToken] == 0, "Token already registered");
        
        startupId = nextStartupId++;
        
        startups[startupId] = Startup({
            sharesToken: _sharesToken,
            totalSupply: 0,
            reserveBalance: 0,
            tradingVolume: 0,
            isActive: true,
            companyName: _companyName,
            treasury: _treasury
        });
        
        tokenToStartupId[_sharesToken] = startupId;
        
        emit StartupCreated(startupId, _sharesToken, _companyName, _treasury);
    }
    
    /**
     * @notice Calculate the price for a given supply using quadratic bonding curve
     * @param supply Current supply of shares
     * @return Current price per share in wei
     */
    function calculatePrice(uint256 supply) public pure returns (uint256) {
        // Quadratic curve: price = basePrice + (supply^2 * slope / 1e18)
        uint256 quadraticTerm = (supply * supply * CURVE_SLOPE) / 1e18;
        return BASE_PRICE + quadraticTerm;
    }
    
    /**
     * @notice Calculate the cost to buy a specific amount of shares
     * @param currentSupply Current supply before purchase
     * @param shareAmount Amount of shares to buy
     * @return Total cost in wei including fees
     */
    function calculatePurchaseCost(
        uint256 currentSupply,
        uint256 shareAmount
    ) public pure returns (uint256 cost, uint256 fee) {
        uint256 sum = 0;
        
        // Integrate the price curve from currentSupply to currentSupply + shareAmount
        for (uint256 i = 0; i < shareAmount; i++) {
            sum += calculatePrice(currentSupply + i);
        }
        
        fee = (sum * TRADING_FEE) / FEE_DENOMINATOR;
        cost = sum + fee;
    }
    
    /**
     * @notice Calculate the return for selling a specific amount of shares
     * @param currentSupply Current supply before sale
     * @param shareAmount Amount of shares to sell
     * @return Total return in wei after fees
     */
    function calculateSaleReturn(
        uint256 currentSupply,
        uint256 shareAmount
    ) public pure returns (uint256 returnAmount, uint256 fee) {
        require(currentSupply >= shareAmount, "Insufficient supply");
        
        uint256 sum = 0;
        
        // Integrate the price curve from currentSupply down to currentSupply - shareAmount
        for (uint256 i = 0; i < shareAmount; i++) {
            sum += calculatePrice(currentSupply - i - 1);
        }
        
        fee = (sum * TRADING_FEE) / FEE_DENOMINATOR;
        returnAmount = sum - fee;
    }
    
    /**
     * @notice Buy shares of a startup using ETH
     * @param startupId ID of the startup
     * @param minShares Minimum shares expected (slippage protection)
     */
    function buyShares(
        uint256 startupId,
        uint256 minShares
    ) external payable nonReentrant {
        Startup storage startup = startups[startupId];
        require(startup.isActive, "Startup not active");
        require(msg.value > 0, "Must send ETH");
        
        uint256 currentSupply = startup.totalSupply;
        
        // Calculate how many shares can be bought with sent ETH
        uint256 shareAmount = 0;
        uint256 totalCost = 0;
        uint256 totalFee = 0;
        
        // Binary search or iterative approach to find max shares buyable
        for (uint256 i = 1; i <= MAX_SUPPLY - currentSupply; i++) {
            (uint256 cost, uint256 fee) = calculatePurchaseCost(currentSupply, i);
            if (cost > msg.value) {
                shareAmount = i - 1;
                (totalCost, totalFee) = calculatePurchaseCost(currentSupply, shareAmount);
                break;
            }
            if (i == MAX_SUPPLY - currentSupply) {
                shareAmount = i;
                totalCost = cost;
                totalFee = fee;
            }
        }
        
        require(shareAmount > 0, "Insufficient ETH for minimum purchase");
        require(shareAmount >= minShares, "Slippage: shares below minimum");
        
        // Update state
        startup.totalSupply += shareAmount;
        startup.reserveBalance += (totalCost - totalFee);
        startup.tradingVolume += totalCost;
        
        // Transfer fees to treasury
        if (totalFee > 0) {
            payable(startup.treasury).transfer(totalFee);
            emit TradingFeeCollected(startupId, totalFee);
        }
        
        // Mint shares to buyer (assuming shares token has mint function)
        // In practice, this would interface with the StartUpSharesContract
        // For now, we'll emit an event
        
        uint256 newPrice = calculatePrice(startup.totalSupply);
        emit SharesPurchased(startupId, msg.sender, shareAmount, totalCost, newPrice);
        
        // Refund excess ETH
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }
    
    /**
     * @notice Sell shares of a startup for ETH
     * @param startupId ID of the startup
     * @param shareAmount Amount of shares to sell
     * @param minEth Minimum ETH expected (slippage protection)
     */
    function sellShares(
        uint256 startupId,
        uint256 shareAmount,
        uint256 minEth
    ) external nonReentrant {
        Startup storage startup = startups[startupId];
        require(startup.isActive, "Startup not active");
        require(shareAmount > 0, "Must sell positive amount");
        require(startup.totalSupply >= shareAmount, "Insufficient liquidity");
        
        (uint256 returnAmount, uint256 fee) = calculateSaleReturn(
            startup.totalSupply,
            shareAmount
        );
        
        require(returnAmount >= minEth, "Slippage: return below minimum");
        require(startup.reserveBalance >= returnAmount + fee, "Insufficient reserves");
        
        // Update state
        startup.totalSupply -= shareAmount;
        startup.reserveBalance -= (returnAmount + fee);
        startup.tradingVolume += (returnAmount + fee);
        
        // Transfer fees to treasury
        if (fee > 0) {
            payable(startup.treasury).transfer(fee);
            emit TradingFeeCollected(startupId, fee);
        }
        
        // Burn shares from seller (assuming shares token has burn function)
        // In practice, this would interface with the StartUpSharesContract
        
        // Send ETH to seller
        payable(msg.sender).transfer(returnAmount);
        
        uint256 newPrice = calculatePrice(startup.totalSupply);
        emit SharesSold(startupId, msg.sender, shareAmount, returnAmount, newPrice);
    }
    
    /**
     * @notice Get current price for a startup's shares
     * @param startupId ID of the startup
     * @return Current price per share in wei
     */
    function getCurrentPrice(uint256 startupId) external view returns (uint256) {
        return calculatePrice(startups[startupId].totalSupply);
    }
    
    /**
     * @notice Get market cap for a startup
     * @param startupId ID of the startup
     * @return Market cap in wei
     */
    function getMarketCap(uint256 startupId) external view returns (uint256) {
        Startup memory startup = startups[startupId];
        return calculatePrice(startup.totalSupply) * startup.totalSupply;
    }
    
    /**
     * @notice Pause trading for a startup (owner only)
     * @param startupId ID of the startup
     */
    function pauseTrading(uint256 startupId) external onlyOwner {
        startups[startupId].isActive = false;
    }
    
    /**
     * @notice Resume trading for a startup (owner only)
     * @param startupId ID of the startup
     */
    function resumeTrading(uint256 startupId) external onlyOwner {
        startups[startupId].isActive = true;
    }
    
    /**
     * @notice Emergency withdrawal (owner only)
     * @param startupId ID of the startup
     */
    function emergencyWithdraw(uint256 startupId) external onlyOwner {
        Startup storage startup = startups[startupId];
        uint256 balance = startup.reserveBalance;
        startup.reserveBalance = 0;
        payable(owner()).transfer(balance);
    }
}