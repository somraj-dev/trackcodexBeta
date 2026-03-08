FROM codercom/code-server:latest

# Switch to root to install dependencies and modify code-server files
USER root

# Install Node.js to run the rebranding script
RUN apt-get update && apt-get install -y curl git && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /tmp/quantaforze

# Copy necessary files for rebranding
COPY scripts/rebrand-ide.js ./scripts/rebrand-ide.js
COPY official-logo.png ./official-logo.png
COPY package.json ./package.json

# Run the rebranding script
# Set CODE_SERVER_DIR to the location where codercom installs it
ENV CODE_SERVER_DIR=/usr/lib/code-server
RUN cd scripts && node rebrand-ide.js

# Switch back to the default 'coder' user
USER coder

# Fix "dubious ownership" git error when mounting Windows volumes into Linux
RUN git config --global --add safe.directory "*"

# Add workspace folder
WORKDIR /home/workspace

# Set the default environment variables
ENV CONNECTION_TOKEN=trackcodex

# Start code-server without auth on port 8080 (TrackCodex iframes handle security via layout)
CMD ["code-server", "--auth", "none", "--bind-addr", "0.0.0.0:8080", "--disable-telemetry", "--disable-update-check", "/home/workspace"]
