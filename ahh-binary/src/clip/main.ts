import ncp from "copy-paste";

export async function copyToClipboard(input: string) {
    ncp.copy(input);
    console.log("Copied to clipboard.");
}