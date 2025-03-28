import optionService from "../options.js";
import myScryptService from "./my_scrypt.js";
import { randomSecureToken, toBase64 } from "../utils.js";
import dataEncryptionService from "./data_encryption.js";
import type { OptionNames } from "../options_interface.js";

const TOTP_OPTIONS: Record<string, OptionNames> = {
    SALT: "totpEncryptionSalt",
    ENCRYPTED_SECRET: "totpEncryptedSecret",
    VERIFICATION_HASH: "totpVerificationHash"
} as const;

function verifyTotpSecret(secret: string): boolean {
    const givenSecretHash = toBase64(myScryptService.getVerificationHash(secret));
    const dbSecretHash = optionService.getOptionOrNull(TOTP_OPTIONS.VERIFICATION_HASH);

    if (!dbSecretHash) {
        return false;
    }

    return givenSecretHash === dbSecretHash;
}

function setTotpSecret(secret: string): void {
    if (!secret) {
        throw new Error("TOTP secret cannot be empty");
    }

    // 生成新的加密盐值
    const encryptionSalt = randomSecureToken(32);
    optionService.setOption(TOTP_OPTIONS.SALT, encryptionSalt);

    // 使用 scrypt 生成验证哈希
    const verificationHash = toBase64(myScryptService.getVerificationHash(secret));
    optionService.setOption(TOTP_OPTIONS.VERIFICATION_HASH, verificationHash);

    // 使用数据加密密钥加密 TOTP secret
    const encryptedSecret = dataEncryptionService.encrypt(
        Buffer.from(encryptionSalt),
        secret
    );
    optionService.setOption(TOTP_OPTIONS.ENCRYPTED_SECRET, encryptedSecret);
}

function getTotpSecret(): string | null {
    const encryptionSalt = optionService.getOptionOrNull(TOTP_OPTIONS.SALT);
    const encryptedSecret = optionService.getOptionOrNull(TOTP_OPTIONS.ENCRYPTED_SECRET);

    if (!encryptionSalt || !encryptedSecret) {
        return null;
    }

    try {
        const decryptedSecret = dataEncryptionService.decrypt(
            Buffer.from(encryptionSalt),
            encryptedSecret
        );

        if (!decryptedSecret) {
            return null;
        }

        return decryptedSecret.toString();
    } catch (e) {
        console.error("Failed to decrypt TOTP secret:", e);
        return null;
    }
}

function resetTotpSecret(): void {
    optionService.setOption(TOTP_OPTIONS.SALT, "");
    optionService.setOption(TOTP_OPTIONS.ENCRYPTED_SECRET, "");
    optionService.setOption(TOTP_OPTIONS.VERIFICATION_HASH, "");
}

function isTotpSecretSet(): boolean {
    return !!optionService.getOptionOrNull(TOTP_OPTIONS.VERIFICATION_HASH);
}

export default {
    verifyTotpSecret,
    setTotpSecret,
    getTotpSecret,
    resetTotpSecret,
    isTotpSecretSet
};
