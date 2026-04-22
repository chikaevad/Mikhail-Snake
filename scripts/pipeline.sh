#!/bin/bash

pnpm format:check && pnpm lint && pnpm types && pnpm audit --audit-level=critical && pnpm build
