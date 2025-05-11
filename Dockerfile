FROM oven/bun:slim AS base
WORKDIR /usr/src/app

# install production dependencies
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY . .

USER root
RUN chown -R bun:bun /usr/src/app

RUN apt-get update && apt-get install -y ghostscript graphicsmagick

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]