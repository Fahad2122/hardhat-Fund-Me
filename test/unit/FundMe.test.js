const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { deploymentChains } = require("../../helper-hardhat-config");

!deploymentChains.includes(network.name) ? describe.skip :
describe("FundMe", function () {
    let fundMe;
    let MockV3Aggregator;
    let fundMeAddress;
    let MockV3AggregatorAddress;

    const sendValue = ethers.parseEther('1.1');
    
    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        
        fundMeAddress = (await deployments.get("FundMe")).address;
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress);
        MockV3AggregatorAddress = (await deployments.get("MockV3Aggregator")).address;
        MockV3Aggregator = await ethers.getContractAt("MockV3Aggregator", MockV3AggregatorAddress);
    })

    describe("constructor", function () {
        it("sets the aggregator address correctoly", async () => {
            const response = await fundMe.getPriceFeed();
            assert.equal(response, (await MockV3Aggregator.getAddress()));
        })
    })

    describe("fundme", function () {
        it("Fails, if you don't send enough eth", async () => {
            await expect(fundMe.fund()).to.be.revertedWith("You did not Enough Send");
        })

        it("Updates the amount funded data structure", async () => {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.getAddressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString());
        })

        it("Add funder to array", async () => {
            await fundMe.fund({ value: sendValue});
            const response =  await fundMe.getFunder(0);
            assert.equal(response, deployer);
        })
    })

    describe("withdraw", function () {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue });
        })
        it("withdraws ETH from single funder", async () => {
            const currentFundMeContractBalance = await ethers.provider.getBalance(fundMe.target);
            const currentDeployerBalance = await ethers.provider.getBalance(deployer);
            const currentTotal = currentDeployerBalance+currentFundMeContractBalance;

            const response = await fundMe.withdraw();
            const receipt = await response.wait();

            const { gasUsed, gasPrice } = receipt;
            const gasCost = BigInt(gasUsed) * BigInt(gasPrice);

            const updatedFundMeContractBalance = await ethers.provider.getBalance(fundMe.target);
            const updatedDeployerBalance = await ethers.provider.getBalance(deployer);
            const updatedTotal = updatedDeployerBalance+gasCost;

            assert.equal(updatedFundMeContractBalance, 0);
            assert.equal(currentTotal.toString(), updatedTotal.toString());
            
        })

        it("witdraw ETH from multiple funders", async () => {
            const accounts = await ethers.getSigners();
            for(let i=0; i<6; i++){
                const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                await fundMeConnectedContract.fund({ value: sendValue });
            }

            const currentFundMeContractBalance = await ethers.provider.getBalance(fundMe.target);
            const currentDeployerBalance = await ethers.provider.getBalance(deployer);
            const currentTotal = currentDeployerBalance + currentFundMeContractBalance;

            const response = await fundMe.withdraw();
            const receipt = await response.wait();
            const { gasUsed, gasPrice } = receipt;
            const gasCost = BigInt(gasUsed) * BigInt(gasPrice);

            const updatedFundMeContractBalance =  await ethers.provider.getBalance(fundMe.target);
            const updatedDeployerBalance = await ethers.provider.getBalance(deployer);
            const updatedTotal = updatedDeployerBalance + gasCost;

            assert.equal(updatedFundMeContractBalance, 0);
            assert.equal(currentTotal.toString(), updatedTotal.toString());

            await expect(fundMe.getFunder(0)).to.be.reverted;

            for(let i=0; i<6; i++){
                assert.equal(await fundMe.getAmountFunded(accounts[i]), 0);
            }
        })

        it("Only owner can withdraw", async () => {
            const accounts = await ethers.getSigners();
            const fundMeConnectedContract = await fundMe.connect(accounts[1]);
            await expect(fundMeConnectedContract.withdraw()).to.be.revertedWithCustomError(fundMe, "NotOwner");
        })
    })
})