## Settings up Spec-Kit

This project is developed using Github's Spec-Kit (https://github.com/github/spec-kit)

### Installing Spec-Kit

If spec-kit is not installed, follow the instructions here to install: https://github.github.io/spec-kit/installation.html

```bash
uv tool install specify-cli
```

### Initializing the project

To initialize the project for spec-kit run the following, subbing out `--integration claude` to match the given environment.

```bash
specify init --here --script py --integration claude --force
```
