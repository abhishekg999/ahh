import { ExternalBinary } from "./external-binary";

export class SystemBinary extends ExternalBinary {
  constructor(private command: string) {
    super();
  }

  async exists(): Promise<boolean> {
    return Bun.which(this.command) !== null;
  }

  async install(): Promise<void> {
    throw new Error(`${this.command} is required but not installed.`);
  }

  async invoke<
    const In extends Bun.SpawnOptions.Writable = "ignore",
    const Out extends Bun.SpawnOptions.Readable = "pipe",
    const Err extends Bun.SpawnOptions.Readable = "inherit",
  >(
    args: string[],
    options?: Bun.SpawnOptions.OptionsObject<In, Out, Err>,
  ): Promise<Bun.Subprocess<In, Out, Err>> {
    return Bun.spawn([this.command, ...args], options);
  }
}
