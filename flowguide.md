**Bookstore Web App: Developer Git & Workflow Guide**
This guide details the mandatory practices for Git branching and commit messaging to maintain a clean, consistent, and collaborative monorepo history.
1. **Branching Strategy:** Simplified Gitflow
We use a simplified Gitflow model. All work must be isolated into feature branches.

Branch Roles

| Branch Name | Status | Purpose | Rules |

| ***main*** | Stable (Production) | Always reflects the latest stable version. | Never commit directly. Only accepts merges from develop via Pull Request (PR). |

| ***develop*** | Integrated (Latest) | The main integration branch for all new features. | Never commit directly. Only accepts merges from approved feature branches. |

| ***feat/<description>*** | In Progress (Feature) | Used for all new feature development. | Must be branched off of develop. |

| ***fix/<description>*** | In Progress (Bug) | Used for all bug fixes (outside of a feature). | Must be branched off of develop. |

Feature Workflow (Backend & Frontend Collaboration)<br>
When developing a feature that spans both backend/ and frontend/ (e.g., submitting an order):<br>
Define Contract: Developers must first agree on the exact API endpoint (POST /api/orders/) and the full JSON request/response schema.<br>
Separate Branches: Each developer creates their own branch off of develop.<br>
Backend Example: feat/api-submit-order<br>
Frontend Example: feat/ui-checkout-form<br>
Parallel Development:<br>
The backend developer can use tools like Postman/Insomnia to test the API in isolation.<br>
The frontend developer can use mock data (fake JSON responses) to build the UI concurrently.<br>
Integration: The frontend integrates the real API once the backend PR is approved and merged into develop.<br>
Merge: Both developers submit separate PRs for their respective branches to be merged into develop.<br>

2. **Commit Message Convention** (Conventional Commits)
All commit messages must use a standardized prefix to quickly describe the nature of the change.

Format
<type>(<scope>): <description>

[Optional body explaining WHAT and WHY]


Required Types
| Type | When to Use | Example |

| ***feat*** | A new feature or capability. | feat: add subscription plan model and logic |

| ***fix*** | A bug fix (e.g., an incorrect calculation or data validation). | fix(ecomm): correct price calculation on discounted items |

| ***docs*** | Changes to documentation (READMEs, comments, this guide). | docs: update setup instructions for local development |

| ***style*** | Code formatting (tabs, semicolons, spacing) - NO logic change. | style(backend): apply black formatting to serializers.py |

| ***refactor*** | Code restructuring without changing external behavior. | refactor(frontend): move cart logic into dedicated hook |

| ***test*** | Adding or correcting tests. | test(ecomm): add unit test for license expiry check |

| ***chore*** | Routine tasks, configuration, or dependency updates. | chore: update django-rest-framework to latest version |

General Commit **Rules**<br>
**Atomic**: Each commit should represent one logical change. Avoid mixing a fix with a feat.<br>
**Imperative Mood**: Use verbs like "add," "change," or "fix" (e.g., "add authentication," not "adding authentication").<br>
**Scope** (Recommended): Use parentheses to denote the affected project or application (backend, frontend, ecomm, social, etc.).<br> Example: **feat(frontend): create new BookCard component.**<br>
