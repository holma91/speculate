// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "ds-test/test.sol";
import "openzeppelin-contracts/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "openzeppelin-contracts/contracts/token/ERC721/utils/ERC721Holder.sol";
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

contract OptionFactoryTest is DSTest, ERC1155Holder, ERC721Holder {
    address internal alice;
    address internal bob;
    CheatCodes internal cheats;
    OptionFactory internal optionFactory;
    MockV3Aggregator internal btcUsdPriceFeed;
    MockV3Aggregator internal ethUsdPriceFeed;
    OptionFactory.Option internal eth1Call;
    OptionFactory.Option internal btc20Call;
    OptionFactory.Collateral internal collateral_eth1Call;
    OptionFactory.Collateral internal collateral_btc20Call;
    string internal metadata_eth1Call;
    string internal metadata_btc20Call;

    function setUp() public {
        alice = address(0x1337);
        bob = address(0x1338);
        cheats = CheatCodes(HEVM_ADDRESS);
        optionFactory = new OptionFactory();
        btcUsdPriceFeed = new MockV3Aggregator(8, 40_000 * 10**8);
        ethUsdPriceFeed = new MockV3Aggregator(8, 3_000 * 10**8);

        eth1Call = OptionFactory.Option(
            address(ethUsdPriceFeed),
            1 * 10**18,
            true,
            1_000 * 10**8,
            1_000
        );

        // covered call
        collateral_eth1Call = OptionFactory.Collateral(
            address(ethUsdPriceFeed),
            10 * 10**18,
            10
        );

        metadata_eth1Call = "ipfs://bafybeiemm2araludhwycruo6j34szn3gr5jkuqycj47k67mdesgndpirbm/metadata.json";

        btc20Call = OptionFactory.Option(
            address(btcUsdPriceFeed),
            0.1 * 10**18,
            true,
            20_000 * 10**8,
            1_000
        );

        collateral_btc20Call = OptionFactory.Collateral(
            address(ethUsdPriceFeed),
            20 * 10**18, // 20 eth collateral
            10
        );

        metadata_btc20Call = "ipfs://bafybeiemm2araludhwycruo6j34szn3gr5jkuqycj47k67mdesgndpirbm/metadata.json";
    }

    function testCanCreateOption() public {
        uint256 eth1CallId = optionFactory.createOption{value: 10 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );
        OptionFactory.Option memory retrievedOption = optionFactory
            .getOptionById(eth1CallId);

        OptionFactory.Collateral memory retrievedCollateral = optionFactory
            .getCollateralById(eth1CallId);

        assertEq(
            eth1Call.underlyingPriceFeed,
            retrievedOption.underlyingPriceFeed
        );
        assertEq(collateral_eth1Call.priceFeed, retrievedCollateral.priceFeed);
        assertEq(optionFactory.balanceOf(address(this), eth1CallId), 10);
    }

    function testCanCheckIfLiquidateable() public {
        uint256 eth1CallId = optionFactory.createOption{value: 10 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );
        cheats.expectRevert("liquidate: covered call cannot be liquidated");
        optionFactory.canBeLiquidated(eth1CallId);
        // ethUsdPriceFeed.updateAnswer(2500);

        uint256 btc20CallId = optionFactory.createOption{value: 20 ether}(
            btc20Call,
            collateral_btc20Call,
            metadata_btc20Call
        );

        int256 CR = optionFactory.getCollateralToRiskRatio(btc20CallId);
        assertEq(CR, 1500);
        assertTrue(!optionFactory.canBeLiquidated(btc20CallId));

        // eth plummets against btc
        ethUsdPriceFeed.updateAnswer(2100 * 10**8);

        CR = optionFactory.getCollateralToRiskRatio(btc20CallId);
        assertEq(CR, 1050);

        assertTrue(optionFactory.canBeLiquidated(btc20CallId));
    }

    function testCanTransferOption() public {
        uint256 long_btc20CallId = optionFactory.createOption{value: 20 ether}(
            btc20Call,
            collateral_btc20Call,
            metadata_btc20Call
        );
        assertEq(optionFactory.balanceOf(address(this), long_btc20CallId), 10);
        optionFactory.safeTransferFrom(
            address(this),
            alice,
            long_btc20CallId,
            5,
            ""
        );
        assertEq(optionFactory.balanceOf(address(this), long_btc20CallId), 5);
        assertEq(optionFactory.balanceOf(alice, long_btc20CallId), 5);
    }

    function testCanExercise() public {
        uint256 balanceStart = address(this).balance;
        uint256 eth1CallId = optionFactory.createOption{value: 10 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );
        uint256 balanceMid = address(this).balance;
        assertEq(balanceStart, balanceMid + 10 ether);

        assertEq(optionFactory.balanceOf(address(this), eth1CallId), 10);

        // eth rises
        ethUsdPriceFeed.updateAnswer(4000 * 10**8);
        cheats.warp(1000);

        // emit log_uint(address(optionFactory).balance);

        optionFactory.exerciseOption(eth1CallId, 10);

        assertEq(optionFactory.balanceOf(address(this), eth1CallId), 0);

        uint256 balanceEnd = address(this).balance;
        assertEq(balanceStart, balanceEnd);
    }

    function testCanAddCollateral() public {
        uint256 eth1CallId = optionFactory.createOption{value: 10 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        OptionFactory.Collateral memory collateralBefore = optionFactory
            .getCollateralById(eth1CallId);

        optionFactory.addCollateral{value: 1 ether}(eth1CallId);

        OptionFactory.Collateral memory collateralAfter = optionFactory
            .getCollateralById(eth1CallId);

        assertEq(collateralBefore.amount, collateralAfter.amount - 1 ether);
    }

    function testCanWithdrawCollateral() public {
        collateral_eth1Call.amount += 1 ether;

        uint256 eth1CallId = optionFactory.createOption{value: 11 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        OptionFactory.Collateral memory collateralBefore = optionFactory
            .getCollateralById(eth1CallId);

        emit log_uint(collateralBefore.amount);

        optionFactory.withdrawCollateral(eth1CallId, 1 ether);

        OptionFactory.Collateral memory collateralAfter = optionFactory
            .getCollateralById(eth1CallId);

        assertEq(collateralBefore.amount, collateralAfter.amount + 1 ether);
    }

    function testCannotWithdrawToARatioBelow1() public {
        collateral_eth1Call.amount += 1 ether;

        uint256 eth1CallId = optionFactory.createOption{value: 11 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        OptionFactory.Collateral memory collateralBefore = optionFactory
            .getCollateralById(eth1CallId);

        emit log_uint(collateralBefore.amount);

        cheats.expectRevert("cannot go below 1 in collateral-to-risk ratio");
        optionFactory.withdrawCollateral(eth1CallId, 2 ether);

        OptionFactory.Collateral memory collateralAfter = optionFactory
            .getCollateralById(eth1CallId);

        assertEq(collateralBefore.amount, collateralAfter.amount);
    }

    receive() external payable {}
}
