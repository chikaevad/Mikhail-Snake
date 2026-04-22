# Next.js 16 Template

## Requirements

- [fnm](https://github.com/Schniz/fnm)
- [docker](https://docker.com)

## Usage

Before the application can be started, you need to install the necessary tools.

```sh
fnm use  # set node version
corepack enable && corepack prepare  # set package manager
pnpm i  # install dependencies
```

Get env variables from the example file:

```bash
mv .env.example .env
```

You can start a local postgres instance using docker compose:

```sh
docker compose up -d postgres
```

You can generate and run migrations like this:

```sh
pnpm db:generate
pnpm db:migrate
```

You can now start the application:

```sh
pnpm dev
```

## Code checks and format:

Checks:

```sh
pnpm checks
```

Code format:

```sh
pnpm format
```
