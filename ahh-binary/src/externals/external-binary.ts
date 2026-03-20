export abstract class ExternalBinary {
  abstract install(): Promise<void>;
  abstract exists(): Promise<boolean>;
  abstract invoke(args: string[], options?: object): Promise<Bun.Subprocess>;
}
