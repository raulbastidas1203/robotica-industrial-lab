"""Build locally and publish an isolated static checkout to GitHub Pages."""
import os, pathlib, shutil, subprocess, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
def run(*args, **kwargs):
    subprocess.run(args, cwd=ROOT, check=True, **kwargs)

run('npm', 'test')
run('npm', 'run', 'build', env={**os.environ, 'GITHUB_PAGES': 'true'})
remote = subprocess.check_output(['git', 'remote', 'get-url', 'origin'], cwd=ROOT, text=True).strip()
with tempfile.TemporaryDirectory(prefix='robotica-publish-') as directory:
    checkout = pathlib.Path(directory) / 'pages'
    run('git', 'clone', '--single-branch', '--branch', 'gh-pages', remote, str(checkout))
    # Only generated files in the isolated temporary branch checkout are replaced.
    for item in checkout.iterdir():
        if item.name == '.git':
            continue
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()
    shutil.copytree(ROOT / 'dist', checkout, dirs_exist_ok=True)
    (checkout / '.nojekyll').touch()
    run('git', '-C', str(checkout), 'add', '.')
    changed = subprocess.run(['git', '-C', str(checkout), 'diff', '--cached', '--quiet']).returncode
    if changed:
        run('git', '-C', str(checkout), 'commit', '-m', 'Update compiled robotics laboratory')
        run('git', '-C', str(checkout), 'push', 'origin', 'gh-pages')
    else:
        print('Published branch is already up to date.')
print('Static branch updated. Check GitHub Pages deployment status before reporting publication complete.')
