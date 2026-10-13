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

## Code Generation Rules

- Do not use `useMemo`. This is a performance optimization that will be added when it becomes necessary.
- Keep usage of `useEffect` to a minimum.
- Do not use `useRef` to store state unless it is absolutely necessary.
- Use React `Suspense` for loading state.
- Place `styled-component` definitions at the top of component files.
- Keep comments to a minimum. 1 sentence maximum.
- Do not use estoteric JS contructs like `Map` or `Set`. Stick to objects and arrays.
