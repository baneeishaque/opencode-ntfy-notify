# Contributing

1. Open an issue describing the change before large work.
2. Fork, branch from `main` (`feat/…`, `fix/…`), keep diffs small and scoped.
3. Match the existing style: defensive hooks, no new runtime dependencies
   without prior discussion, never let the plugin throw into a session.
4. Test against a real opencode run and note the results in the PR.
5. One concern per PR.
