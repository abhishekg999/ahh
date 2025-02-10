#!/usr/bin/env bash

install_dir="$HOME/.ahh"
bin_dir="$install_dir/bin"
exe="$bin_dir/ahh"

# Colors
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
RESET="\033[0m"

if ! command -v curl >/dev/null; then
  echo -e "${RED}curl is required${RESET}"
  exit 1
fi

mkdir -p "$bin_dir"

echo -e "${BLUE}Downloading ahh CLI...${RESET}"
curl --fail --location --progress-bar --output "$exe" "https://github.com/abhishekg999/ahh/releases/latest/download/ahh"
if [[ $? -ne 0 ]]; then
  echo -e "${RED}Failed to download the binary${RESET}"
  exit 1
fi

chmod +x "$exe"

add_to_path() {
  local shell_config

  case $(basename "$SHELL") in
    fish)
      shell_config="$HOME/.config/fish/config.fish"
      echo -e "\n" >> "$shell_config"
      echo -e "set -g -x PATH $bin_dir \$PATH" >> "$shell_config"
      ;;
    zsh)
      shell_config="$HOME/.zshrc"
      echo -e "\n" >> "$shell_config"
      echo -e "export PATH=\"$bin_dir:\$PATH\"" >> "$shell_config"
      ;;
    bash)
      shell_config="$HOME/.bashrc"
      echo -e "\n" >> "$shell_config"
      echo -e "export PATH=\"$bin_dir:\$PATH\"" >> "$shell_config"
      ;;
    *)
      echo -e "${YELLOW}Manually add the following to your shell config file:${RESET}"
      echo -e "  export PATH=\"$bin_dir:\$PATH\""
      ;;
  esac
}

add_to_path

echo -e "${GREEN}ahh CLI installed successfully!"

refresh_command=""
case $(basename "$SHELL") in
    fish)
        refresh_command="source $HOME/.config/fish/config.fish"
        ;;
    zsh)
        refresh_command="source $HOME/.zshrc"
        ;;
    bash)
        refresh_command="source $HOME/.bashrc"
        ;;
esac

echo
if [[ -n "$refresh_command" ]]; then
    echo -e "${BLUE}To start using ahh, run:${RESET}"
    echo -e "  $refresh_command"
else
    echo -e "${YELLOW}Manually add the following to your shell config file and restart your shell:${RESET}"
    echo -e "  export PATH=\"$bin_dir:\$PATH\""
fi

echo
echo -e "${BLUE}To get started, run:${RESET}"
echo -e "  ahh --help"
