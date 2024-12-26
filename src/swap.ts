import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, clusterApiUrl, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getKeyPairFromPrivateKey, createTransaction, sendAndConfirmTransactionWrapper, bufferFromUInt64 } from './utils';
import { getCoinData } from './api';
import { TransactionMode } from './types';
import { GLOBAL, FEE_RECIPIENT, SYSTEM_PROGRAM_ID, RENT, PUMP_FUN_ACCOUNT, PUMP_FUN_PROGRAM, ASSOC_TOKEN_ACC_PROG, FEE_PERCENTAGE, FEE_RECIPIENT_ADDRESS } from './constants';

async function checkAccountAndBalance(connection: Connection, publicKey: PublicKey) {
    try {
        const accountInfo = await connection.getAccountInfo(publicKey);
        // Account exists but might have 0 balance
        if (accountInfo) {
            const balance = await connection.getBalance(publicKey);
            if (balance === 0) {
                throw new Error('Account has no SOL balance. Please fund the account before proceeding.');
            }
            return balance;
        }
        
        // Account doesn't exist yet but that's okay - it's just new
        console.log('New account detected. Proceeding with 0 balance check...');
        const balance = await connection.getBalance(publicKey);
        if (balance === 0) {
            throw new Error('Account has no SOL balance. Please fund the account before proceeding.');
        }
        return balance;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to check account balance');
    }
}

export async function pumpFunBuy(transactionMode:any, payerPrivateKey:any, mintStr:any, solIn:any, priorityFeeInSol = 0, slippageDecimal = 0.25) {
    try {
        const connection = new Connection(clusterApiUrl("mainnet-beta"), 'confirmed');

        const coinData = await getCoinData(mintStr);
        if (!coinData) {
            console.error('Unable to get coin data...');
            throw new Error('Coin data not found');
        }

        const payer = await getKeyPairFromPrivateKey(payerPrivateKey);
        const owner = payer.publicKey;
        const mint = new PublicKey(mintStr);
        console.log('Checking account:', owner.toString());

        // Check account and balance
        try {
            const balance = await checkAccountAndBalance(connection, payer.publicKey);
            console.log(`Payer account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Balance check failed: ${error.message}`);
            }
            throw error;
        }
        const txBuilder = new Transaction();

        const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);

        let tokenAccount;
        if (!tokenAccountInfo) {
            txBuilder.add(
                createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccountAddress, payer.publicKey, mint)
            );
            tokenAccount = tokenAccountAddress;
        } else {
            tokenAccount = tokenAccountAddress;
        }

        // Calculate fee
        const feeAmount = Math.floor(solIn * LAMPORTS_PER_SOL * FEE_PERCENTAGE);
        const solInLamports = solIn * LAMPORTS_PER_SOL - feeAmount;

        const tokenOut = Math.floor(solInLamports * coinData["virtual_token_reserves"] / coinData["virtual_sol_reserves"]);
        const solInWithSlippage = solIn * (1 + slippageDecimal);
        const maxSolCost = Math.floor(solInWithSlippage * LAMPORTS_PER_SOL);

        // Add fee transfer instruction
        txBuilder.add(
            SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: FEE_RECIPIENT_ADDRESS,
                lamports: feeAmount,
            })
        );

        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(coinData['bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(coinData['associated_bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: tokenAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false },
        ];

        const data = Buffer.concat([
            bufferFromUInt64("16927863322537952870"),
            bufferFromUInt64(tokenOut),
            bufferFromUInt64(maxSolCost)
        ]);

        const instruction = new TransactionInstruction({
            keys: keys,
            programId: PUMP_FUN_PROGRAM,
            data: data
        });
        txBuilder.add(instruction);

        const transaction = await createTransaction(connection, txBuilder.instructions, payer.publicKey, priorityFeeInSol);

        if (transactionMode == TransactionMode.Execution) {
            const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [payer]);
            console.log('Buy transaction confirmed:', signature);
            return signature;
        } else if (transactionMode == TransactionMode.Simulation) {
            const simulatedResult = await connection.simulateTransaction(transaction);
            console.log(simulatedResult);
            return simulatedResult;
        }
    } catch (error) {
        console.error('Error in pumpFunBuy:', error);
        throw error;
    }
}

export async function pumpFunSell(transactionMode:any, payerPrivateKey:any, mintStr:any, tokenBalance:any, priorityFeeInSol = 0, slippageDecimal = 0.25) {
    try {
        const connection = new Connection(clusterApiUrl("mainnet-beta"), 'confirmed');

        const coinData = await getCoinData(mintStr);
        if (!coinData) {
            console.error('Unable to get coin data...');
            throw new Error('Coin data not found');
        }

        const payer = await getKeyPairFromPrivateKey(payerPrivateKey);
        const owner = payer.publicKey;
        const mint = new PublicKey(mintStr);

        // Check account and balance
        const balance = await checkAccountAndBalance(connection, payer.publicKey);
        console.log(`Payer account balance: ${balance / LAMPORTS_PER_SOL} SOL`);

        const txBuilder = new Transaction();

        const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);

        let tokenAccount;
        if (!tokenAccountInfo) {
            txBuilder.add(
                createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccountAddress, payer.publicKey, mint)
            );
            tokenAccount = tokenAccountAddress;
        } else {
            tokenAccount = tokenAccountAddress;
        }

        const expectedSolOutput = tokenBalance * coinData["virtual_sol_reserves"] / coinData["virtual_token_reserves"];
        const feeAmount = Math.floor(expectedSolOutput * LAMPORTS_PER_SOL * FEE_PERCENTAGE);
        const minSolOutput = Math.floor((expectedSolOutput * LAMPORTS_PER_SOL - feeAmount) * (1 - slippageDecimal));

        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(coinData['bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(coinData['associated_bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: tokenAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOC_TOKEN_ACC_PROG, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT_ADDRESS, isSigner: false, isWritable: true }, // Add fee recipient to keys
        ];

        const data = Buffer.concat([
            bufferFromUInt64("12502976635542562355"),
            bufferFromUInt64(tokenBalance),
            bufferFromUInt64(minSolOutput)
        ]);

        const instruction = new TransactionInstruction({
            keys: keys,
            programId: PUMP_FUN_PROGRAM,
            data: data
        });
        txBuilder.add(instruction);

        // Add fee transfer instruction
        txBuilder.add(
            SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: FEE_RECIPIENT_ADDRESS,
                lamports: feeAmount,
            })
        );

        const transaction = await createTransaction(connection, txBuilder.instructions, payer.publicKey, priorityFeeInSol);

        if (transactionMode == TransactionMode.Execution) {
            const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [payer]);
            console.log('Sell transaction confirmed:', signature);
            return signature;
        } else if (transactionMode == TransactionMode.Simulation) {
            const simulatedResult = await connection.simulateTransaction(transaction);
            console.log(simulatedResult);
            return simulatedResult;
        }
    } catch (error) {
        console.error('Error in pumpFunSell:', error);
        throw error;
    }
}

