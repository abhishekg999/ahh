import { describe, expect, test } from "bun:test";
import { interactiveShellArgs } from "./shell";

describe("interactiveShellArgs", () => {
  test("skips zsh startup files", () => {
    expect(interactiveShellArgs("/bin/zsh", false)).toEqual(["--no-rcs"]);
  });

  test("skips bash startup files", () => {
    expect(interactiveShellArgs("/bin/bash", false)).toEqual(["--norc"]);
  });

  test("skips fish startup files", () => {
    expect(interactiveShellArgs("/opt/homebrew/bin/fish", false)).toEqual([
      "--no-config",
    ]);
  });

  test("does not add unsupported shell arguments", () => {
    expect(interactiveShellArgs("/bin/ksh", false)).toEqual([]);
  });

  test("loads startup files when requested", () => {
    expect(interactiveShellArgs("/bin/zsh", true)).toEqual([]);
  });
});
