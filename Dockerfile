FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production

COPY dist/ ./dist/
COPY serve.ts ./serve.ts
COPY src/auth.ts src/db.ts src/auth-helpers.ts ./src/

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "serve.ts"]
