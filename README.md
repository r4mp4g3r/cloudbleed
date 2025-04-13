# SC3010 Computer Security CloudBleed Vulnerability Project by Group 63

An educational tool that demonstrates how the 2017 Cloudflare parser vulnerability (CloudBleed) worked, showing how memory leaks could expose sensitive data between different websites.

## Features

- Interactive visualization of how buffer overflows can leak data
- Simulated server memory containing sensitive data
- Comparison between vulnerable and fixed parsers
- Real-world scenario walkthrough

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/r4mp4g3r/cloudbleed.git
   cd cloudbleed/backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the server
   ```bash
   npm start
   ```

4. Open your browser and navigate to http://localhost:3000

## How It Works

This demonstration shows how Cloudflare's HTML parser vulnerability could leak sensitive information from one website to another when processing certain HTML patterns. The key components are:

- **Server Memory**: Simulates shared memory used by a CDN like Cloudflare
- **Vulnerable Parser**: Shows how improper bounds checking could leak memory
- **Fixed Parser**: Demonstrates the corrected behavior after the patch

## Screenshots

[Add screenshots here]

## Educational Purpose

This project is for educational purposes only. It demonstrates a historical vulnerability to help understand the importance of:

- Proper memory management
- Bounds checking in parsers
- Security implications of shared infrastructure

## License

MIT License

## Acknowledgments

- Inspired by the CloudBleed vulnerability discovered by Google's Project Zero in February 2017
