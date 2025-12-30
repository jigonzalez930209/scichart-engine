# Contributing to SciChart Engine

First off, thank you for considering contributing to SciChart Engine! It's people like you that make it a great tool for the scientific community.

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all.

1. **Be Respectful**: Treat everyone with respect, regardless of their level of experience, gender, orientation, or background.
2. **Be Constructive**: Provide helpful feedback. Focus on improvement, not criticism.
3. **Be Professional**: Maintain a professional tone in all communications (issues, PRs, comments).
4. **Be Collaborative**: We are building this together. Share knowledge and help others.

---

## Development Guidelines

### 1. Performance First
SciChart Engine is built for performance. Any change that significantly degrades rendering speed or increases memory consumption without a very strong justification will be rejected.
- Use `TypedArrays` for data.
- Avoid unnecessary React re-renders.
- Minimize garbage collection during the render loop.

### 2. Code Style
- Use TypeScript for everything.
- Follow the existing formatting (Prettier/ESLint).
- Keep functions small and focused.
- Document complex logic, but prefer self-documenting code.

### 3. Testing
- Bug fixes must include a regression test.
- New features must include unit tests and, if applicable, an example in the `examples/` folder.

---

## Pull Request Process

We are flexible with **how** you solve a problem, but **strict** with how you document it. A clear PR makes review faster and keeps the project history clean.

### 1. The PR Description (Mandatory)
Every PR must follow the template. If the description is missing or vague (e.g., "fixed bug"), the PR will be closed or marked as "Changes Requested" immediately.

**Required Sections:**
- **Problem**: What is currently wrong or missing?
- **Solution**: How did you fix it? Why this approach?
- **Impact**: Does this change any public APIs? Does it affect performance?
- **Verification**: How did you test this? (Screenshots/Videos for UI changes are highly encouraged).

### 2. Commit Messages
- Use descriptive commit messages.
- Avoid "fix", "update", "wip".
- Prefer conventional commits (e.g., `feat:`, `fix:`, `docs:`, `perf:`).

### 3. Review Process
- At least one maintainer must approve the PR.
- All CI checks must pass.
- Address all comments before requesting a second review.

---

## Branching Strategy
- `main`: Stable production-ready code.
- `develop`: Ongoing development.
- `feature/...`: New features.
- `fix/...`: Bug fixes.

Thank you for helping us build the fastest scientific charting engine for the web!
