import { pumpFunBuy, pumpFunSell } from './swap';
import { getCoinData, analyzeCoinData } from './api';
import { TransactionMode } from './types';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getKeyPairFromPrivateKey } from './utils';
import dotenv from 'dotenv';

dotenv.config();

async function checkAccountBalance(privateKey: string) {
    const connection = new Connection(clusterApiUrl("mainnet-beta"), 'confirmed');
    const keyPair = await getKeyPairFromPrivateKey(privateKey);
    const balance = await connection.getBalance(keyPair.publicKey);
    console.log(`Account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    return balance;
}

async function runTests() {
    console.log("Starting tests...");

    const validMintAddress = "7Apx6xJjgDtUHfoEshWm7v8hZ2A8cc8iz3XEfnMbpump"; // AngryMoji token

    // Test getCoinData
    try {
        console.log("Testing getCoinData...");
        const coinData = await getCoinData(validMintAddress);
        console.log("getCoinData result:", coinData);
    } catch (error) {
        console.error("Error in getCoinData:", error);
    }

    // Test analyzeCoinData
    try {
        console.log("Testing analyzeCoinData...");
        const analysis = await analyzeCoinData(validMintAddress);
        console.log("analyzeCoinData result:", analysis);
    } catch (error) {
        console.error("Error in analyzeCoinData:", error);
    }

    // Check account balance
    const privateKey = process.env.TEST_PRIVATE_KEY;
    if (!privateKey) {
        console.error("TEST_PRIVATE_KEY not set in environment variables");
        return;
    }

    const balance = await checkAccountBalance(privateKey);

    if (balance === 0) {
        console.log("Account has no SOL balance. Skipping buy and sell tests.");
        return;
    }

    // Test pumpFunBuy
    try {
        console.log("Testing pumpFunBuy...");
        const solIn = 0.1; // Amount of SOL to use for buying
        const result = await pumpFunBuy(TransactionMode.Simulation, privateKey, validMintAddress, solIn);
        console.log("pumpFunBuy result:", result);
    } catch (error) {
        console.error("Error in pumpFunBuy:", error);
    }

    // Test pumpFunSell
    try {
        console.log("Testing pumpFunSell...");
        const tokenBalance = 100; // Amount of tokens to sell
        const result = await pumpFunSell(TransactionMode.Simulation, privateKey, validMintAddress, tokenBalance);
        console.log("pumpFunSell result:", result);
    } catch (error) {
        console.error("Error in pumpFunSell:", error);
    }

    console.log("Tests completed.");
}

runTests();
