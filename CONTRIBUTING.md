
# Contributing to EarthOL

We're excited that you're interested in contributing to EarthOL! This guide will help you get started.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Pull Request Guidelines](#pull-request-guidelines)
5. [Style Guide](#style-guide)
6. [Reporting Issues](#reporting-issues)
7. [Community Guidelines](#community-guidelines)

---

## Code of Conduct

We have adopted the Contributor Covenant v2.0. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## How Can I Contribute?

### 🐛 Reporting Bugs
- Use the GitHub Issues tab
- Include steps to reproduce
- Include screenshots if helpful
- Describe expected vs actual behavior

### ✨ Suggesting Features
- Check if similar feature exists
- Explain why it would be useful
- Provide use cases
- Optional: Mockups or designs

### 📖 Documentation
- Fix typos
- Improve explanations
- Add missing documentation
- Translate content

### 💻 Code Contributions
- Fix bugs
- Implement new features
- Improve code quality
- Add tests

### 🎨 Design
- Improve UI/UX
- Create graphics or icons
- Design themes

---

## Development Setup

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Redis 7.0+
- Docker &amp; Docker Compose (optional but recommended)
- Git

### Local Development

1. **Fork and Clone**
   ```bash
   git clone https://github.com/[YOUR-USERNAME]/earthol-community.git
   cd earthol-community
   git remote add upstream https://github.com/earthol/earthol-community.git
   ```

2. **Docker Setup (Recommended)**
   ```bash
   docker-compose up -d
   ```

3. **Manual Setup**
   - Backend: `cd server &amp;&amp; npm install &amp;&amp; npm run dev`
   - Frontend: `cd client &amp;&amp; npm install &amp;&amp; npm run dev`

4. **Branch Workflow**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

5. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   # or
   git commit -m "fix: resolve annoying bug"
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then go to GitHub and create a Pull Request.

---

## Pull Request Guidelines

### PR Title Format

Please use conventional commits:

```
&lt;type&gt;: &lt;description&gt;
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Build/tooling changes

Examples:
- `feat: add dark mode toggle`
- `fix: resolve login redirect issue`
- `docs: update installation guide`

### PR Requirements

- [ ] The PR title follows conventional commits
- [ ] Code passes existing tests
- [ ] New features have tests
- [ ] Documentation updated if needed
- [ ] One feature/bugfix per PR
- [ ] PR description explains the change

### Review Process

1. PR submitted
2. Automated checks run
3. Maintainers review
4. Requested changes addressed
5. Approved and merged

---

## Style Guide

### General

- Use TypeScript
- Write clear comments
- Follow existing patterns
- Keep functions focused

### Frontend (Vue 3)

```vue
&lt;script setup lang="ts"&gt;
// Use Composition API
import { ref, computed } from 'vue'

// Component name: PascalCase
// Props: camelCase
// Events: kebab-case
&lt;/script&gt;

&lt;template&gt;
  &lt;!-- Classes: BEM or utility-first --&gt;
&lt;/template&gt;
```

### Backend (Express)

```typescript
// Use async/await
// Validate inputs
// Error handling
// Proper logging
```

### Git Commits

```
&lt;type&gt;(&lt;scope&gt;): &lt;subject&gt;

&lt;body&gt;

&lt;footer&gt;
```

Example:
```
feat(forum): add post edit functionality

Add edit button on post detail page
Add API endpoint for updating posts
Add validation for post edits

Closes #123
```

---

## Reporting Issues

### Bug Reports

Use this template:

```
**Describe the bug:**
A clear and concise description of what the bug is.

**To Reproduce:**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior:**
A clear and concise description of what you expected to happen.

**Screenshots:**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node.js version: [e.g., 20.10]
```

### Feature Requests

Use this template:

```
**Is your feature request related to a problem? Please describe:**
A clear and concise description of what the problem is.

**Describe the solution you'd like:**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered:**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context:**
Add any other context or screenshots about the feature request here.
```

---

## Community Guidelines

### Be Respectful

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism

### Be Helpful

- Answer questions if you can
- Share knowledge
- Help new contributors get started

### Be Collaborative

- Work together
- Give and receive feedback
- Celebrate each other's achievements

---

## Recognition

Contributors will be added to our CONTRIBUTORS.md file!

---

## Questions?

If you have any questions, feel free to:
- Open an Issue
- Join our Discord
- Email us: contribute@earthol.org

---

**Thank you for contributing to EarthOL! 💚**
