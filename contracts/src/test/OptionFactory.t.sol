// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "ds-test/test.sol";
import "openzeppelin-contracts/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "../OptionFactory.sol";
import "./mocks/MockV3Aggregator.sol";

interface CheatCodes {
    function prank(address) external;

    function expectRevert(bytes memory) external;

    function assume(bool) external;

    function warp(uint256) external;

    function startPrank(address, address) external;

    function stopPrank() external;

    function expectEmit(
        bool,
        bool,
        bool,
        bool
    ) external;
}

address constant BTC_USD_FUJI = 0x31CF013A08c6Ac228C94551d535d5BAfE19c602a;
address constant ETH_USD_FUJI = 0x86d67c3D38D2bCeE722E601025C25a575021c6EA;
address constant AVAX_USD_FUJI = 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD;

contract OptionFactoryTest is DSTest, ERC1155Holder {
    address internal alice;
    address internal bob;
    CheatCodes internal cheats;
    OptionFactory internal optionFactory;
    MockV3Aggregator internal btcUsdPriceFeed;
    MockV3Aggregator internal ethUsdPriceFeed;
    OptionFactory.Option internal short_eth4Call;
    OptionFactory.Option internal long_eth4Call;
    OptionFactory.Option internal short_btc50Call;
    OptionFactory.Option internal long_btc50Call;
    OptionFactory.Collateral internal collateral_eth4Call;
    OptionFactory.Collateral internal collateral_btc50Call;

    function setUp() public {
        alice = address(0x1337);
        bob = address(0x1338);
        cheats = CheatCodes(HEVM_ADDRESS);
        optionFactory = new OptionFactory();
        btcUsdPriceFeed = new MockV3Aggregator(8, 40_000 * 10**8);
        ethUsdPriceFeed = new MockV3Aggregator(8, 3_000 * 10**8);

        short_eth4Call = OptionFactory.Option(
            address(ethUsdPriceFeed),
            1 * 10**18,
            true,
            false,
            4_000 * 10**8,
            1_000
        );

        long_eth4Call = OptionFactory.Option(
            address(ethUsdPriceFeed),
            1 * 10**18,
            true,
            true,
            4_000 * 10**8,
            1_000
        );

        // covered call
        collateral_eth4Call = OptionFactory.Collateral(
            address(ethUsdPriceFeed),
            10 * 10**18,
            10
        );

        short_btc50Call = OptionFactory.Option(
            address(btcUsdPriceFeed),
            0.1 * 10**18,
            true,
            false,
            50_000 * 10**8,
            1_000
        );

        long_btc50Call = OptionFactory.Option(
            address(btcUsdPriceFeed),
            0.1 * 10**18,
            true,
            true,
            50_000 * 10**8,
            1_000
        );

        collateral_btc50Call = OptionFactory.Collateral(
            address(ethUsdPriceFeed),
            20 * 10**18, // 20 eth collateral
            10
        );
    }

    function testCanCreateOption() public {
        uint256 long_eth4CallId = optionFactory.createOption{value: 10 ether}(
            short_eth4Call,
            long_eth4Call,
            collateral_eth4Call
        );
        OptionFactory.Option memory retrievedLong = optionFactory.getOptionById(
            long_eth4CallId
        );
        OptionFactory.Option memory retrievedShort = optionFactory
            .getOptionById(long_eth4CallId - 1);
        OptionFactory.Collateral memory retrievedCollateral = optionFactory
            .getCollateralById(long_eth4CallId - 1);

        assertEq(
            long_eth4Call.underlyingPriceFeed,
            retrievedLong.underlyingPriceFeed
        );
        assertEq(
            short_eth4Call.underlyingPriceFeed,
            retrievedShort.underlyingPriceFeed
        );
        assertEq(collateral_eth4Call.priceFeed, retrievedCollateral.priceFeed);
        assertEq(optionFactory.balanceOf(address(this), long_eth4CallId), 10);
        assertEq(
            optionFactory.balanceOf(address(this), long_eth4CallId - 1),
            1
        );
    }

    function testCanCheckIfLiquidateable() public {
        uint256 long_eth4CallId = optionFactory.createOption{value: 10 ether}(
            short_eth4Call,
            long_eth4Call,
            collateral_eth4Call
        );
        cheats.expectRevert("liquidate: covered call cannot be liquidated");
        optionFactory.canBeLiquidated(long_eth4CallId - 1);
        // ethUsdPriceFeed.updateAnswer(2500);

        uint256 long_btc50CallId = optionFactory.createOption{value: 20 ether}(
            short_btc50Call,
            long_btc50Call,
            collateral_btc50Call
        );

        int256 CR = optionFactory.getCollateralToRiskRatio(
            long_btc50CallId - 1
        );
        assertEq(CR, 1500);
        assertTrue(!optionFactory.canBeLiquidated(long_btc50CallId - 1));

        // eth plummets against btc
        ethUsdPriceFeed.updateAnswer(2100 * 10**8);

        CR = optionFactory.getCollateralToRiskRatio(long_btc50CallId - 1);
        assertEq(CR, 1050);

        assertTrue(optionFactory.canBeLiquidated(long_btc50CallId - 1));
    }

    // 0.1 * 10 = 1btc in risk = $40_000
    // 10 = 20eth in collateral = $60_000
    // hf = 60_0000/40_000 = 1.5

    function testCanTransferOption() public {
        uint256 long_btc50CallId = optionFactory.createOption{value: 20 ether}(
            short_btc50Call,
            long_btc50Call,
            collateral_btc50Call
        );
        assertEq(optionFactory.balanceOf(address(this), long_btc50CallId), 10);
        optionFactory.safeTransferFrom(
            address(this),
            alice,
            long_btc50CallId,
            5,
            ""
        );
        assertEq(optionFactory.balanceOf(address(this), long_btc50CallId), 5);
        assertEq(optionFactory.balanceOf(alice, long_btc50CallId), 5);
    }

    function testCanExercise() public {
        uint256 balanceStart = address(this).balance;
        uint256 long_eth4CallId = optionFactory.createOption{value: 10 ether}(
            short_eth4Call,
            long_eth4Call,
            collateral_eth4Call
        );
        uint256 balanceMid = address(this).balance;
        assertEq(balanceStart, balanceMid + 10 ether);

        assertEq(optionFactory.balanceOf(address(this), long_eth4CallId), 10);
        assertEq(
            optionFactory.balanceOf(address(this), long_eth4CallId - 1),
            1
        );

        // eth rises
        ethUsdPriceFeed.updateAnswer(4000 * 10**8);
        cheats.warp(1000);

        // emit log_uint(address(optionFactory).balance);

        optionFactory.exerciseOption(long_eth4CallId, 10);

        assertEq(optionFactory.balanceOf(address(this), long_eth4CallId), 0);

        uint256 balanceEnd = address(this).balance;
        assertEq(balanceStart, balanceEnd);
    }

    receive() external payable {}
}

// creator gets 1 erc1155 that represents the sell side
// creator gets 10 erc1155 that represent the buy side
