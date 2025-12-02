---
on:
    workflow_dispatch:
    schedule:
        - cron: "0 14 * * 1-5" # 14:00 UTC weekdays
permissions:
    contents: read
    actions: read
    issues: read
    pull-requests: read
engine: copilot
timeout-minutes: 15
network:
    allowed: ["github", "defaults", "api.individual.githubcopilot.com:443"]
tools:
    github:
        allowed:
            [
                get_issue,
                list_issues,
                get_pull_request,
                list_pull_requests,
                list_commits,
            ]
    web-fetch:
    edit:
    bash: ["git status"]
safe-outputs:
    create-discussion:
        title-prefix: "[daily-report] "
        category: "General"
        max: 1
---

# Daily repository activity report

Generate a concise daily report (issues and pull requests) for the repository. Use the sanitized activation text if available: "${{ needs.activation.outputs.text }}".

Tasks:

1. List open issues created or updated in the last 24 hours with title, number, labels, and a short summary of activity (comments count, assignee).
2. List open pull requests created or updated in the last 24 hours with title, number, author, review status (approved/changes requested/pending), and latest commit summary.
3. Provide counts: new issues, updated issues, new PRs, updated PRs, open/closed counts.
4. Highlight any PRs with failing checks or merge conflicts.
5. Suggest top 3 PRs or issues to prioritize.

Formatting:

-   Keep the report under 800 words.
-   Provide bullet lists and short summaries.
