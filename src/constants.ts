import { PublicKey, SystemProgram } from '@solana/web3.js';

export const GLOBAL = new PublicKey(process.env.GLOBAL_PUBLIC_KEY || "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
export const FEE_RECIPIENT = new PublicKey(process.env.FEE_RECIPIENT_PUBLIC_KEY || "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ASSOC_TOKEN_ACC_PROG = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
export const RENT = new PublicKey("SysvarRent111111111111111111111111111111111");
export const PUMP_FUN_PROGRAM = new PublicKey(process.env.PUMP_FUN_PROGRAM || "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
export const PUMP_FUN_ACCOUNT = new PublicKey(process.env.PUMP_FUN_ACCOUNT || "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
export const SYSTEM_PROGRAM_ID = SystemProgram.programId;

export const FEE_PERCENTAGE = Number(process.env.FEE_PERCENTAGE) || 0.005; // 0.5%
export const FEE_RECIPIENT_ADDRESS = new PublicKey(process.env.FEE_RECIPIENT_ADDRESS || "BVCgKcceK8StA4ognszUWLUMWksU7auvPBmjN7f7RBs");

