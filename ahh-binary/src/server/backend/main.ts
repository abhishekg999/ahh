import { Elysia } from 'elysia'


export function createServer(port: number) {
    const server = new Elysia()
        .get('/', 'hello world')
        .listen(port)

    const url = `http://localhost:${port}`;
    const kill = () => {
        if (!server) {
            console.warn('Server is not running. Stop has no effect. Continuing...');
            return;
        }
        server.stop();
    }
    return { server, url, port, kill };
}

