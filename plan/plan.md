# Save the existing project to GitHub

## Objective
Provide instructions for saving the current project to a GitHub repository through the built-in Save to GitHub feature. No application development or automatic upload is proposed.

## Proposed scope
- Explain connecting a GitHub account and selecting an existing repository or creating a new one.
- Explain saving the current project and saving later updates.
- Leave account authorization, repository ownership, repository selection, and the save action under the user's control.

## Assumptions and choices
- A private repository is recommended unless public sharing is explicitly intended.
- No GitHub account, repository, or branch has been selected on the user's behalf.
- Sensitive credentials, private keys, and private configuration must be excluded before saving, regardless of repository visibility.

## Boundaries
- Saving to GitHub does not resolve the security audit findings or establish that the application is production-secure.
- No application changes, security fixes, Firebase connection, or photo-storage changes are included.
- The guidance does not imply that a GitHub save has already occurred.