FROM node:18-alpine

# Install FFmpeg, Python, and yt-dlp for video processing
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    && pip3 install --break-system-packages --no-cache-dir yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Create temp directory for video processing
RUN mkdir -p /tmp/video-editor && chmod 777 /tmp/video-editor

EXPOSE 3001

# Run in production mode
CMD ["node", "dist/main"]