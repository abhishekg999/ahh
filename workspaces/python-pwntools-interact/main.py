#!/usr/bin/env python3
from pwn import *

# Configuration
PROCESS = []        # Change this to your target process for dev

HOST = "localhost"  # Change this to your target host
PORT = 4444         # Change this to your target port

r = process(PROCESS)
# r = remote(HOST, PORT)

r.interactive()

