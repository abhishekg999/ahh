const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function startSpinner(text: string): () => void {
    let i = 0;
    const spinner = setInterval(() => {
        process.stdout.write(`\r${frames[i]} ${text}`);
        i = (i + 1) % frames.length;
    }, 80);

    return () => {
        clearInterval(spinner);
        process.stdout.write('\r\x1b[K'); 
    };
}
