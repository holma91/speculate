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
    OptionFactory.Collateral internal collateral_eth4Call;

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
    }

    function testCanCreateOption() public {
        uint256 long_eth4CallId = optionFactory.createOption(
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
        uint256 long_eth4CallId = optionFactory.createOption(
            short_eth4Call,
            long_eth4Call,
            collateral_eth4Call
        );
        assertTrue(optionFactory.canBeLiquidated(long_eth4CallId - 1));
    }

    // function testCanTransferOption() public {
    //     uint256 btc50CallId = optionFactory.createOption(
    //         btc50Call,
    //         10,
    //         address(btcUsdPriceFeed)
    //     );
    //     assertEq(optionFactory.balanceOf(address(this), btc50CallId), 10);
    //     optionFactory.safeTransferFrom(
    //         address(this),
    //         alice,
    //         btc50CallId,
    //         5,
    //         ""
    //     );
    //     assertEq(optionFactory.balanceOf(address(this), btc50CallId), 5);
    //     assertEq(optionFactory.balanceOf(alice, btc50CallId), 5);
    // }
}
