import { generateQrcode } from "../utils/text";

export async function writeQRCode(text: string) {
    await generateQrcode(text);
}