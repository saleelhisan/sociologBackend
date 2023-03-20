import crypto from "crypto";
const message = "This is a secret message";

 // Generate a random initialization vector
 const iv = crypto.randomBytes(16);

 // Generate a key based on a passphrase
 const passphrase = "MySecretPassphrase";
 const key = crypto.scryptSync(passphrase, "salt", 32);







 export function encrypter(message) {
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encryptedMessage = cipher.update(message, "utf8", "hex");
    encryptedMessage += cipher.final("hex");
    return encryptedMessage
}


export function decrypter(message){
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decryptedMessage = decipher.update(message, "hex", "utf8");
    decryptedMessage += decipher.final("utf8");

    return decryptedMessage
}



