# book-launch-notifier
[![.github/workflows/ci.yaml](https://github.com/blck-snwmn/book-launch-notifier/actions/workflows/ci.yaml/badge.svg)](https://github.com/blck-snwmn/book-launch-notifier/actions/workflows/ci.yaml)
[![CodeQL](https://github.com/blck-snwmn/book-launch-notifier/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/blck-snwmn/book-launch-notifier/actions/workflows/github-code-scanning/codeql)
[![Deploy](https://github.com/blck-snwmn/book-launch-notifier/actions/workflows/deploy.yaml/badge.svg)](https://github.com/blck-snwmn/book-launch-notifier/actions/workflows/deploy.yaml)

## Development

CLI tools (`lefthook`) are managed by [aqua](https://aquaproj.github.io/) with versions pinned in [aqua.yaml](aqua.yaml).

### Install tools

Install aqua itself first (see the [aqua installation guide](https://aquaproj.github.io/docs/install)), then install the pinned tools:

```bash
aqua install
```

### Set up git hooks

[lefthook](lefthook.yml) runs lint and format checks on staged files before each commit. Register the hooks once after cloning:

```bash
lefthook install
```
