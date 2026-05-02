# In backend/utils/git_loader.py

from git import Repo
from pathlib import Path

class GitLoader:
    def __init__(self, repo_path):
        self.repo = Repo(repo_path)
    
    def get_recent_commits(self, limit=50):
        """Extract last 50 commits"""
        commits = list(self.repo.iter_commits(max_count=limit))
        return [
            {
                "hash": c.hexsha[:8],
                "message": c.message.strip(),
                "author": c.author.name,
                "date": c.committed_datetime.isoformat(),
                "diff_stat": c.stats.total
            }
            for c in commits
        ]
    
    def get_commit_diff(self, commit_hash):
        """Get diff for a commit"""
        commit = self.repo.commit(commit_hash)
        diffs = commit.parents[0].diff(commit) if commit.parents else []
        return [d.diff.decode() for d in diffs if d.diff]
    
    def get_file_list(self):
        """Get all Python files"""
        return list(Path(self.repo.working_dir).glob("**/*.py"))

# Usage:
# loader = GitLoader("path/to/repo")
# commits = loader.get_recent_commits()
# files = loader.get_file_list()