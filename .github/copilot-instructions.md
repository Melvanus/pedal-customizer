## Development Guidelines

- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.
- Dont change the FEATURE_ROADMAP.md unless explicitly instructed by the user.
- If you generate text that is displayed to the user, make it funny, sometimes a little quirky or sarcastic. Nerd humor and cross references are appreciated.

## Git Workflow & Version Control

**IMPORTANT: This project uses git for version control.**

- **Before major changes:** Check `git status` to see current state
- **After completing a feature or major rework:** 
  - Run `git add .`
  - Commit with descriptive message: `git commit -m "feat: description of changes"`
  - Examples:
    - `git commit -m "feat: add landing page with statistics"`
    - `git commit -m "fix: resolve pricing calculation bug"`
    - `git commit -m "refactor: optimize component performance"`
    - `git commit -m "style: update dark theme colors"`
- **When making breaking changes:** Mention it in commit message
- **If uncertain about changes:** Suggest user review with `git diff` before committing

### When to Commit

Commit after:
- Adding new features or pages
- Major refactoring or restructuring
- Fixing significant bugs
- Updating pricing or data structures
- Changing design/layout significantly
- Adding new dependencies or configuration

### Best Practices

- Make atomic commits (one logical change per commit)
- Write clear, descriptive commit messages
- Test changes before committing (dont run `npm run build` to verify, build takes too long)
- Check for errors with TypeScript before committing
- Don't commit node_modules or build artifacts (already in .gitignore)

## Project-Specific Guidelines

- This is a Next.js 13+ App Router project with TypeScript
- Uses Tailwind CSS for styling (inline styles for component-specific styling)
- Dark theme with black & white design aesthetic
- Pricing in EUR (customerPriceEUR field)
- Data stored in JSON files (Enclosures/*)
- Images served via custom API route
- No external database or backend (static data only)

## Code Quality

- Always check for TypeScript errors before finalizing changes
- Ensure responsive design considerations
- Maintain dark theme consistency (#0a0a0a background, #1a1a1a cards, white accents)
- Keep components performant (avoid unnecessary re-renders)
- Use semantic HTML and accessible patterns
- Follow existing code structure and naming conventions
