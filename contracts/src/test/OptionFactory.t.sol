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
    OptionFactory.Option internal btc50Call;
    OptionFactory.Option internal eth4Call;

    function setUp() public {
        alice = address(0x1337);
        bob = address(0x1338);
        cheats = CheatCodes(HEVM_ADDRESS);
        optionFactory = new OptionFactory();
        btcUsdPriceFeed = new MockV3Aggregator(8, 40_000 * 10**8);
        ethUsdPriceFeed = new MockV3Aggregator(8, 3_000 * 10**8);

        btc50Call = OptionFactory.Option(
            address(btcUsdPriceFeed),
            0.5 * 10**18,
            true,
            50_000 * 10**8,
            1_000, // expiry
            10 // premium in the native currency
        );

        eth4Call = OptionFactory.Option(
            address(ethUsdPriceFeed),
            1 * 10**18,
            true,
            4_000 * 10**8,
            1_000, // expiry
            10 // premium in the native currency
        );
    }

    function testCanCreateOption() public {
        uint256 btc50CallId = optionFactory.createOption(
            btc50Call,
            10,
            address(btcUsdPriceFeed)
        );
        OptionFactory.Option memory retrievedOption = optionFactory
            .getOptionById(btc50CallId);

        assertEq(btc50Call.underlyingAsset, retrievedOption.underlyingAsset);
        assertEq(optionFactory.balanceOf(address(this), btc50CallId), 10);
    }

    function testCanTransferOption() public {
        uint256 btc50CallId = optionFactory.createOption(
            btc50Call,
            10,
            address(btcUsdPriceFeed)
        );
        assertEq(optionFactory.balanceOf(address(this), btc50CallId), 10);
        optionFactory.safeTransferFrom(
            address(this),
            alice,
            btc50CallId,
            5,
            ""
        );
        assertEq(optionFactory.balanceOf(address(this), btc50CallId), 5);
        assertEq(optionFactory.balanceOf(alice, btc50CallId), 5);
    }
}
