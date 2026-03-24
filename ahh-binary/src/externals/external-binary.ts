export abstract class ExternalBinary {
  abstract install(): Promise<void>;
  abstract exists(): Promise<boolean>;
  abstract invoke<
    const In extends Bun.SpawnOptions.Writable = "ignore",
    const Out extends Bun.SpawnOptions.Readable = "pipe",
    const Err extends Bun.SpawnOptions.Readable = "inherit",
  >(
    args: string[],
    options?: Bun.SpawnOptions.OptionsObject<In, Out, Err>,
  ): Promise<Bun.Subprocess<In, Out, Err>>;
}
